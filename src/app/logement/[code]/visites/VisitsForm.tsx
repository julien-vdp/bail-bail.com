"use client";

import { useActionState } from "react";
import { submitApplicationAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function VisitsForm({ 
  propertyId, 
  slotsByDate,
  candidateData
}: { 
  propertyId: string, 
  slotsByDate: Record<string, any[]>,
  candidateData?: any
}) {
  const [state, formAction, isPending] = useActionState(submitApplicationAction, null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const toggleSlot = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="propertyId" value={propertyId} />
      
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
                return (
                  <div key={slot.id}>
                    <input 
                      type="checkbox" 
                      id={`slot-${slot.id}`} 
                      name="slotIds" 
                      value={slot.id} 
                      className="hidden" 
                      checked={isSelected}
                      onChange={() => toggleSlot(slot.id)}
                    />
                    <Label
                      htmlFor={`slot-${slot.id}`}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-bold text-lg">
                        {format(new Date(slot.date), "HH:mm")}
                      </span>
                      <span className="text-xs opacity-80">{slot.duration} min</span>
                    </Label>
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
