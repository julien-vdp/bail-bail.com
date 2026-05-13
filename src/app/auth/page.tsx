import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "./AuthForm";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const session = await verifySession();
  const { redirect: redirectUrl } = await searchParams;
  
  if (session) {
    // Si l'utilisateur a une session et arrive sur /auth avec un redirectUrl,
    // c'est probablement parce que la page de destination l'a rejeté (mauvais rôle).
    // Pour éviter une boucle infinie, on le renvoie toujours vers son tableau de bord.
    redirect(session.role === "OWNER" ? "/admin" : "/compte");
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <AuthForm redirectUrl={redirectUrl} />
        </div>
      </div>
    </div>
  );
}
