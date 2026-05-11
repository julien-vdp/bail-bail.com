"use client";

import { useActionState, useRef } from "react";
import { uploadDocumentAction } from "@/actions/upload";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

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
      className="flex items-center gap-2"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="type" value={documentType} />
      
      <input 
        type="file" 
        name="file" 
        id={`file-${documentType}`}
        accept=".pdf,.jpg,.jpeg,.png"
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-primary/10 file:text-primary
          hover:file:bg-primary/20
          cursor-pointer"
        required
      />
      
      <Button 
        type="submit" 
        size="sm" 
        disabled={isPending}
        className="shrink-0"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <><Upload className="w-4 h-4 mr-1" /> Uploader</>
        )}
      </Button>

      {state?.error && (
        <div className="absolute mt-12 text-xs text-destructive">{state.error}</div>
      )}
    </form>
  );
}
