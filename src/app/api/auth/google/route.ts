import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "CANDIDATE"; // "OWNER" or "CANDIDATE"

  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    // If no client ID, redirect back with an error
    return NextResponse.redirect(new URL(`/auth?error=google_not_configured`, request.url));
  }

  // Construct the redirect URI dynamically based on the current origin
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  // Construct the Google OAuth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "email profile");
  googleAuthUrl.searchParams.set("access_type", "online");
  
  // Pass the requested role in the state parameter
  googleAuthUrl.searchParams.set("state", role);

  return NextResponse.redirect(googleAuthUrl.toString());
}
