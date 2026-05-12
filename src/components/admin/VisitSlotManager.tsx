"use client";

import { useState, useTransition } from "react";
import { generateVisitSlotsAction, deleteVisitSlotAction } from "@/actions/visit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, CalendarPlus, AlertTriangle, Info, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface VisitSlot {
  id: string;
  date: Date;
  duration: number;
  maxCandidates: number;
  applications?: any[];
}

export function VisitSlotManager({
  propertyId,
  initialSlots
}: {
  propertyId: string;
  initialSlots: VisitSlot[];
}) {
  const [isPending, startTransition] = useTransition();
  const [maxCandidates, setMaxCandidates] = useState(1);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [duration, setDuration] = useState(15);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;

    startTransition(async () => {
      const res = await generateVisitSlotsAction(
        propertyId, 
        date, 
        startTime, 
        endTime, 
        duration, 
        maxCandidates
      );

      if (res.error) {
        alert("Erreur: " + res.error);
      } else {
        alert(`${res.count} créneaux générés avec succès !`);
      }
    });
  };

  const handleDelete = (slotId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce créneau ?")) return;
    
    setIsDeleting(slotId);
    startTransition(async () => {
      const res = await deleteVisitSlotAction(slotId);
      if (res.error) {
        alert("Erreur: " + res.error);
      }
      setIsDeleting(null);
    });
  };

  // Group slots by Date (day)
  const groupedSlots = initialSlots.reduce((acc, slot) => {
    const day = format(new Date(slot.date), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, VisitSlot[]>);

  const sortedDays = Object.keys(groupedSlots).sort();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CalendarPlus className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Gestion des créneaux de visite</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulaire de génération */}
          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Générer une plage horaire</h3>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date des visites</label>
                <Input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required 
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Heure de début</label>
                  <Input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Heure de fin</label>
                  <Input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Durée du créneau</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium mb-1 flex items-center justify-between">
                  <span>Candidats max par créneau (Surbooking)</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    maxCandidates === 1 ? 'bg-green-100 text-green-700' : 
                    maxCandidates === 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {maxCandidates} candidat{maxCandidates > 1 ? 's' : ''}
                  </span>
                </label>
                
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={maxCandidates}
                    onChange={(e) => setMaxCandidates(Number(e.target.value))}
                    className={`transition-colors ${
                      maxCandidates === 1 ? 'border-green-300 focus-visible:ring-green-500' : 
                      maxCandidates === 2 ? 'border-orange-300 focus-visible:ring-orange-500' : 'border-red-300 focus-visible:ring-red-500'
                    }`}
                  />
                </div>

                {/* Messages de feedback */}
                <div className="mt-2 min-h-[40px]">
                  {maxCandidates === 1 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Visite individuelle classique (recommandé).
                    </p>
                  )}
                  {maxCandidates === 2 && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded flex gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <p><strong>Attention :</strong> si les deux candidats honorent la visite, vous devrez gérer deux visites en même temps.</p>
                    </div>
                  )}
                  {maxCandidates >= 3 && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p><strong>Risque élevé :</strong> Vous risquez d'avoir un grand nombre de visiteurs simultanés, ce qui risque de compromettre vos chances de séduire les candidats !</p>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full gap-2 mt-2">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                Générer les créneaux
              </Button>
            </form>
          </div>

          {/* Affichage des créneaux */}
          <div className="lg:col-span-7">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Créneaux ouverts</h3>
            
            {sortedDays.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed rounded-xl text-slate-500">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>Aucun créneau ouvert pour le moment.</p>
                <p className="text-xs mt-1">Utilisez le formulaire pour en générer.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDays.map(day => (
                  <div key={day} className="space-y-3">
                    <h4 className="font-medium text-slate-700 pb-2 border-b">
                      {format(new Date(day), "EEEE d MMMM yyyy", { locale: fr })}
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {groupedSlots[day].map(slot => (
                        <div key={slot.id} className="relative group border rounded-lg p-3 hover:border-slate-300 bg-white transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-lg text-slate-900">
                              {format(new Date(slot.date), "HH:mm")}
                            </span>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              disabled={isDeleting === slot.id || (slot.applications?.length || 0) > 0}
                              className="text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                              title={(slot.applications?.length || 0) > 0 ? "Impossible de supprimer un créneau avec des inscrits" : "Supprimer ce créneau"}
                            >
                              {isDeleting === slot.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                            <Clock className="w-3 h-3" />
                            <span>{slot.duration} min</span>
                          </div>

                          <div className={`text-xs py-1 px-2 rounded flex justify-between items-center ${
                            (slot.applications?.length || 0) >= slot.maxCandidates 
                              ? 'bg-red-50 text-red-700 font-medium' 
                              : 'bg-slate-50 text-slate-600'
                          }`}>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Inscrits</span>
                            <span>{slot.applications?.length || 0} / {slot.maxCandidates}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// Placeholder for icon imports
function CheckCircle2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
}
