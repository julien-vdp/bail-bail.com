"use client";

import { useActionState, useState } from "react";
import { acceptConditionsAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Loader2, Info, GraduationCap, Lightbulb } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

function HeaderIllustration() {
  return (
    <svg viewBox="0 0 800 220" className="w-full h-auto bg-gradient-to-br from-[#092B5A]/5 to-[#1463FF]/5 border-b border-slate-100 py-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft background shapes */}
      <circle cx="150" cy="110" r="80" fill="#1463FF" fillOpacity="0.04" />
      <circle cx="650" cy="110" r="60" fill="#092B5A" fillOpacity="0.03" />
      <rect x="360" y="40" width="80" height="140" rx="40" transform="rotate(-15 400 110)" fill="#1463FF" fillOpacity="0.02" />
      
      {/* Central graphics scene */}
      <g transform="translate(240, 20)">
        {/* 1. Stylized Apartment/House (Left side of scene) */}
        <g transform="translate(0, 20)">
          {/* Building outline */}
          <rect x="10" y="30" width="70" height="90" rx="12" fill="white" stroke="#092B5A" strokeWidth="2.5" />
          {/* Roof */}
          <path d="M5 30 L45 5 L85 30" stroke="#092B5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Windows */}
          <rect x="25" y="45" width="16" height="16" rx="4" fill="#1463FF" fillOpacity="0.1" stroke="#1463FF" strokeWidth="2" />
          <rect x="49" y="45" width="16" height="16" rx="4" fill="#1463FF" fillOpacity="0.1" stroke="#1463FF" strokeWidth="2" />
          <rect x="25" y="75" width="16" height="16" rx="4" fill="#1463FF" fillOpacity="0.1" stroke="#1463FF" strokeWidth="2" />
          {/* Door */}
          <rect x="49" y="75" width="16" height="45" rx="3" fill="#092B5A" />
          {/* Tiny red accent chimney or element */}
          <rect x="62" y="10" width="10" height="15" rx="2" fill="#EF4444" />
        </g>

        {/* 2. Folder/Document (Center-right side of scene) */}
        <g transform="translate(130, 10)">
          {/* Shadow document */}
          <rect x="15" y="15" width="85" height="115" rx="10" fill="white" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Main document page */}
          <rect x="5" y="5" width="85" height="115" rx="10" fill="white" stroke="#1463FF" strokeWidth="2.5" />
          {/* Doc header lines */}
          <rect x="20" y="25" width="40" height="6" rx="3" fill="#1463FF" />
          <rect x="20" y="38" width="55" height="4" rx="2" fill="#E2E8F0" />
          {/* Doc text lines */}
          <rect x="20" y="52" width="55" height="3" rx="1.5" fill="#94A3B8" />
          <rect x="20" y="62" width="45" height="3" rx="1.5" fill="#94A3B8" />
          <rect x="20" y="72" width="50" height="3" rx="1.5" fill="#94A3B8" />
          {/* Tiny checkmark seal in blue */}
          <circle cx="68" cy="93" r="10" fill="#1463FF" fillOpacity="0.1" />
          <path d="M64 93 L67 96 L73 90" stroke="#1463FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 3. Handshake (Foreground overlapping elements) */}
        <g transform="translate(70, 75)">
          {/* Left arm/hand */}
          <path d="M 0 35 C 15 35, 20 20, 45 20 C 50 20, 60 25, 68 35" stroke="#092B5A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Right arm/hand */}
          <path d="M 170 35 C 155 35, 150 20, 125 20 C 120 20, 110 25, 102 35" stroke="#092B5A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Shaking fingers joint */}
          <rect x="68" y="28" width="34" height="24" rx="10" fill="white" stroke="#092B5A" strokeWidth="3" />
          <path d="M 78 28 L 78 48" stroke="#092B5A" strokeWidth="2" strokeLinecap="round" />
          <path d="M 86 28 L 86 48" stroke="#092B5A" strokeWidth="2" strokeLinecap="round" />
          <path d="M 94 28 L 94 48" stroke="#092B5A" strokeWidth="2" strokeLinecap="round" />
          {/* Little heart or spark accent above the handshake */}
          <path d="M 85 10 C 82 5, 78 5, 78 8 C 78 12, 85 15, 85 15 C 85 15, 92 12, 92 8 C 92 5, 88 5, 85 10 Z" fill="#EF4444" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}

