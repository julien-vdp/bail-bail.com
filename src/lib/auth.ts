import { cookies } from "next/headers";

export type SimulatedUser = {
  id: string;
  name: string;
  role: "OWNER" | "CANDIDATE";
};

const SESSION_COOKIE_NAME = "bail_bail_session";

export async function getSimulatedUser(): Promise<SimulatedUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const user = JSON.parse(sessionCookie.value) as SimulatedUser;
    return user;
  } catch (e) {
    return null;
  }
}
