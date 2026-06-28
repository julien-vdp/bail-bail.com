"use client";

import { useActionState, useState, useEffect } from "react";
import { saveCandidateProfileAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Landmark, ShieldAlert, GraduationCap, CheckCircle2, AlertTriangle, Users, Plus, Trash2, Heart } from "lucide-react";

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
  
  // Basic info states
  const [firstName, setFirstName] = useState(candidate?.firstName || "");
  const [lastName, setLastName] = useState(candidate?.lastName || "");
  const [email, setEmail] = useState(candidate?.email || "");
  const [phone, setPhone] = useState(candidate?.phone || "");
  const [employmentStatus, setEmploymentStatus] = useState(candidate?.employmentStatus || "CDI");
  const [declaredMonthlyIncome, setDeclaredMonthlyIncome] = useState(candidate?.declaredMonthlyIncome?.toString() || "");
  const [hasGuarantor, setHasGuarantor] = useState<boolean>(candidate?.hasGuarantor || false);

  // GLI conditional fields
  const [isInProbationPeriod, setIsInProbationPeriod] = useState<boolean>(candidate?.isInProbationPeriod || false);
  const [cddRemainingMonths, setCddRemainingMonths] = useState<number>(candidate?.cddRemainingMonths || 12);
  const [selfEmployedYears, setSelfEmployedYears] = useState<number>(candidate?.selfEmployedYears || 2);
  const [isCdiMobility, setIsCdiMobility] = useState<boolean>(candidate?.isCdiMobility || false);
  const [isApprentice, setIsApprentice] = useState<boolean>(candidate?.isApprentice || false);
  const [isColocation, setIsColocation] = useState<boolean>(candidate?.isColocation || false);
  const [roommatesCount, setRoommatesCount] = useState<number>(candidate?.roommatesCount || 0);
  const [retiredStatus, setRetiredStatus] = useState<string>("SINGLE"); // SINGLE or COUPLE

  // Roommates list
  const [roommates, setRoommates] = useState<any[]>(candidate?.roommates || []);

  // Guarantor details
  const [guarantorFirstName, setGuarantorFirstName] = useState(candidate?.guarantor?.firstName || "");
  const [guarantorLastName, setGuarantorLastName] = useState(candidate?.guarantor?.lastName || "");
  const [guarantorEmploymentStatus, setGuarantorEmploymentStatus] = useState(candidate?.guarantor?.employmentStatus || "CDI");
  const [guarantorDeclaredMonthlyIncome, setGuarantorDeclaredMonthlyIncome] = useState(candidate?.guarantor?.declaredMonthlyIncome?.toString() || "");
  const [guarantorFiscalResidenceInFrance, setGuarantorFiscalResidenceInFrance] = useState<boolean>(candidate?.guarantor?.fiscalResidenceInFrance !== false);

  useEffect(() => {
    if (state?.success) {
      window.location.href = `/dossier/${applicationId}`;
    }
  }, [state, applicationId]);

  // Sync roommates count and list
  useEffect(() => {
    if (isColocation) {
      const currentLength = roommates.length;
      if (roommatesCount > currentLength) {
        // Add roommates
        const added = Array.from({ length: roommatesCount - currentLength }).map((_, i) => ({
          id: `new_${Date.now()}_${i}`,
          firstName: "",
          lastName: "",
          employmentStatus: "CDI",
          declaredMonthlyIncome: 0
        }));
        setRoommates([...roommates, ...added]);
      } else if (roommatesCount < currentLength) {
        // Remove from end
        setRoommates(roommates.slice(0, roommatesCount));
      }
    } else {
      setRoommates([]);
      setRoommatesCount(0);
    }
  }, [roommatesCount, isColocation]);

  // Solvency calculations
  const rentAmount = property.rentWithCharges || property.rent || 0;
  const candidateIncome = Number(declaredMonthlyIncome) || 0;
  const roommatesIncome = isColocation ? roommates.reduce((sum, r) => sum + (Number(r.declaredMonthlyIncome) || 0), 0) : 0;
  const totalIncome = candidateIncome + roommatesIncome;
  const effortRate = totalIncome > 0 ? Math.round((rentAmount / totalIncome) * 100) : 0;

  // GLI threshold determination based on situation
  let targetThreshold = 37;
  let hasGliIssue = false;
  let gliIssueMessage = "";

  const gliActive = property.gliMode === "STRICT" || property.gliMode === "INDICATIVE" || property.hasGli;

  if (gliActive) {
    if (employmentStatus === "CDI" || employmentStatus === "CDI_MOBILITY") {
      if (isInProbationPeriod) {
        targetThreshold = 37;
        hasGliIssue = true;
        gliIssueMessage = "Ce profil peut ne pas être éligible selon certaines garanties loyers impayés (période d'essai).";
      } else if (isCdiMobility || employmentStatus === "CDI_MOBILITY") {
        targetThreshold = 30;
      } else {
        targetThreshold = 37;
      }
    } else if (employmentStatus === "PUBLIC_SERVANT") {
      targetThreshold = 37;
    } else if (employmentStatus === "SELF_EMPLOYED") {
      targetThreshold = 33;
      if (selfEmployedYears < 2) {
        hasGliIssue = true;
        gliIssueMessage = "Certaines GLI demandent au moins 2 ans d'activité pour prendre en compte ce profil.";
      }
    } else if (employmentStatus === "CDD") {
      targetThreshold = 25;
      if (cddRemainingMonths < 12) {
        hasGliIssue = true;
        gliIssueMessage = "Ce profil peut être refusé par certaines GLI (contrat de moins de 12 mois), sauf cas particulier comme la colocation.";
      }
    } else if (employmentStatus === "RETIRED") {
      targetThreshold = 37;
    } else if (employmentStatus === "STUDENT") {
      targetThreshold = 37;
      if (property.acceptsStudents === false) {
        hasGliIssue = true;
        gliIssueMessage = "L'assurance GLI de ce logement n'accepte pas les profils étudiants.";
      } else if (!hasGuarantor) {
        hasGliIssue = true;
        gliIssueMessage = "Un garant solvable est obligatoire pour les étudiants sous cette GLI.";
      }
    } else {
      // Unstable profiles
      targetThreshold = 33;
      if (property.acceptsUnstableProfiles === false && !isColocation) {
        hasGliIssue = true;
        gliIssueMessage = "Ce profil atypique (intérim, chômage...) peut être refusé par l'assurance GLI.";
      }
    }
  }

  // Solvency status text & colors
  let solvencyStatus = "compatible"; // compatible, verify, complementary
  let solvencyLabel = "semble compatible";
  let solvencyColorClass = "bg-green-50 border-green-200 text-green-800";
  let badgeColorClass = "bg-green-100 text-green-800";

  if (totalIncome === 0) {
    solvencyStatus = "verify";
    solvencyLabel = "à vérifier";
    solvencyColorClass = "bg-slate-50 border-slate-200 text-slate-600";
    badgeColorClass = "bg-slate-100 text-slate-600";
  } else if (hasGliIssue) {
    solvencyStatus = "complementary";
    solvencyLabel = "peut nécessiter une analyse complémentaire";
    solvencyColorClass = "bg-amber-50 border-amber-200 text-amber-800";
    badgeColorClass = "bg-amber-100 text-amber-800";
  } else if (effortRate > targetThreshold) {
    if (effortRate <= 40) {
      solvencyStatus = "verify";
      solvencyLabel = "à vérifier";
      solvencyColorClass = "bg-slate-50 border-slate-200 text-slate-700";
      badgeColorClass = "bg-slate-100 text-slate-800";
    } else {
      solvencyStatus = "complementary";
      solvencyLabel = "peut nécessiter une analyse complémentaire";
      solvencyColorClass = "bg-amber-50 border-amber-200 text-amber-800";
      badgeColorClass = "bg-amber-100 text-amber-800";
    }
  }

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
        <input type="hidden" name="isInProbationPeriod" value={isInProbationPeriod.toString()} />
        <input type="hidden" name="isCdiMobility" value={isCdiMobility.toString()} />
        <input type="hidden" name="isApprentice" value={isApprentice.toString()} />
        <input type="hidden" name="isColocation" value={isColocation.toString()} />
        <input type="hidden" name="roommatesCount" value={roommatesCount} />
        <input type="hidden" name="roommatesJson" value={JSON.stringify(roommates)} />

        {/* 1. Coordonnées */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">1. Vos coordonnées</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-slate-700 font-semibold">Prénom</Label>
              <Input
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="rounded-xl border-slate-200 focus:border-[#1463FF]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-slate-700 font-semibold">Nom</Label>
              <Input
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="rounded-xl border-slate-200 focus:border-[#1463FF]"
              />
            </div>
          </div>
        </div>

        {/* 2. Situation principale */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">2. Votre situation</h3>
          <div className="space-y-3">
            <Label className="text-slate-700 font-semibold">Quelle est votre situation principale ?</Label>
            <select
              name="employmentStatus"
              value={employmentStatus}
              onChange={(e) => {
                setEmploymentStatus(e.target.value);
                // Reset some conditional states
                setIsInProbationPeriod(false);
                setIsCdiMobility(false);
                setIsApprentice(false);
              }}
              className="flex h-12 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1463FF] focus:border-[#1463FF] font-medium text-slate-800 cursor-pointer"
            >
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

          {/* Menus conditionnels animés */}
          {employmentStatus === "CDI" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-[#092B5A] block">Êtes-vous en période d'essai ?</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  isInProbationPeriod ? "border-amber-500 bg-amber-50/50 text-amber-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={isInProbationPeriod} onChange={() => setIsInProbationPeriod(true)} className="sr-only" />
                  <span>Oui</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  !isInProbationPeriod ? "border-green-600 bg-green-50/50 text-green-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={!isInProbationPeriod} onChange={() => setIsInProbationPeriod(false)} className="sr-only" />
                  <span>Non</span>
                </label>
              </div>
              {isInProbationPeriod && gliActive && (
                <div className="p-2.5 bg-amber-50 text-amber-800 text-[11px] rounded-lg border border-amber-200 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>Ce profil peut ne pas être éligible selon certaines garanties loyers impayés.</span>
                </div>
              )}
            </div>
          )}

          {employmentStatus === "CDI_MOBILITY" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-[#092B5A] block">Avez-vous occupé un CDI pendant au moins 2 ans avant ce changement ?</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  isCdiMobility ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF]" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={isCdiMobility} onChange={() => setIsCdiMobility(true)} className="sr-only" />
                  <span>Oui</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  !isCdiMobility ? "border-slate-200 bg-white text-slate-600" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={!isCdiMobility} onChange={() => setIsCdiMobility(false)} className="sr-only" />
                  <span>Non</span>
                </label>
              </div>
            </div>
          )}

          {employmentStatus === "CDD" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-[#092B5A] block">Quelle est la durée restante de votre contrat à la date prévue du bail ?</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  cddRemainingMonths < 12 ? "border-amber-500 bg-amber-50/50 text-amber-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={cddRemainingMonths < 12} onChange={() => setCddRemainingMonths(6)} className="sr-only" />
                  <span>Moins de 12 mois</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  cddRemainingMonths >= 12 ? "border-green-600 bg-green-50/50 text-green-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={cddRemainingMonths >= 12} onChange={() => setCddRemainingMonths(12)} className="sr-only" />
                  <span>12 mois ou plus</span>
                </label>
              </div>
              {cddRemainingMonths < 12 && gliActive && (
                <div className="p-2.5 bg-amber-50 text-amber-800 text-[11px] rounded-lg border border-amber-200 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>Ce profil peut être refusé par certaines GLI, sauf cas particulier comme la colocation.</span>
                </div>
              )}
            </div>
          )}

          {employmentStatus === "SELF_EMPLOYED" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-[#092B5A] block">Depuis combien de temps exercez-vous cette activité ?</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  selfEmployedYears < 2 ? "border-amber-500 bg-amber-50/50 text-amber-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={selfEmployedYears < 2} onChange={() => setSelfEmployedYears(1)} className="sr-only" />
                  <span>Moins de 2 ans</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  selfEmployedYears >= 2 ? "border-green-600 bg-green-50/50 text-green-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={selfEmployedYears >= 2} onChange={() => setSelfEmployedYears(2)} className="sr-only" />
                  <span>2 ans ou plus</span>
                </label>
              </div>
              {selfEmployedYears < 2 && gliActive && (
                <div className="p-2.5 bg-amber-50 text-amber-800 text-[11px] rounded-lg border border-amber-200 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>Certaines GLI demandent au moins 2 ans d'activité pour prendre en compte ce profil.</span>
                </div>
              )}
            </div>
          )}

          {employmentStatus === "STUDENT" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <Checkbox id="isApprenticeCheck" checked={isApprentice} onCheckedChange={(checked) => setIsApprentice(checked === true)} />
                <span className="text-xs font-semibold text-slate-700">Je suis apprenti(e) ou alternant(e)</span>
              </label>

              <label className="text-xs font-bold text-[#092B5A] block">Disposez-vous d’une caution solidaire (garant) ?</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  hasGuarantor ? "border-green-600 bg-green-50/50 text-green-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={hasGuarantor} onChange={() => setHasGuarantor(true)} className="sr-only" />
                  <span>Oui</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  !hasGuarantor ? "border-amber-500 bg-amber-50/50 text-amber-800" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={!hasGuarantor} onChange={() => setHasGuarantor(false)} className="sr-only" />
                  <span>Non</span>
                </label>
              </div>

              {gliActive && !hasGuarantor && (
                <div className="p-2.5 bg-amber-50 text-amber-800 text-[11px] rounded-lg border border-amber-200 flex items-start gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>Attention : Ce profil peut être refusé par la GLI sans garant (caution obligatoire pour les étudiants).</span>
                </div>
              )}
            </div>
          )}

          {employmentStatus === "RETIRED" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-[#092B5A] block">Êtes-vous seul ou en couple ?</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  retiredStatus === "SINGLE" ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF]" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={retiredStatus === "SINGLE"} onChange={() => setRetiredStatus("SINGLE")} className="sr-only" />
                  <span>Seul</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                  retiredStatus === "COUPLE" ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF]" : "border-slate-200 bg-white"
                }`}>
                  <input type="radio" checked={retiredStatus === "COUPLE"} onChange={() => setRetiredStatus("COUPLE")} className="sr-only" />
                  <span>Couple</span>
                </label>
              </div>
              <p className="text-[10px] text-slate-500">
                L'analyse indicative utilisera cette information pour calculer le reste à vivre minimum requis.
              </p>
            </div>
          )}

          {/* Revenus */}
          <div className="space-y-1">
            <Label htmlFor="declaredMonthlyIncome" className="text-slate-700 font-semibold">
              {isColocation ? "Votre revenu net mensuel individuel (€)" : "Quel est votre revenu net mensuel global (€)"}
            </Label>
            <Input
              id="declaredMonthlyIncome"
              name="declaredMonthlyIncome"
              type="number"
              min="0"
              placeholder="ex: 2100"
              value={declaredMonthlyIncome}
              onChange={(e) => setDeclaredMonthlyIncome(e.target.value)}
              required
              className="rounded-xl border-slate-200 focus:border-[#1463FF]"
            />
            <p className="text-xs text-slate-400">
              Ressources nettes mensuelles avant impôt sur le revenu.
            </p>
          </div>
        </div>

        {/* 3. Option Colocation */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">3. Colocation</h3>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-800 font-bold text-sm">Candidature seul ou en colocation ?</Label>
                <p className="text-xs text-slate-500">Souhaitez-vous déclarer d'autres colocataires sur le bail ?</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsColocation(false)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    !isColocation ? "bg-[#092B5A] text-white" : "bg-white border text-slate-600"
                  }`}
                >
                  Seul
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsColocation(true);
                    if (roommatesCount === 0) setRoommatesCount(1);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    isColocation ? "bg-[#1463FF] text-white" : "bg-white border text-slate-600"
                  }`}
                >
                  Colocation
                </button>
              </div>
            </div>

            {isColocation && (
              <div className="space-y-4 pt-3 border-t border-slate-200 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-[#092B5A]">Combien de colocataires signeront le bail ?</Label>
                  <select
                    value={roommatesCount}
                    onChange={(e) => setRoommatesCount(Number(e.target.value))}
                    className="h-8 rounded-lg border text-xs font-bold bg-white text-slate-800"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} colocataire{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {roommates.map((rm, idx) => (
                    <div key={rm.id || idx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-inner">
                      <h4 className="text-xs font-bold text-[#1463FF] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Colocataire #{idx + 1}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Prénom"
                          value={rm.firstName}
                          onChange={(e) => {
                            const list = [...roommates];
                            list[idx].firstName = e.target.value;
                            setRoommates(list);
                          }}
                          className="h-9 text-xs"
                          required
                        />
                        <Input
                          placeholder="Nom"
                          value={rm.lastName}
                          onChange={(e) => {
                            const list = [...roommates];
                            list[idx].lastName = e.target.value;
                            setRoommates(list);
                          }}
                          className="h-9 text-xs"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={rm.employmentStatus}
                          onChange={(e) => {
                            const list = [...roommates];
                            list[idx].employmentStatus = e.target.value;
                            setRoommates(list);
                          }}
                          className="h-9 text-xs rounded-md border"
                        >
                          <option value="CDI">CDI</option>
                          <option value="CDD">CDD</option>
                          <option value="PUBLIC_SERVANT">Fonctionnaire</option>
                          <option value="SELF_EMPLOYED">Indépendant</option>
                          <option value="STUDENT">Étudiant</option>
                          <option value="OTHER">Autre</option>
                        </select>
                        <Input
                          placeholder="Revenu net mensuel"
                          type="number"
                          value={rm.declaredMonthlyIncome || ""}
                          onChange={(e) => {
                            const list = [...roommates];
                            list[idx].declaredMonthlyIncome = Number(e.target.value);
                            setRoommates(list);
                          }}
                          className="h-9 text-xs"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Garant */}
        {property.acceptsGuarantor !== false && (
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">4. Caution Solidaire</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-800 font-bold text-sm">Disposez-vous d'un garant ?</Label>
                  <p className="text-xs text-slate-500">Un garant physique qui se porte caution solidaire.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasGuarantor(false)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      !hasGuarantor ? "bg-[#092B5A] text-white" : "bg-white border text-slate-600"
                    }`}
                  >
                    Non
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasGuarantor(true)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      hasGuarantor ? "bg-[#1463FF] text-white" : "bg-white border text-slate-600"
                    }`}
                  >
                    Oui
                  </button>
                </div>
              </div>

              {hasGuarantor && (
                <div className="space-y-3 pt-3 border-t border-slate-200 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500">Prénom du garant</Label>
                      <Input
                        name="guarantorFirstName"
                        value={guarantorFirstName}
                        onChange={(e) => setGuarantorFirstName(e.target.value)}
                        placeholder="Ex: Jean"
                        className="h-9 text-xs"
                        required={hasGuarantor}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500">Nom du garant</Label>
                      <Input
                        name="guarantorLastName"
                        value={guarantorLastName}
                        onChange={(e) => setGuarantorLastName(e.target.value)}
                        placeholder="Ex: Dupuis"
                        className="h-9 text-xs"
                        required={hasGuarantor}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500">Situation du garant</Label>
                      <select
                        name="guarantorEmploymentStatus"
                        value={guarantorEmploymentStatus}
                        onChange={(e) => setGuarantorEmploymentStatus(e.target.value)}
                        className="h-9 w-full text-xs rounded-md border bg-white"
                      >
                        <option value="CDI">CDI</option>
                        <option value="PUBLIC_SERVANT">Fonctionnaire</option>
                        <option value="SELF_EMPLOYED">Indépendant</option>
                        <option value="RETIRED">Retraité</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500">Revenu net du garant (€/mois)</Label>
                      <Input
                        name="guarantorDeclaredMonthlyIncome"
                        type="number"
                        value={guarantorDeclaredMonthlyIncome}
                        onChange={(e) => setGuarantorDeclaredMonthlyIncome(e.target.value)}
                        placeholder="Ex: 3500"
                        className="h-9 text-xs"
                        required={hasGuarantor}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer mt-1 pt-1">
                    <Checkbox
                      checked={guarantorFiscalResidenceInFrance}
                      onCheckedChange={(checked) => setGuarantorFiscalResidenceInFrance(checked === true)}
                    />
                    <input type="hidden" name="guarantorFiscalResidenceInFrance" value={guarantorFiscalResidenceInFrance.toString()} />
                    <span className="text-[11px] font-semibold text-slate-600">Le garant réside fiscalement en France</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Analyse indicative de solvabilité en temps réel */}
        {gliActive && (
          <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-300 ${solvencyColorClass}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Landmark className="w-5 h-5" /> Analyse indicative
              </h4>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeColorClass}`}>
                {solvencyLabel}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Loyer CC</span>
                <span className="font-extrabold text-sm text-[#092B5A]">{rentAmount} €</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Revenus déclarés</span>
                <span className="font-extrabold text-sm text-[#092B5A]">{totalIncome} €</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Taux d'effort</span>
                <span className="font-extrabold text-sm text-[#092B5A]">{effortRate} %</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Seuil max conseillé</span>
                <span className="font-extrabold text-sm text-[#092B5A]">{targetThreshold} %</span>
              </div>
            </div>

            {hasGliIssue && (
              <p className="text-[11px] font-semibold bg-white/60 p-2.5 rounded-lg flex gap-1.5 items-start mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{gliIssueMessage}</span>
              </p>
            )}

            {!hasGliIssue && effortRate > targetThreshold && totalIncome > 0 && (
              <p className="text-[11px] font-semibold bg-white/60 p-2.5 rounded-lg flex gap-1.5 items-start mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Votre taux d'effort ({effortRate}%) est supérieur au seuil indicatif conseillé pour votre profil ({targetThreshold}%). Le dossier pourra nécessiter une analyse complémentaire.</span>
              </p>
            )}

            {!hasGliIssue && effortRate <= targetThreshold && totalIncome > 0 && (
              <p className="text-[11px] font-semibold bg-white/60 p-2.5 rounded-lg flex gap-1.5 items-start mt-2 text-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Votre profil de solvabilité semble pleinement compatible avec cette assurance.</span>
              </p>
            )}
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
