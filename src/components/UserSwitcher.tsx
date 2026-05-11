import { prisma } from "@/lib/prisma";
import { getSimulatedUser } from "@/lib/auth";
import { UserSwitcherClient } from "./UserSwitcherClient";

export async function UserSwitcher() {
  const simulatedUser = await getSimulatedUser();
  const owners = await prisma.user.findMany({ where: { role: "OWNER" } });
  const candidates = await prisma.candidate.findMany({ take: 10 });

  return (
    <UserSwitcherClient 
      currentUser={simulatedUser} 
      owners={owners} 
      candidates={candidates} 
    />
  );
}
