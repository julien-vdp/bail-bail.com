"use client";

import { useActionState, useEffect } from "react";
import { confirmVisitSlotAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { getParisDate } from "@/lib/dateUtils";

export function ConfirmVisitSlotForm({ 
  applicationId, 
  slot,
  confirmedSlotId
}: { 
  applicationId: string;
  slot: { id: string; date: Date; status: string };
  confirmedSlotId: string | null;
}) {
  const [state, formAction, isPending] = useActionState(confirmVisitSlotAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const slotDateStr = format(getParisDate(slot.date), "EEEE d MMMM à HH:mm", { locale: fr });
  const isThisSlotConfirmed = confirmedSlotId === slot.id;
  const isAnySlotBooked = !!confirmedSlotId;

  if (isThisSlotConfirmed) {
    return (
      <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
        <span className="text-sm font-medium text-success capitalize">{slotDateStr}</span>
        <span className="flex items-center gap-1 text-xs font-bold text-success uppercase">
          <CheckCircle2 className="w-4 h-4" />
          Validé
        </span>
      </div>
    );
  }

  // Si une autre visite est déjà validée, on affiche les autres créneaux de manière grisée
  if (isAnySlotBooked && !isThisSlotConfirmed) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg opacity-50">
        <span className="text-sm font-medium text-slate-500 capitalize line-through">{slotDateStr}</span>
        <span className="text-xs text-slate-400">Refusé</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary/30 transition-colors">
      <span className="text-sm font-medium text-slate-800 capitalize">{slotDateStr}</span>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="slotId" value={slot.id} />
      
      <Button 
        type="submit" 
        size="sm" 
        disabled={isPending}
        className="shrink-0 w-full sm:w-auto"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</>
        ) : (
          "Valider ce créneau"
        )}
      </Button>
    </form>
  );
}
