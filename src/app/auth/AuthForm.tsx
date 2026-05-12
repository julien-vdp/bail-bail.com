"use client";

import { useState, useTransition } from "react";
import { login, register } from "@/actions/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AuthForm() {
  const [role, setRole] = useState<"CANDIDATE" | "OWNER">("CANDIDATE");
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const action = mode === "LOGIN" ? login : register;
      const res = await action(formData, role);
      if (res.error) {
        setError(res.error);
      } else {
        router.push(role === "OWNER" ? "/admin" : "/compte");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Role Selection */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => { setRole("CANDIDATE"); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === "CANDIDATE" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Je suis Locataire
        </button>
        <button
          onClick={() => { setRole("OWNER"); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === "OWNER" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Je suis Propriétaire
        </button>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          {mode === "LOGIN" ? "Bon retour !" : "Créer un compte"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {role === "CANDIDATE" ? "Espace Candidat / Locataire" : "Espace Gestionnaire / Propriétaire"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Google Login Button */}
      <a
        href={`/api/auth/google?role=${role}`}
        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </a>

      <div className="flex items-center gap-4 my-2">
        <div className="h-px bg-slate-200 flex-1"></div>
        <span className="text-slate-400 text-sm font-medium">ou avec un email</span>
        <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {mode === "REGISTER" && role === "OWNER" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
            <input name="name" type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
        )}

        {mode === "REGISTER" && role === "CANDIDATE" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input name="firstName" type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input name="lastName" type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input name="phone" type="tel" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input name="email" type="email" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
          <input name="password" type="password" required minLength={6} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "LOGIN" ? "Se connecter" : "S'inscrire"}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => { setMode(mode === "LOGIN" ? "REGISTER" : "LOGIN"); setError(""); }}
          className="text-sm text-slate-500 hover:text-primary transition-colors font-medium"
        >
          {mode === "LOGIN" 
            ? "Pas encore de compte ? S'inscrire" 
            : "Déjà un compte ? Se connecter"}
        </button>
      </div>

    </div>
  );
}
