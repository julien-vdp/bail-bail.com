"use client";

import { useState, useTransition } from "react";
import { loginAsAction, logoutAction, seedTestDataAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Users, LogOut, Loader2, Database } from "lucide-react";

export function UserSwitcherClient({ 
  currentUser, 
  owners, 
  candidates 
}: { 
  currentUser: any; 
  owners: any[]; 
  candidates: any[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (id: string, name: string, role: "OWNER" | "CANDIDATE") => {
    startTransition(async () => {
      await loginAsAction(id, name, role);
      setIsOpen(false);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      setIsOpen(false);
    });
  };

  const handleSeed = () => {
    startTransition(async () => {
      await seedTestDataAction();
      alert("Données de test créées !");
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-xl shadow-2xl border p-4 w-80 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Simulateur de vue</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Fermer</Button>
          </div>

          {currentUser && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">{currentUser.role === "OWNER" ? "Propriétaire" : "Candidat"}</p>
                <p className="font-medium">{currentUser.name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Propriétaires</h4>
              {owners.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucun propriétaire</p>
              ) : (
                <div className="space-y-1">
                  {owners.map(owner => (
                    <button 
                      key={owner.id}
                      onClick={() => handleLogin(owner.id, owner.name, "OWNER")}
                      disabled={isPending}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 transition-colors ${currentUser?.id === owner.id ? 'bg-slate-100 font-bold' : ''}`}
                    >
                      {owner.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Candidats</h4>
              {candidates.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucun candidat</p>
              ) : (
                <div className="space-y-1">
                  {candidates.map(candidate => (
                    <button 
                      key={candidate.id}
                      onClick={() => handleLogin(candidate.id, `${candidate.firstName} ${candidate.lastName}`, "CANDIDATE")}
                      disabled={isPending}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 transition-colors ${currentUser?.id === candidate.id ? 'bg-slate-100 font-bold' : ''}`}
                    >
                      {candidate.firstName} {candidate.lastName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {owners.length === 0 && (
              <Button onClick={handleSeed} disabled={isPending} className="w-full mt-4" variant="secondary">
                <Database className="w-4 h-4 mr-2" />
                Générer données de test
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full h-12 shadow-xl px-4 flex items-center gap-2 bg-slate-900 hover:bg-slate-800"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
          <span className="font-medium">
            {currentUser ? `Vue : ${currentUser.name.split(" ")[0]}` : "Simuler..."}
          </span>
        </Button>
      )}
    </div>
  );
}
