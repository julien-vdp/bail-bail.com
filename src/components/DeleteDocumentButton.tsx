"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteDocumentAction } from "@/actions/upload";

export function DeleteDocumentButton({ 
  documentId, 
  applicationId 
}: { 
  documentId: string;
  applicationId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    setIsDeleting(true);
    const result = await deleteDocumentAction(documentId, applicationId);
    
    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    }
    // Si success, revalidatePath a été appelé dans l'action, Next.js mettra à jour la page.
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
      title="Supprimer ce document"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
}
