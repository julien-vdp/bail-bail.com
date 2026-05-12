"use client";

import { useState, useTransition } from "react";
import { loginToDbExplorer } from "@/actions/db-explorer";
import { Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    startTransition(async () => {
      const res = await loginToDbExplorer(password);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm">
      <div className="flex flex-col items-center justify-center mb-8 text-slate-100">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">DB Explorer</h2>
        <p className="text-slate-400 text-sm mt-1">Accès restreint</p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
            required
          />
        </div>
        
        {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Accéder
        </button>
      </div>
    </form>
  );
}
