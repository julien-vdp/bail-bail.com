"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  
  if (pathname === "/" || pathname === "/beta" || pathname.startsWith("/logement") || pathname.startsWith("/db-explorer")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="Bail-Bail Logo" 
            width={64} 
            height={64} 
            className="rounded-md object-contain"
          />
          <span className="font-extrabold text-2xl md:text-3xl text-primary tracking-tight">Bail-Bail</span>
        </Link>
        <div className="ml-auto">
          <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Accès Propriétaire
          </Link>
        </div>
      </div>
    </header>
  );
}
