"use client";

import { useActionState, useEffect } from "react";
import { validateDossierAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function SubmitDossierForm({ 
  applicationId, 
  rent, 
  progress 
}: { 
  applicationId: string;
  rent: number;
  progress: number;
}) {
  const [state, formAction, isPending] = useActionState(validateDossierAction, null);
  const router = useRouter();
  
  const requiredIncome = rent * 3;
  const isReady = progress === 100;

  useEffect(() => {
    if (state?.success) {
      router.refresh(); // Rafraîchit la page pour afficher le nouveau statut "EN_COURS"
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
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Finaliser votre candidature</h3>
      
      {!isReady ? (
        <p className="text-amber-600 font-medium bg-amber-50 p-4 rounded-lg border border-amber-200">
          Veuillez uploader tous les documents obligatoires (100%) pour pouvoir soumettre votre dossier.
        </p>
      ) : (
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="applicationId" value={applicationId} />
          
          <Button 
            type="submit" 
            className="w-full h-14 text-base font-bold"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Validation en cours...
              </>
            ) : (
              "Valider et soumettre mon dossier"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
