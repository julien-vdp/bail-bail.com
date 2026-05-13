"use client";

import { useActionState, useState } from "react";
import { searchPropertyAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, KeyRound } from "lucide-react";

export function CodeSearchForm() {
  const [state, formAction, isPending] = useActionState(searchPropertyAction, null);
  const [value, setValue] = useState("");

  return (
    <form action={formAction} className="w-full max-w-lg mx-auto space-y-6">
      <div className="space-y-4 flex flex-col">
        <label htmlFor="code" className="text-sm font-semibold text-white/90 drop-shadow-md flex items-center justify-center gap-2">
          <KeyRound className="w-4 h-4 text-white/90" />
          Entrez le code de votre annonce
        </label>
        
        <input 
          type="text" 
          id="code"
          name="code" 
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="ex: PARIS-15"
          className="w-full h-16 px-6 text-center text-2xl font-bold tracking-widest uppercase bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal"
          autoComplete="off"
        />

        {state?.error && (
          <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-xl text-center animate-in fade-in slide-in-from-top-1">
            {state.error}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        size="lg"
        className="w-full h-14 text-base font-bold shadow-md hover:shadow-lg transition-all rounded-xl"
        disabled={isPending || value.trim().length === 0}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            Valider le code
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
}
