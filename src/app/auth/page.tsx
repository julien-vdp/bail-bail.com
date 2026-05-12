import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "./AuthForm";

export default async function AuthPage() {
  const session = await verifySession();
  
  if (session) {
    redirect(session.role === "OWNER" ? "/admin" : "/compte");
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
