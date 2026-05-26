"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteApplicationAction } from "@/actions/candidate";

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    setError("");
    const confirmed = window.confirm("Supprimer ce dossier de location ? Les documents associés seront supprimés.");
    if (!confirmed) return;

    const formData = new FormData();
    formData.append("applicationId", applicationId);

    startTransition(async () => {
      const result = await deleteApplicationAction(null, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors disabled:opacity-60"
        title="Supprimer ce dossier"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
      {error && <span className="text-[10px] text-red-600 text-right max-w-36">{error}</span>}
    </div>
  );
}
