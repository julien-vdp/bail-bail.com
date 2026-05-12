import Image from "next/image";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";

export default function WaitingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {/* Logo Container */}
        <div className="mb-12 relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="absolute inset-0 bg-white rounded-3xl blur-2xl opacity-50" />
          <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Bail-Bail Logo" 
              width={160} 
              height={160} 
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Wording & Value Proposition */}
        <div className="text-center max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            Bientôt disponible
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            La gestion locative,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              sans le chaos.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Bail-Bail n'est pas un énième site d'annonces. Nous facilitons la constitution, la sécurisation et la transmission de vos dossiers locatifs.
          </p>

          {/* Features list */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Dossiers centralisés
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              100% sécurisé
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Gain de temps
            </div>
          </div>

        </div>

      </main>

      {/* Footer / Secret Beta Link */}
      <footer className="py-8 text-center relative z-10">
        <Link 
          href="/beta" 
          className="text-sm font-medium text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          Espace Test (Beta)
        </Link>
      </footer>
    </div>
  );
}
