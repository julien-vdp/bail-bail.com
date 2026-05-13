"use client";

import { usePathname } from "next/navigation";

export function AdFooter() {
  const pathname = usePathname();

  // Ne pas afficher sur les pages de dépôt, admin, authentification, ou compte personnel
  if (
    pathname?.startsWith("/dossier") || 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/auth") || 
    pathname?.startsWith("/compte")
  ) {
    return null;
  }

  const isHome = pathname === "/";
  
  // Style sombre pour l'accueil, style clair pour les autres pages
  const footerClass = isHome 
    ? "w-full bg-slate-900/80 backdrop-blur-md border-t border-white/10 py-6 relative z-10 mt-auto"
    : "w-full bg-white border-t border-slate-200 py-6 mt-auto";

  return (
    <footer className={footerClass}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
        <p className="text-xs text-slate-400 mb-4">Espace Sponsorisé</p>
        
        {/* AdSense Unit */}
        <div className="w-full max-w-[728px] min-h-[90px] flex items-center justify-center overflow-hidden">
          <ins className="adsbygoogle"
               style={{display: 'inline-block', width: '728px', height: '90px'}}
               data-ad-client="ca-pub-7186584588652268"></ins>
          <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }} />
        </div>
      </div>
    </footer>
  );
}
