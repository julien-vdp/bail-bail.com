"use client";

import { useTransition } from "react";
import { logout } from "@/actions/auth";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton({ 
  variant = "default",
  className = ""
}: { 
  variant?: "default" | "sidebar" | "ghost",
  className?: string
}) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  if (variant === "sidebar") {
    return (
      <button 
        onClick={handleLogout} 
        disabled={isPending}
        className={`flex w-full items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors ${className}`}
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
        <span className="font-medium text-sm">Se déconnecter</span>
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button 
        onClick={handleLogout} 
        disabled={isPending}
        className={`text-slate-500 hover:text-red-500 transition-colors ${className}`}
        title="Se déconnecter"
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <button 
      onClick={handleLogout} 
      disabled={isPending}
      className={`flex items-center gap-2 text-sm font-semibold bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors ${className}`}
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      Déconnexion
    </button>
  );
}
