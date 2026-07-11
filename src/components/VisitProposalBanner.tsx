"use client";

import React, { useTransition, useState } from "react";
import { respondToVisitProposalAction } from "@/actions/candidate";
import { Calendar, Clock, Check, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisitProposalBannerProps {
  applicationId: string;
  proposedSlotDateStr: string;
  proposalMessage?: string | null;
}

export function VisitProposalBanner({
  applicationId,
  proposedSlotDateStr,
  proposalMessage,
}: VisitProposalBannerProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleResponse = (accept: boolean) => {
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      try {
        const res = await respondToVisitProposalAction(applicationId, accept);
        if (res?.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(
            accept
              ? "Créneau de visite mis à jour avec succès !"
              : "Proposition refusée. Votre créneau d'origine a été conservé."
          );
        }
      } catch (err) {
        setErrorMsg("Une erreur est survenue lors de la validation.");
      }
    });
  };

  if (successMsg) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-green-500/10 flex items-center gap-4 animate-fade-in">
        <div className="bg-white/20 p-3 rounded-2xl">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h4 className="font-extrabold text-base">Action enregistrée !</h4>
          <p className="text-xs text-white/90 font-semibold mt-0.5">{successMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1463FF]/90 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-primary/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

      <div className="space-y-4 relative z-10 flex-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
          <Calendar className="w-3.5 h-3.5" />
          Nouveau créneau proposé
        </div>

        <div className="space-y-2">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
            Le propriétaire vous propose une autre date de visite
          </h3>
          
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 shadow-sm text-sm font-extrabold backdrop-blur-md">
            <Clock className="w-4 h-4 text-white" />
            <span className="capitalize">{proposedSlotDateStr}</span>
          </div>
        </div>

        {proposalMessage && (
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 max-w-xl backdrop-blur-md">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
              Message du propriétaire :
            </span>
            <p className="text-sm font-medium italic leading-relaxed text-white/95">
              &quot;{proposalMessage}&quot;
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/25 border border-red-500/35 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-bold text-red-100">
            <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      <div className="flex flex-row md:flex-col sm:items-center md:items-stretch gap-3 shrink-0 relative z-10">
        <Button
          onClick={() => handleResponse(true)}
          disabled={isPending}
          className="flex-1 bg-white hover:bg-slate-50 text-[#1463FF] font-extrabold text-xs py-3 px-5 rounded-2xl shadow-lg shadow-white/5 transition-all hover:scale-[1.03] flex items-center justify-center gap-1.5"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Accepter ce créneau
        </Button>

        <Button
          onClick={() => handleResponse(false)}
          disabled={isPending}
          variant="outline"
          className="flex-1 bg-transparent hover:bg-white/10 border-white/20 text-white font-bold text-xs py-3 px-5 rounded-2xl transition-all flex items-center justify-center gap-1.5"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Refuser
        </Button>
      </div>
    </div>
  );
}
