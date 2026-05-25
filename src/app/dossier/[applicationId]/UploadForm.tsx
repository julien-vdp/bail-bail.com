"use client";

import { useActionState, useRef } from "react";
import { uploadDocumentAction } from "@/actions/upload";
import { Loader2 } from "lucide-react";

export function UploadForm({
  applicationId,
  documentType,
}: {
  applicationId: string;
  documentType: string;
}) {
  const [state, formAction, isPending] = useActionState(uploadDocumentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form 
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        if (formRef.current) formRef.current.reset();
      }}
      className="w-full relative"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="type" value={documentType} />
      
      {isPending ? (
        <div className="flex items-center gap-3 text-primary font-semibold text-sm p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
          <span>Application du triple filigrane et chiffrement AES-256 en cours...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            name="file" 
            id={`file-${documentType}`}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("just_uploaded", documentType);
                }
                formRef.current?.requestSubmit();
              }
            }}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20
              cursor-pointer"
            required
          />
        </div>
      )}

      {state?.error && (
        <div className="text-xs text-destructive mt-1.5 font-bold">{state.error}</div>
      )}
    </form>
  );
}
