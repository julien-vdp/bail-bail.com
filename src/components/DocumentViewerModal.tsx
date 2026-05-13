"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, ShieldCheck, FileText } from "lucide-react";
import Image from "next/image";

export function DocumentViewerModal({ fileName }: { fileName: string }) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 h-9 px-3 text-xs rounded-xl font-medium shadow-sm transition-colors">
        <Eye className="w-4 h-4 mr-1.5 text-slate-500" />
        Consulter
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="bg-slate-900 p-6 text-center text-white relative">
          <div className="absolute inset-0 bg-[url('/encrypted_document.png')] bg-cover bg-center opacity-30 mix-blend-screen" />
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-400 relative z-10" />
          <DialogTitle className="text-2xl font-bold relative z-10 text-white">Document Sécurisé</DialogTitle>
          <DialogDescription className="text-slate-300 mt-2 relative z-10">
            Fichier: {fileName}
          </DialogDescription>
        </div>
        <div className="p-8 space-y-6 bg-slate-50">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="bg-green-100 text-green-600 p-3 rounded-full">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-slate-700 font-medium">
              Ce document a été crypté et stocké de manière sécurisée sur nos serveurs.
            </p>
            <p className="text-sm text-slate-500">
              Pour des raisons de confidentialité, seul le propriétaire du logement dispose de la clé de déchiffrement pour le consulter.
            </p>
          </div>
          <p className="text-sm text-slate-500 text-center italic">
            Vous avez fait une erreur ? Vous pouvez fermer cette fenêtre et cliquer sur la corbeille pour supprimer le document et en déposer un nouveau.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
