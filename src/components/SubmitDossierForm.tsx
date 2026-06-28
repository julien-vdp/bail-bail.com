"use client";

import { useActionState, useEffect } from "react";
import { validateDossierAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

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
        
        {state?.error && (
          <p className="text-xs text-destructive font-medium bg-red-50 border border-red-100 p-2 rounded-lg">{state.error}</p>
        )}

        <Button 
          type="submit" 
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
      </form>
    </div>
  );
}
