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
