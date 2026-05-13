"use client";

import { useTransition } from "react";
import { switchRoleAction } from "@/actions/auth";
import { ArrowLeftRight, Loader2 } from "lucide-react";

export function SwitchRoleButton({ 
  variant = "default",
  className = ""
}: { 
  variant?: "default" | "sidebar" | "ghost",
  className?: string
}) {
  const [isPending, startTransition] = useTransition();

  const handleSwitch = () => {
    startTransition(async () => {
      await switchRoleAction();
    });
  };

  if (variant === "sidebar") {
    return (
      <button 
        onClick={handleSwitch} 
        disabled={isPending}
        className={`flex w-full items-center gap-3 px-3 py-2 text-primary hover:bg-primary/10 rounded-md transition-colors ${className}`}
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeftRight className="w-5 h-5" />}
        <span className="font-medium text-sm">Changer de rôle</span>
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button 
        onClick={handleSwitch} 
        disabled={isPending}
        className={`text-slate-500 hover:text-primary transition-colors ${className}`}
        title="Basculer vers l'autre compte"
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeftRight className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <button 
      onClick={handleSwitch} 
      disabled={isPending}
      className={`flex items-center gap-2 text-sm font-semibold bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors ${className}`}
      title="Basculer vers l'autre compte"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
      Basculer de compte
    </button>
  );
}
