"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header({ session }: { session: any }) {
  const pathname = usePathname();
  
  if (pathname === "/" || pathname === "/beta" || pathname.startsWith("/logement") || pathname.startsWith("/db-explorer") || pathname.startsWith("/auth")) {
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
        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <Link href={session.role === "OWNER" ? "/admin" : "/compte"} className="text-sm font-semibold bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
              Mon Espace
            </Link>
          ) : (
            <Link href="/auth" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors shadow-sm">
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
