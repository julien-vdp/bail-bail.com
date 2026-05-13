import Link from "next/link";
import { Shield, Home, FolderOpen } from "lucide-react";
import { getSimulatedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { SwitchRoleButton } from "@/components/SwitchRoleButton";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSimulatedUser();
  if (!user || user.role !== "OWNER") {
    redirect("/");
  }

  const candidate = user.email ? await prisma.candidate.findUnique({ where: { email: user.email } }) : null;
  const hasOtherRole = !!candidate;

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">Espace Propriétaire</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
            <Home className="w-5 h-5 text-slate-400" />
            <span className="font-medium">Tableau de bord</span>
          </Link>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
            <FolderOpen className="w-5 h-5 text-slate-400" />
            <span className="font-medium">Mes Logements</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          {hasOtherRole && <SwitchRoleButton variant="sidebar" className="hover:bg-slate-800 rounded-md mb-2" />}
          <LogoutButton variant="sidebar" className="hover:bg-slate-800 rounded-md" />
          <Link href="/" className="flex items-center gap-3 px-3 py-2 mt-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-md">
            <span className="font-medium text-sm">Retour au site public</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
        {children}
      </main>
    </div>
  );
}
