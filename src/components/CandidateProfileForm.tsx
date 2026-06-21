"use client";

import { useActionState, useState } from "react";
import { saveCandidateProfileAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Landmark, ShieldAlert, GraduationCap, CheckCircle2 } from "lucide-react";

export function CandidateProfileForm({
  applicationId,
  candidate,
  property,
}: {
  applicationId: string;
  candidate: any;
  property: any;
}) {
  const [state, formAction, isPending] = useActionState(saveCandidateProfileAction, null);
  const [employmentStatus, setEmploymentStatus] = useState(candidate.employmentStatus || "CDI");
  const [hasGuarantor, setHasGuarantor] = useState<boolean>(candidate.hasGuarantor || false);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-[#1463FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-[#1463FF]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#092B5A] tracking-tight">Vos informations de situation</h1>
        <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
          Renseignez vos coordonnées et votre situation professionnelle afin de générer votre dossier sur-mesure.
        </p>
      </div>

      {state?.error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium text-center">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="hasGuarantor" value={hasGuarantor.toString()} />

        {/* 1. Coordonnées */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">1. Vos coordonnées</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-slate-700 font-semibold">Prénom</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={candidate.firstName}
                required
                className="rounded-xl border-slate-200 focus:border-[#1463FF]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-slate-700 font-semibold">Nom</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={candidate.lastName}
                required
                className="rounded-xl border-slate-200 focus:border-[#1463FF]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={candidate.email}
                required
                className="rounded-xl border-slate-200 focus:border-[#1463FF]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-slate-700 font-semibold">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={candidate.phone}
                required
                className="rounded-xl border-slate-200 focus:border-[#1463FF]"
              />
            </div>
          </div>
        </div>

        {/* 2. Situation Professionnelle */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">2. Votre situation professionnelle</h3>
          <div className="space-y-3">
            <Label className="text-slate-700 font-semibold">Activité actuelle</Label>
            <select
              name="employmentStatus"
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1463FF] focus:border-[#1463FF] font-medium text-slate-800"
            >
              <option value="CDI">Salarié en CDI</option>
              <option value="CDD">Salarié en CDD / Intérim / Alternance</option>
              <option value="PUBLIC_SERVANT">Fonctionnaire / Service public</option>
              <option value="SELF_EMPLOYED">Indépendant / Freelance / Entrepreneur</option>
              <option value="RETIRED">Retraité(e)</option>
              <option value="STUDENT">Étudiant(e)</option>
              <option value="UNEMPLOYED">Recherche d'emploi</option>
              <option value="OTHER">Autre situation</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="declaredMonthlyIncome" className="text-slate-700 font-semibold">Revenu net mensuel (€)</Label>
            <Input
              id="declaredMonthlyIncome"
              name="declaredMonthlyIncome"
              type="number"
              min="0"
              placeholder="ex: 1500"
              defaultValue={candidate.declaredMonthlyIncome || ""}
              required
              className="rounded-xl border-slate-200 focus:border-[#1463FF]"
            />
            <p className="text-xs text-slate-400">
              Indiquez la somme de vos revenus nets mensuels (hors aides au logement).
            </p>
          </div>
        </div>

        {/* 3. Garant (Si accepté) */}
        {property.acceptsGuarantor !== false && (
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">3. Garant</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-slate-800 font-bold text-sm md:text-base">Avez-vous un garant ?</Label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Un garant (physique ou moral) s'engage à payer votre loyer en cas de défaut de votre part.
                  </p>
                </div>
                
                {/* Custom handshake vector illustration */}
                <svg width="60" height="60" viewBox="0 0 80 80" className="shrink-0 hidden sm:block" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="38" fill="white" stroke="#E2E8F0" strokeWidth="2" />
                  <path d="M22 45 C28 45, 30 38, 38 38 C42 38, 45 42, 50 45" stroke="#092B5A" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M58 45 C52 45, 50 38, 42 38 C38 38, 35 42, 30 45" stroke="#092B5A" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="34" y="41" width="12" height="8" rx="3" fill="white" stroke="#092B5A" strokeWidth="2" />
                  <path d="M40 33 C40 33, 42 30, 40 28 C38 26, 36 28, 36 28" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setHasGuarantor(true)}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    hasGuarantor
                      ? "bg-[#1463FF] border-[#1463FF] text-white shadow-md shadow-[#1463FF]/20"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {hasGuarantor && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  Oui, j'ai un garant
                </button>
                <button
                  type="button"
                  onClick={() => setHasGuarantor(false)}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    !hasGuarantor
                      ? "bg-[#1463FF] border-[#1463FF] text-white shadow-md shadow-[#1463FF]/20"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {!hasGuarantor && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  Non, pas de garant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning if student without guarantor in GLI */}
        {property.hasGli && employmentStatus === "STUDENT" && !hasGuarantor && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-semibold">
              Note d'éligibilité : Pour un logement sous Garantie Loyers Impayés (GLI), les profils étudiants doivent généralement fournir un garant solvable pour que le dossier soit accepté par l'assurance.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 text-base font-bold bg-[#1463FF] hover:bg-[#004BE5] text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
            ) : (
              "Valider et générer mes pièces justificatives"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
