"use client";

import { useTransition, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { updateDocumentStatusAction } from "@/actions/admin";

export function DocumentViewerModal({ 
  documentId,
  filePath, 
  fileName, 
  mimeType,
  status
}: { 
  documentId: string;
  filePath: string; 
  fileName: string; 
  mimeType: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAction = async (newStatus: "VALIDATED" | "REJECTED") => {
    setErrorMsg("");
    if (newStatus === "REJECTED" && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("documentId", documentId);
      formData.append("status", newStatus);
      if (newStatus === "REJECTED" && reason) {
        formData.append("rejectionReason", reason);
      }
      
      const res = await updateDocumentStatusAction(null, formData);
      if (res?.success) {
        setOpen(false);
        setShowRejectInput(false);
        setReason("");
      } else if (res?.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="w-4 h-4" />
            Consulter
          </Button>
        } 
      />
      <DialogContent className="!max-w-none sm:!max-w-none !w-[100vw] !h-[100vh] !m-0 !p-0 !rounded-none !border-0 flex flex-col overflow-hidden fixed !top-0 !left-0 !translate-x-0 !translate-y-0">
        <DialogHeader className="p-4 border-b border-border bg-slate-50 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-primary" />
            {fileName}
            <span className={`text-xs px-2 py-1 rounded-full ${
              status === 'VALIDATED' ? 'bg-green-100 text-green-700' : 
              status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {status}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 bg-slate-100/50 p-4 overflow-hidden relative">
          {isPdf ? (
            <iframe 
              src={`${filePath}#toolbar=0`} 
              className="w-full h-full rounded-md border shadow-sm bg-white"
              title={fileName}
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto rounded-md border shadow-sm bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={filePath} 
                alt={fileName} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Aperçu non disponible pour ce format.
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t flex flex-col sm:flex-row items-center gap-4 justify-between shrink-0">
          <div className="flex-1">
            {errorMsg && <span className="text-destructive text-sm font-medium">{errorMsg}</span>}
          </div>
          {showRejectInput ? (
            <div className="flex-1 flex gap-2 w-full max-w-md">
              <input 
                type="text" 
                placeholder="Motif du refus (optionnel)" 
                className="flex-1 border rounded-md px-3 py-2 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button variant="destructive" onClick={() => handleAction("REJECTED")} disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer le refus"}
              </Button>
              <Button variant="ghost" onClick={() => setShowRejectInput(false)} disabled={isPending}>Annuler</Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="destructive" 
                className="flex-1 sm:flex-none gap-2"
                onClick={() => handleAction("REJECTED")}
                disabled={isPending}
              >
                <XCircle className="w-4 h-4" /> Refuser
              </Button>
              <Button 
                variant="default" 
                className="flex-1 sm:flex-none gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction("VALIDATED")}
                disabled={isPending}
              >
                <CheckCircle className="w-4 h-4" /> Valider
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
