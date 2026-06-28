"use client";

import { useActionState, useEffect, useState } from "react";
import { validateDossierAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

export function SubmitDossierForm({ 
  applicationId, 
  rent, 
  progress,
  allApproved
}: { 
  applicationId: string;
  rent: number;
  progress: number;
  allApproved: boolean;
}) {
  const [state, formAction, isPending] = useActionState(validateDossierAction, null);
  const router = useRouter();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [comment, setComment] = useState("");
  
  const isComplete = progress === 100 && allApproved;

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  if (state?.success) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center space-y-3">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <h3 className="font-bold text-success text-xl">Dossier soumis avec succès !</h3>
        <p className="text-success/80">Le propriétaire va étudier votre dossier très prochainement. Vous serez notifié de sa décision.</p>
      </div>
    );
  }

  const handleSubmitAttempt = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isComplete && !showWarningModal) {
      e.preventDefault();
      setShowWarningModal(true);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
      <h3 className="text-xl font-bold text-[#092B5A] mb-2">Finaliser votre candidature</h3>
      
      {/* Progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-600">
          <span>Complétude du dossier</span>
          <span className="text-[#1463FF]">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2.5 bg-slate-100" />
      </div>

      {!isComplete && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-amber-900">Attention : Dossier incomplet</h4>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {progress < 100 
                  ? "Les dossiers incomplets ont très peu de chances d'être retenus. Lors de la consultation, le propriétaire verra clairement que votre dossier est incomplet."
                  : "Toutes les pièces obligatoires sont déposées, mais vous devez valider l'aperçu filigrané de chaque document pour que votre dossier apparaisse complet."}
              </p>
            </div>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="bg-green-50/50 border border-green-150 text-green-800 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <span className="font-bold text-xs text-green-955">Dossier complet et prêt à être soumis !</span>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="comment" value={comment} />
        <input type="hidden" name="status" value={isComplete ? "COMPLET" : "SOUMIS_INCOMPLET"} />
        
        {state?.error && (
          <p className="text-xs text-destructive font-medium bg-red-50 border border-red-100 p-2 rounded-lg">{state.error}</p>
        )}

        <Button 
          type="submit" 
          onClick={handleSubmitAttempt}
          className="w-full h-12 text-sm font-bold bg-[#1463FF] hover:bg-[#1463FF]/90 text-white rounded-xl shadow-md transition-all duration-300"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin animate-duration-1000" />
              Validation en cours...
            </>
          ) : (
            isComplete ? "Soumettre mon dossier complet" : "Soumettre mon dossier en l'état"
          )}
        </Button>

        {/* Modal d'alerte orange au milieu de l'écran pour dossier incomplet */}
        {showWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] border border-amber-200 max-w-lg w-full p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-5 animate-in zoom-in duration-300">
              
              {/* Illustration orange générée pour l'alerte */}
              <Image 
                src="/warning_incomplete.png" 
                alt="Attention dossier incomplet" 
                width={140} 
                height={140} 
                className="object-contain drop-shadow-md"
              />
              
              <h3 className="text-2xl font-black text-amber-900">Dossier incomplet ({progress}%)</h3>
              
              <p className="text-amber-800 text-xs leading-relaxed max-w-sm">
                Attention, un dossier incomplet a <strong>très peu de chances d&apos;être retenu</strong> par le propriétaire.<br />
                Le propriétaire verra clairement l&apos;état incomplet de votre dossier en le consultant.
              </p>

              <div className="w-full text-left space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ajouter un commentaire pour le propriétaire (optionnel) :
                </label>
                <textarea
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Expliquez ici pourquoi votre dossier est incomplet ou joignez des précisions (ex: contrat de travail envoyé demain...)"
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#1463FF] focus:border-[#1463FF] outline-none bg-slate-50/50 resize-none h-20 text-slate-700"
                />
              </div>

              <div className="flex flex-col sm:flex-row w-full gap-3 pt-2">
                <Button 
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 h-11 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                >
                  Je complète mon dossier
                </Button>
                <Button 
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-11 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "J'ai compris, et je valide mon dossier incomplet"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
