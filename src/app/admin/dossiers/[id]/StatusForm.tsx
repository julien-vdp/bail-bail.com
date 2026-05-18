"use client";

import { useActionState } from "react";
import { updateApplicationStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const STATUSES = [
  { value: "NOUVEAU", label: "Nouveau", color: "text-blue-700 bg-blue-100" },
  { value: "INCOMPLET", label: "Incomplet", color: "text-orange-700 bg-orange-100" },
  { value: "EN_COURS", label: "En cours d'analyse", color: "text-purple-700 bg-purple-100" },
  { value: "ACCEPTE", label: "Accepté", color: "text-green-700 bg-green-100" },
  { value: "REFUSE", label: "Refusé", color: "text-red-700 bg-red-100" },
];

export function StatusForm({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const [state, formAction, isPending] = useActionState(updateApplicationStatus, null);

  return (
    <form action={formAction} className="space-y-4" onSubmit={(e) => {
      const form = e.currentTarget;
      const statusSelect = form.elements.namedItem('status') as HTMLSelectElement;
      if (statusSelect.value === 'REFUSE') {
        if (!window.confirm("Un mail va être envoyé au candidat disant que son dossier n'est pas accepté, le créneau va être libéré, et toutes ses pièces seront supprimées sans retour en arrière possible. Confirmer ?")) {
          e.preventDefault();
        }
      }
    }}>
      <input type="hidden" name="applicationId" value={applicationId} />
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Modifier le statut :</label>
        <select 
          name="status" 
          defaultValue={currentStatus}
          className="border border-border rounded-md px-3 py-2 text-sm bg-card outline-none focus:ring-2 focus:ring-primary/50"
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <Button type="submit" size="sm" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>
    </form>
  );
}
