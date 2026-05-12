"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createPropertyAction } from "@/actions/property";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/admin/AddressAutocomplete";

export default function NewPropertyPage() {
  const [state, formAction, isPending] = useActionState(createPropertyAction, null);
  const [isGli, setIsGli] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Créer une nouvelle annonce</h1>
          <p className="text-sm text-slate-500">Le code d'accès sera généré automatiquement.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {state.error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Titre de l'annonce</label>
              <Input name="title" placeholder="ex: Superbe T2 hyper centre..." required />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Adresse complète</label>
              <AddressAutocomplete name="shortAddress" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Loyer mensuel (€)</label>
                <Input name="rent" type="number" min="1" placeholder="850" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Surface (m²)</label>
                <Input name="surface" type="number" step="0.1" min="1" placeholder="45" required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description détaillée</label>
              <Textarea name="description" placeholder="Décrivez le logement..." className="min-h-[120px]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-slate-50">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="isEligibleGLI" 
                    name="isEligibleGLI" 
                    checked={isGli}
                    onCheckedChange={(c) => setIsGli(c === true)}
                  />
                  <div>
                    <label htmlFor="isEligibleGLI" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Éligible à la Garantie Loyers Impayés (GLI)
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Affichera un avertissement rouge strict aux candidats.</p>
                  </div>
                </div>
                
                {isGli && (
                  <div className="pl-7">
                    <label className="text-sm font-medium mb-1 block">Salaire minimum exigé (€) (Optionnel)</label>
                    <Input name="minSalaryRequired" type="number" placeholder="ex: 2500" />
                    <p className="text-xs text-slate-500 mt-1">S'il est vide, la règle des 3x le loyer s'applique.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Politique Étudiante</label>
                <select 
                  name="studentPolicy" 
                  defaultValue="ACCEPTED"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="ACCEPTED">Étudiants acceptés (Garant exigé)</option>
                  <option value="REFUSED">Étudiants refusés</option>
                  <option value="ONLY_STUDENTS">Uniquement pour étudiants</option>
                </select>
              </div>
            </div>

            <input type="hidden" name="status" value="DRAFT" />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'annonce (Brouillon)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
