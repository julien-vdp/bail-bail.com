"use client";

import { useActionState } from "react";
import { submitApplicationAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function VisitsForm({ 
  propertyId, 
  slotsByDate,
  candidateData,
  initialSelectedSlots = [],
  initialOpenToOtherSlots = false
}: { 
  propertyId: string, 
  slotsByDate: Record<string, any[]>,
  candidateData?: any,
  initialSelectedSlots?: string[],
  initialOpenToOtherSlots?: boolean
}) {
  const [state, formAction, isPending] = useActionState(submitApplicationAction, null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialSelectedSlots);
  const [openToOtherSlots, setOpenToOtherSlots] = useState<boolean>(initialOpenToOtherSlots);

  const toggleSlot = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Trouver tous les créneaux pour pouvoir faire des recherches globales
  const allSlots = Object.values(slotsByDate).flat();

  // Déterminer s'il y a un créneau très demandé sélectionné
  const hasSelectedHighlyDemanded = selectedSlots.some(id => {
    const slot = allSlots.find(s => s.id === id);
    return slot && (slot._count?.applications ?? 0) > 10;
  });

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="openToOtherSlots" value={openToOtherSlots ? "true" : "false"} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Sélectionnez vos créneaux</h3>
        {Object.entries(slotsByDate).map(([dateStr, slots]) => (
          <div key={dateStr} className="space-y-3">
            <h4 className="font-medium text-foreground capitalize">
              {format(new Date(dateStr), "EEEE d MMMM yyyy", { locale: fr })}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map(slot => {
                const isSelected = selectedSlots.includes(slot.id);
                const applicationCount = slot._count?.applications ?? 0;
                const isHighlyDemanded = applicationCount > 10;
                
                return (
                  <div key={slot.id}>
                    {isSelected && (
                      <input 
                        type="hidden" 
                        name="slotIds" 
                        value={slot.id} 
                      />
                    )}
                    <div
                      onClick={() => toggleSlot(slot.id)}
                      className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? isHighlyDemanded 
                            ? "border-amber-500 bg-amber-500/15 text-amber-800" 
                            : "border-primary bg-primary/10 text-primary" 
                          : isHighlyDemanded
                            ? "border-amber-200 bg-amber-50/50 hover:border-amber-500 text-amber-700 hover:bg-amber-50"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-bold text-lg flex items-center gap-1 select-none">
                        {format(new Date(slot.date), "HH:mm")}
                        {isHighlyDemanded && <span className="text-xs text-amber-600">🔥</span>}
                      </span>
                      <span className="text-xs opacity-80 select-none">{slot.duration} min</span>
                      {isHighlyDemanded && (
                        <span className="text-[10px] font-semibold text-amber-600 mt-1 select-none">
                          Très demandé ({applicationCount})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-semibold">2. Vos coordonnées</h3>
          <a href="/compte" className="text-sm text-primary hover:underline font-medium">Modifier</a>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">{candidateData?.firstName} {candidateData?.lastName}</p>
            <p className="text-sm text-slate-500">{candidateData?.email} • {candidateData?.phone}</p>
          </div>
        </div>
      </div>

      {/* Option de flexibilité */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-colors hover:bg-slate-50/80">
        <input
          type="checkbox"
          id="openToOtherSlots"
          checked={openToOtherSlots}
          onChange={(e) => setOpenToOtherSlots(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
        />
        <Label htmlFor="openToOtherSlots" className="text-sm text-slate-600 font-medium cursor-pointer leading-tight select-none">
          Je suis ouvert(e) à d'autres propositions de créneaux si aucun de mes choix ne convient.
        </Label>
      </div>

      {/* Message d'avertissement créneau très demandé */}
      {hasSelectedHighlyDemanded && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl flex items-start gap-3 shadow-sm shadow-amber-500/5">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-bold text-amber-900">Créneau très demandé sélectionné</p>
            <p className="text-amber-700 mt-0.5 leading-relaxed">
              Vous avez choisi un ou plusieurs créneaux avec une forte affluence (déjà plus de 10 dossiers).
              Nous vous suggérons fortement de sélectionner également d'autres choix moins demandés pour maximiser vos chances d'obtenir une visite.
            </p>
          </div>
        </div>
      )}

      {state?.error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-md">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full h-12 text-base" disabled={isPending || selectedSlots.length === 0}>
        {isPending ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Validation en cours...</>
        ) : (
          "Confirmer et déposer mon dossier"
        )}
      </Button>
    </form>
  );
}
