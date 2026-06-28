"use client";

import { useState, useTransition } from "react";
import { updateAccount, logout } from "@/actions/auth";
import { Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { SwitchRoleButton } from "@/components/SwitchRoleButton";
import { LogoutButton } from "@/components/LogoutButton";
import { useRouter } from "next/navigation";

export function AccountForm({ initialData, hasOtherRole = false }: { initialData: any, hasOtherRole?: boolean }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isOwner = initialData.role === "OWNER";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateAccount(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Mises à jour enregistrées avec succès.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email (Lecture seule)</label>
          <input type="email" value={initialData.email} disabled className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-4 py-2 text-center" />
        </div>

        {isOwner ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
            <input name="name" type="text" defaultValue={initialData.name} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:ring-2 focus:ring-primary outline-none" />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input name="firstName" type="text" defaultValue={initialData.firstName} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input name="lastName" type="text" defaultValue={initialData.lastName} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input name="phone" type="tel" defaultValue={initialData.phone} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Situation professionnelle</label>
              <select name="employmentStatus" defaultValue={initialData.employmentStatus || "CDI"} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:ring-2 focus:ring-primary outline-none bg-white">
                <option value="CDI">CDI hors période d'essai</option>
                <option value="CDI_MOBILITY">CDI en mobilité</option>
                <option value="PUBLIC_SERVANT">Fonctionnaire</option>
                <option value="SELF_EMPLOYED">Travailleur indépendant</option>
                <option value="CDD">CDD</option>
                <option value="RETIRED">Retraité</option>
                <option value="STUDENT">Étudiant / apprenti</option>
                <option value="UNEMPLOYED">Demandeur d'emploi</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Revenu net mensuel (€)</label>
              <input name="declaredMonthlyIncome" type="number" min="0" defaultValue={initialData.declaredMonthlyIncome || 0} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </>
        )}
      </div>

      <div className="border-t border-slate-200 pt-6 mt-6 text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Sécurité</h3>
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
          <input name="password" type="password" placeholder="Laisser vide pour ne pas modifier" minLength={6} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 mt-6 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-4">
          <LogoutButton variant="ghost" />
          {hasOtherRole && <SwitchRoleButton variant="ghost" />}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer les modifications
        </button>
      </div>

    </form>
  );
}
