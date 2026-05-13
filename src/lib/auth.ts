import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "CANDIDATE";
};

const SESSION_COOKIE_NAME = "bail_bail_session";
// In production, this should be an environment variable. We use a default fallback for easy local dev.
const SECRET_KEY = process.env.JWT_SECRET || "super_secret_key_for_bail_bail_2026";
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    console.error("Failed to verify session");
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Keep the old name for backward compatibility during the transition
export async function getSimulatedUser(): Promise<SessionPayload | null> {
  return verifySession();
}