export function CandidateWarningScreen({ 
  applicationId, 
  property 
}: { 
  applicationId: string;
  property: any;
}) {
  const [state, formAction, isPending] = useActionState(acceptConditionsAction, null);
  const [isStudentCheckbox, setIsStudentCheckbox] = useState(false);
  
  const requiredIncome = property.minSalaryRequired || (property.rent * 3);
  const isOnlyStudents = property.studentPolicy === "ONLY_STUDENTS";
  const isRefusedStudents = property.studentPolicy === "REFUSED";

  const isStudentToSubmit = isOnlyStudents ? true : isRefusedStudents ? false : isStudentCheckbox;

  // Render variables according to the active warning type
  let title = "Conditions de revenus pour ce logement";
  let subtitle = "Nous préférons vous informer dès maintenant des critères demandés par l'assureur afin de vous éviter toute mauvaise surprise.";
  let infoBoxText = "";
  let incomeCardTitle = "Revenu net minimum requis";
  let incomeCardSubtitle = "Pour l'ensemble des occupants du logement.";
  let pedagogyText = "La plupart des assureurs demandent que les revenus nets représentent environ trois fois le montant du loyer charges comprises.";
  let buttonText = "J'ai compris, continuer vers mon dossier";
  let secondaryButtonText = "Retour aux annonces";

  if (isOnlyStudents) {
    title = "Logement réservé aux étudiants";
    subtitle = "Ce logement est réservé aux profils étudiants. Nous préférons vous en informer afin de simplifier votre démarche.";
    infoBoxText = "Pour ce logement, vous devrez fournir un certificat de scolarité valide ou une carte étudiante lors du dépôt de votre dossier.";
    incomeCardTitle = "Revenu net minimum requis (Garant)";
    incomeCardSubtitle = "Pour le garant principal du logement.";
    pedagogyText = "La plupart des assureurs demandent que les garants justifient de revenus mensuels d'au moins trois fois le montant du loyer charges comprises.";
    buttonText = "Je confirme être étudiant(e)";
    secondaryButtonText = "Retour aux annonces";
  } else if (property.isEligibleGLI) {
    infoBoxText = "Ce logement est couvert par une Garantie Loyers Impayés (GLI). Les conditions de revenus sont définies par l'assureur et doivent être respectées pour qu'un dossier puisse être accepté.";
  } else {
    title = "Conditions de revenus estimées";
    subtitle = "Voici quelques indications de revenus généralement attendus pour ce logement afin de préparer sereinement votre dossier.";
    infoBoxText = "Le propriétaire étudiera les dossiers sur la base des garanties classiques. De solides garanties ou garants peuvent être un plus.";
    incomeCardTitle = "Revenu net recommandé";
    incomeCardSubtitle = `Généralement attendu pour un loyer de ${property.rent} € / mois.`;
    pedagogyText = "Il est d'usage que les revenus mensuels du locataire (ou de ses garants) représentent environ trois fois le montant du loyer charges comprises.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-white max-w-[900px] w-full rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
        
        {/* 1. Header with SVG Illustration */}
        <HeaderIllustration />

        <div className="p-6 md:p-10 space-y-8">
          
          {/* 2 & 3. Header Titles */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#092B5A] tracking-tight">{title}</h2>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">{subtitle}</p>
          </div>

          {/* 4. Main Info Box */}
          <div className="bg-[#1463FF]/5 border border-[#1463FF]/10 text-slate-700 rounded-2xl p-5 flex items-start gap-4">
            <Info className="w-6 h-6 text-[#1463FF] shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed font-medium">{infoBoxText}</p>
          </div>

          {/* 5. Income card & Pedagogy block in grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{incomeCardTitle}</span>
              <span className="text-4xl font-extrabold text-[#092B5A]">{requiredIncome} € / mois</span>
              <span className="text-xs text-slate-400 font-medium">{incomeCardSubtitle}</span>
            </div>

            {/* Pedagogy block */}
            <div className="flex items-center gap-4 bg-[#F8FAFC] rounded-2xl p-5 border border-slate-100">
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-[#092B5A] text-sm md:text-base">Pourquoi ce montant ?</h4>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{pedagogyText}</p>
              </div>
              {/* Mini SVG: Calculator & Document */}
              <svg width="70" height="70" viewBox="0 0 80 80" className="shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="10" width="35" height="50" rx="4" fill="white" stroke="#1463FF" strokeWidth="2.5" />
                <line x1="22" y1="20" x2="43" y2="20" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
                <line x1="22" y1="30" x2="43" y2="30" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
                <line x1="22" y1="40" x2="35" y2="40" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
                
                <rect x="38" y="32" width="30" height="38" rx="6" fill="white" stroke="#092B5A" strokeWidth="2.5" />
                <rect x="44" y="38" width="18" height="8" rx="2" fill="#1463FF" fillOpacity="0.1" stroke="#1463FF" strokeWidth="1.5" />
                
                <circle cx="46" cy="53" r="2.5" fill="#092B5A" />
                <circle cx="53" cy="53" r="2.5" fill="#092B5A" />
                <circle cx="60" cy="53" r="2.5" fill="#092B5A" />
                <circle cx="46" cy="61" r="2.5" fill="#092B5A" />
                <circle cx="53" cy="61" r="2.5" fill="#092B5A" />
                <rect x="58" y="58.5" width="5" height="5" rx="1.5" fill="#EF4444" />
              </svg>
            </div>
          </div>

          {/* 6. Complementary Information */}
          <div className="bg-[#F8FAFC] border border-slate-100 text-slate-600 rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm leading-relaxed">
              Si votre situation est particulière (revenus variables, profession indépendante, garant institutionnel, etc.), nous vous recommandons malgré tout de consulter les conditions indiquées dans l'annonce.
            </p>
          </div>

          {/* 7. Specific Student Block / Checkbox section */}
          {isRefusedStudents && (
            <div className="bg-[#FAF6F0] border border-[#EAE3D2] text-[#8C6D3B] rounded-2xl p-4 flex items-start gap-3">
              <GraduationCap className="text-[#8C6D3B] w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm leading-relaxed font-semibold">
                Ce logement n'est actuellement pas ouvert aux candidatures étudiantes.
              </p>
            </div>
          )}

          {!isOnlyStudents && !isRefusedStudents && (
            <div className="flex items-center space-x-3 p-4 bg-[#F8FAFC] rounded-2xl border border-slate-100">
              <Checkbox 
                id="isStudentCheckbox" 
                checked={isStudentCheckbox}
                onCheckedChange={(c) => setIsStudentCheckbox(c === true)}
              />
              <label htmlFor="isStudentCheckbox" className="text-xs md:text-sm font-semibold text-[#092B5A] leading-none cursor-pointer select-none">
                🎓 Je suis actuellement étudiant(e)
              </label>
            </div>
          )}

          {/* 8. Action Buttons Form */}
          <form action={formAction} className="pt-4 border-t border-slate-100 space-y-6">
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="isStudent" value={isStudentToSubmit.toString()} />
            
            {state?.error && (
              <p className="text-sm font-semibold text-red-500 mb-4 text-center">{state.error}</p>
            )}
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {/* Primary action */}
              <Button 
                type="submit" 
                className="h-12 px-6 rounded-xl font-bold bg-[#1463FF] hover:bg-[#004BE5] text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full md:w-auto min-w-[200px]"
                disabled={isPending}
              >
                {isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Chargement...</>
                ) : (
                  buttonText
                )}
              </Button>

              {/* Secondary action */}
              <Link href="/" className="w-full md:w-auto">
                <Button 
                  type="button"
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 w-full md:w-auto min-w-[200px]"
                  disabled={isPending}
                >
                  {secondaryButtonText}
                </Button>
              </Link>
            </div>

            {/* 9. Reassuring microcopy */}
            <p className="text-xs text-slate-400 text-center max-w-lg mx-auto leading-relaxed">
              Bail-Bail vous informe des critères de sélection dès le départ afin de simplifier vos démarches et éviter les dépôts de dossiers inutiles.
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}
