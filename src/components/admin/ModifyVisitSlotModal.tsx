"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, Loader2, Sliders, AlertCircle, Sparkles } from "lucide-react";
import { modifyVisitSlotAction } from "@/actions/admin";

interface AvailableSlot {
  id: string;
  dateStr: string;
}

interface ModifyVisitSlotModalProps {
  applicationId: string;
  availableSlots: AvailableSlot[];
  currentSlotDateStr?: string;
}

export function ModifyVisitSlotModal({
  applicationId,
  availableSlots,
  currentSlotDateStr,
}: ModifyVisitSlotModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"PROPOSE" | "IMPOSE">("PROPOSE");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedSlotId) {
      setErrorMsg("Veuillez sélectionner un créneau dans la liste.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await modifyVisitSlotAction(applicationId, selectedSlotId, type, message);
        if (res?.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(
            type === "PROPOSE"
              ? "Proposition de créneau envoyée par e-mail avec succès !"
              : "Le créneau de visite a été modifié et imposé avec succès !"
          );
          setTimeout(() => {
            setOpen(false);
            // Reset form
            setSelectedSlotId("");
            setMessage("");
            setType("PROPOSE");
            setSuccessMsg("");
          }, 2000);
        }
      } catch (err) {
        setErrorMsg("Une erreur est survenue.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold text-[#1463FF] border-[#1463FF]/30 hover:bg-[#1463FF]/5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            Modifier le créneau
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 overflow-hidden">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-extrabold text-[#092B5A] flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-[#1463FF]" />
            Ajuster le créneau de visite
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            Proposez une date alternative au candidat (soumise à sa validation) ou imposez une nouvelle date directement.
          </p>
        </DialogHeader>

        {/* Small Graphic area representing scheduling */}
        <div className="my-4 bg-gradient-to-br from-[#1463FF]/5 to-indigo-50 border border-[#1463FF]/10 rounded-2xl p-4 flex items-center justify-around relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Créneau Actuel</span>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm text-xs font-bold text-slate-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[120px]">{currentSlotDateStr || "Non validé"}</span>
            </div>
          </div>

          <div className="bg-[#1463FF] p-2 rounded-full text-white shadow-md shadow-[#1463FF]/20 animate-pulse">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-[10px] font-bold text-[#1463FF] uppercase tracking-wider">Nouveau Créneau</span>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-[#1463FF]/20 shadow-sm text-xs font-extrabold text-[#1463FF] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#1463FF]" />
              <span className="truncate max-w-[120px]">
                {selectedSlotId
                  ? availableSlots.find((s) => s.id === selectedSlotId)?.dateStr.split(" à ")[1] || "Sélectionné"
                  : "À choisir"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-green-500 shrink-0 mt-0.5 animate-bounce" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* 1. Select Dropdown for available slots */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Créneaux disponibles pour ce logement
            </label>
            {availableSlots.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-3 rounded-xl font-medium">
                ⚠️ Aucun autre créneau disponible. Veuillez d'abord en ajouter dans les paramètres du logement.
              </p>
            ) : (
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                disabled={isPending}
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all"
              >
                <option value="">-- Choisir une autre date --</option>
                {availableSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.dateStr}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Text Area for accompanying message */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Message d'accompagnement (facultatif)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
              placeholder="Ex : Bonjour, suite à un imprévu, je dois décaler la visite. Voici d'autres propositions..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none resize-none transition-all"
            />
          </div>

          {/* 3. Modification Type (Toggle option buttons) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mode de modification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("PROPOSE")}
                disabled={isPending}
                className={`p-3 border rounded-2xl text-left transition-all ${
                  type === "PROPOSE"
                    ? "bg-[#1463FF]/5 border-[#1463FF] ring-2 ring-[#1463FF]/10 text-primary"
                    : "bg-white border-slate-250 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block font-bold text-xs">Proposer le créneau</span>
                <span className="block text-[10px] text-slate-400 font-medium mt-1">
                  Le candidat recevra un e-mail pour accepter ou refuser.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("IMPOSE")}
                disabled={isPending}
                className={`p-3 border rounded-2xl text-left transition-all ${
                  type === "IMPOSE"
                    ? "bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/10 text-amber-700"
                    : "bg-white border-slate-250 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block font-bold text-xs">Imposer le créneau</span>
                <span className="block text-[10px] text-slate-400 font-medium mt-1">
                  Le créneau est modifié directement. Le candidat est informé par mail.
                </span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setOpen(false)}
              className="text-xs font-bold rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedSlotId || availableSlots.length === 0}
              className={`text-xs font-bold rounded-xl px-5 py-2 flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] ${
                type === "IMPOSE"
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10"
                  : "bg-[#1463FF] hover:bg-blue-600 text-white"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mise à jour...
                </>
              ) : type === "PROPOSE" ? (
                "Envoyer la proposition"
              ) : (
                "Imposer le créneau"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
