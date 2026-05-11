"use client";

import { useActionState, useState } from "react";
import { searchPropertyAction } from "@/actions/candidate";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight, Loader2, Check, ChevronsUpDown, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Property = {
  code: string;
  title: string;
  shortAddress: string;
};

export function SearchForm({ properties }: { properties: Property[] }) {
  const [state, formAction, isPending] = useActionState(searchPropertyAction, null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-3 flex flex-col">
        <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          Rechercher un logement
        </label>
        
        <input type="hidden" name="code" value={value} />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger 
            className={buttonVariants({ variant: "outline", className: "w-full justify-between h-14 text-base font-normal bg-slate-50 border-slate-200 hover:bg-slate-100" })}
            role="combobox"
            aria-expanded={open}
            disabled={isPending}
          >
            {value
              ? properties.find((p) => p.code === value)?.title
              : "Sélectionnez un logement..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[400px] max-w-[90vw] p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher par adresse ou code..." />
              <CommandList>
                <CommandEmpty>Aucun logement trouvé.</CommandEmpty>
                <CommandGroup>
                  {properties.map((property) => (
                    <CommandItem
                      key={property.code}
                      value={`${property.title} ${property.code}`}
                      onSelect={() => {
                        setValue(property.code);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-primary",
                          value === property.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{property.title}</span>
                        <span className="text-xs text-slate-500">{property.code} • {property.shortAddress}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {state?.error && (
          <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md animate-in fade-in slide-in-from-top-1">
            {state.error}
          </p>
        )}
      </div>
      <Button 
        type="submit" 
        size="lg"
        className="w-full h-14 text-base font-semibold shadow-md hover:shadow-lg transition-all"
        disabled={isPending || !value}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            Accéder au logement
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
}
