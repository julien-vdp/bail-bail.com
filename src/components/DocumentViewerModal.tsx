"use client";

import { useTransition, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, FileText, CheckCircle, XCircle, Loader2, ShieldCheck, MessageSquare } from "lucide-react";
import { approveDocumentAction } from "@/actions/candidate";

export function DocumentViewerModal({ 
  documentId,
  filePath, 
  fileName, 
  mimeType,
  candidateApproved,
  candidateComment,
  applicationStatus,
  documentType
}: { 
  documentId: string;
  filePath: string; 
  fileName: string; 
  mimeType: string;
  candidateApproved: boolean;
  candidateComment: string | null;
  applicationStatus: string;
  documentType: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState(candidateComment || "");
  const [agreed, setAgreed] = useState(candidateApproved);
  const [editMode, setEditMode] = useState(!candidateApproved);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewerError, setViewerError] = useState(false);

  // Auto-open modal if this document was just uploaded
  useEffect(() => {
    if (typeof window !== "undefined") {
      const justUploaded = sessionStorage.getItem("just_uploaded");
      if (justUploaded === documentType) {
        setOpen(true);
        sessionStorage.removeItem("just_uploaded");
      }
    }
  }, [documentType]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!agreed) {
      setErrorMsg("Veuillez cocher la case pour valider le document.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("documentId", documentId);
      formData.append("approved", "true");
      if (comment.trim()) {
        formData.append("comment", comment.trim());
      }

      const res = await approveDocumentAction(null, formData);
      if (res?.success) {
        setEditMode(false);
        setOpen(false);
      } else if (res?.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const handleCancelApproval = async () => {
    setErrorMsg("");
    startTransition(async () => {
      const formData = new FormData();
      formData.append("documentId", documentId);
      formData.append("approved", "false");

      const res = await approveDocumentAction(null, formData);
      if (res?.success) {
        setAgreed(false);
        setComment("");
        setEditMode(true);
      } else if (res?.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const canModify = applicationStatus === "NOUVEAU" || applicationStatus === "INCOMPLET";

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) {
        setAgreed(candidateApproved);
        setComment(candidateComment || "");
        setEditMode(!candidateApproved);
        setErrorMsg("");
        setViewerError(false);
      }
    }}>
      <DialogTrigger 
        render={
          <Button variant="outline" size="sm" className="gap-1.5 h-9 px-3 text-xs rounded-xl font-medium shadow-sm transition-colors">
            <Eye className="w-4 h-4 text-slate-500" />
            Consulter & Valider
          </Button>
        } 
      />
      <DialogContent className="!max-w-none sm:!max-w-none !w-[100vw] !h-[100vh] !m-0 !p-0 !rounded-none !border-0 flex flex-col overflow-hidden fixed !top-0 !left-0 !translate-x-0 !translate-y-0">
        <DialogHeader className="p-4 border-b border-border bg-slate-50 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-primary" />
            {fileName}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              candidateApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {candidateApproved ? "Filigrane validé" : "En attente de validation"}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Document Viewer (A4 format layout area) */}
        <div className="flex-1 bg-slate-100/50 p-4 overflow-y-auto relative flex flex-col items-center justify-start">
          <div className="w-full max-w-2xl aspect-[21/29.7] min-h-[65vh] md:min-h-[75vh] relative shadow-2xl rounded-xl overflow-hidden bg-white border border-slate-200">
            {isPdf ? (
              <iframe 
                src={`${filePath}#toolbar=0&view=FitH`} 
                className="w-full h-full border-0"
                title={fileName}
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                {viewerError ? (
                  <div className="max-w-md text-center px-6">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Document momentanément indisponible</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Le fichier existe dans votre dossier, mais sa prévisualisation n'a pas pu être chargée.
                    </p>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={filePath} 
                    alt={fileName} 
                    className="max-w-full max-h-full object-contain"
                    onError={() => setViewerError(true)}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                Aperçu non disponible pour ce format.
              </div>
            )}
          </div>
        </div>

        {/* Action Panel (bottom) */}
        <div className="p-5 bg-white border-t flex flex-col gap-4 shrink-0 shadow-2xl">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-sm text-slate-800">Filigrane de sécurité Bail-Bail</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Un triple filigrane indélébile contenant le logo de notre site et la référence de l'annonce a été apposé en diagonale sur ce document. 
              Veuillez vérifier que le rendu vous convient, puis validez pour transmettre le dossier au propriétaire.
            </p>

            {editMode && canModify ? (
              <form onSubmit={handleApprove} className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id={`agree-${documentId}`}
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor={`agree-${documentId}`} className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    J'ai vérifié ce document et je valide la pièce avec son filigrane. Je comprends qu'elle sera archivée ainsi.
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`comment-${documentId}`} className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Commentaire pour le propriétaire (optionnel) :
                  </label>
                  <input 
                    type="text"
                    id={`comment-${documentId}`}
                    placeholder="Ex: Mon contrat de travail est en période d'essai terminée, justificatif de revenus complémentaire..."
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-destructive font-medium">{errorMsg}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isPending}
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Valider le document</>}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-sm text-green-800">Vous avez validé ce document</span>
                  </div>
                  {candidateComment && (
                    <p className="text-xs text-slate-600 bg-white border border-slate-100 px-3 py-2 rounded-xl italic">
                      " {candidateComment} "
                    </p>
                  )}
                </div>
                {canModify && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditMode(true)}
                    disabled={isPending}
                    className="text-xs border-slate-200"
                  >
                    Modifier
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
