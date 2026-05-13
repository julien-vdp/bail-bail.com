"use client";

import { useActionState, useState } from "react";
import { acceptConditionsAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Info, GraduationCap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
        {isOnlyStudents ? (
          <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('/student_warning.png')] bg-cover bg-center mix-blend-screen" />
            <GraduationCap className="w-16 h-16 mx-auto mb-4 relative z-10" />
            <h2 className="text-3xl font-extrabold tracking-tight relative z-10">Logement Étudiant</h2>
            <p className="text-indigo-100 mt-2 text-lg relative z-10">Ce logement vous est exclusivement réservé !</p>
          </div>
        ) : property.isEligibleGLI ? (
          <div className="bg-red-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('/gli_warning.png')] bg-cover bg-center mix-blend-multiply" />
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 relative z-10" />
            <h2 className="text-3xl font-extrabold tracking-tight relative z-10">Attention - Ne perdez pas votre temps !</h2>
            <p className="text-red-100 mt-2 text-lg relative z-10">Conditions de revenus obligatoires</p>
          </div>
        ) : (
          <div className="bg-slate-800 p-8 text-center text-white">
            <Info className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-extrabold tracking-tight">Avant de commencer...</h2>
            <p className="text-slate-300 mt-2 text-lg">Quelques informations sur ce logement</p>
          </div>
        )}
        
        <div className="p-8 space-y-6">
          {isOnlyStudents ? (
            <>
              <p className="text-slate-700 leading-relaxed text-lg text-center font-medium">
                Le propriétaire de ce logement a décidé de le louer <strong>uniquement à des étudiants</strong>.
              </p>
              
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-r-lg space-y-4">
                <p className="text-slate-800 font-medium">
                  En poursuivant, vous vous engagez à fournir un <strong>certificat de scolarité valide</strong> ou une carte étudiante lors du dépôt de votre dossier.
                </p>
                {property.isEligibleGLI && (
                  <p className="text-sm text-indigo-800/80 italic mt-2 border-t border-indigo-200/50 pt-3">
                    Note : Le propriétaire a souscrit à une assurance GLI. Un de vos garants devra gagner au moins {requiredIncome}€/mois pour que le dossier soit accepté.
                  </p>
                )}
              </div>
            </>
          ) : property.isEligibleGLI ? (
            <>
              <p className="text-slate-700 leading-relaxed text-lg text-center font-medium">
                Le propriétaire a souscrit à une <strong>Garantie Loyers Impayés (GLI)</strong>. Les critères de sélection sont <span className="text-red-600 font-bold underline">stricts et non-négociables</span> par le propriétaire.
              </p>
              
              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg space-y-4">
                <p className="text-slate-800">
                  Pour que votre dossier soit validé par l'assurance, vous (ou l'ensemble des colocataires) devez justifier d'un revenu net mensuel d'au moins :
                </p>
                <div className="text-center p-4 bg-white rounded-lg border border-red-100 shadow-sm">
                  <span className="text-3xl font-black text-red-600">{requiredIncome} € net/mois</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 italic text-center">
                Ne déposez pas de dossier si vos revenus sont inférieurs. Il sera automatiquement refusé par l'assurance, même avec un excellent garant.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700 leading-relaxed text-lg text-center">
                Le propriétaire étudiera les dossiers sur la base des garanties classiques.
              </p>
              <div className="bg-slate-50 border-l-4 border-slate-800 p-6 rounded-r-lg space-y-4">
                <p className="text-slate-800">
                  À titre indicatif, pour un loyer de <strong>{property.rent} €/mois</strong>, un revenu d'environ <strong>{requiredIncome} € net/mois</strong> est généralement attendu (ou de solides garants).
                </p>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-4">
            {isRefusedStudents && (
              <div className="p-4 bg-orange-50 text-orange-800 rounded-lg text-sm border border-orange-200">
                ❌ Ce logement n'est pas ouvert à la colocation étudiante ou aux profils étudiants.
              </div>
            )}
            {!isOnlyStudents && !isRefusedStudents && (
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border">
                <Checkbox 
                  id="isStudentCheckbox" 
                  checked={isStudentCheckbox}
                  onCheckedChange={(c) => setIsStudentCheckbox(c === true)}
                />
                <label htmlFor="isStudentCheckbox" className="text-sm font-medium leading-none cursor-pointer">
                  🎓 Je suis actuellement étudiant(e)
                </label>
              </div>
            )}
          </div>

          <form action={formAction} className="pt-4">
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="isStudent" value={isStudentToSubmit.toString()} />
            
            {state?.error && (
              <p className="text-sm text-destructive mb-4 text-center">{state.error}</p>
            )}
            
            {isOnlyStudents ? (
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold shadow-lg transition-colors bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isPending}
                >
                  {isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement...</> : "Je confirme être étudiant(e)"}
                </Button>
                <Link href="/" className="block">
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-lg font-medium text-slate-700"
                    disabled={isPending}
                  >
                    Je ne suis pas étudiant, je retourne aux annonces
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className={`w-full h-14 text-lg font-bold shadow-lg transition-colors ${property.isEligibleGLI ? "bg-red-600 hover:bg-red-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
                  disabled={isPending}
                >
                  {isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement...</>
                  ) : (
                    "J'ai compris, je continue vers mon dossier"
                  )}
                </Button>
                <Link href="/" className="block">
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-lg font-medium text-slate-700"
                    disabled={isPending}
                  >
                    Je retourne à la liste des annonces
                  </Button>
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
