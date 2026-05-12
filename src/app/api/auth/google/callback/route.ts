import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") as "OWNER" | "CANDIDATE" | null;
  const error = searchParams.get("error");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(new URL(`/auth?error=google_auth_failed`, baseUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/auth?error=google_not_configured`, baseUrl));
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description || "Token exchange failed");

    // 2. Fetch user profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const profileData = await profileResponse.json();
    if (!profileData.email) throw new Error("No email found in Google profile");

    const email = profileData.email;
    const role = state || "CANDIDATE"; // Fallback to candidate

    // 3. Find or Create User/Candidate
    let sessionId = "";
    let sessionName = "";

    if (role === "OWNER") {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profileData.name || email.split("@")[0],
            role: "OWNER",
          },
        });
      }
      sessionId = user.id;
      sessionName = user.name;
    } else {
      let candidate = await prisma.candidate.findUnique({ where: { email } });
      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            email,
            firstName: profileData.given_name || email.split("@")[0],
            lastName: profileData.family_name || " ",
            phone: "0000000000", // Required field in schema, needs a placeholder
          },
        });
      }
      sessionId = candidate.id;
      sessionName = `${candidate.firstName} ${candidate.lastName}`;
    }

    // 4. Create local session
    await createSession({
      id: sessionId,
      name: sessionName,
      role: role,
    });

    // 5. Redirect to destination
    return NextResponse.redirect(new URL(role === "OWNER" ? "/admin" : "/compte", baseUrl));

  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.redirect(new URL(`/auth?error=google_auth_failed`, baseUrl));
  }
}
