import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, FolderLock, Zap, ChevronRight, ArrowRight } from "lucide-react";

export default function WaitingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden selection:bg-primary/20">
      {/* Background Ambient Orbs (très subtiles) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse" style={{ animationDuration: '15s' }} />

      {/* Navigation */}
      <header className="relative z-50 flex items-center justify-between p-6 md:p-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <Image 
              src="/logo.png" 
              alt="Bail-Bail Logo" 
              width={36} 
              height={36} 
              className="rounded-lg object-contain"
            />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            Bail-Bail
          </span>
        </div>
        <Link 
          href="/beta" 
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-primary transition-all shadow-sm"
        >
          <span>Espace Admin</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 md:px-10 pb-20 pt-4">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Text side (Left) */}
          <div className="flex-1 space-y-8 text-center lg:text-left z-30">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-primary font-semibold text-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              Lancement de la plateforme 2026
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              La gestion locative,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                sans le chaos.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              Constitution, sécurisation et sélection des dossiers centralisés dans une interface conçue pour votre tranquillité d'esprit. Fini les dizaines d'e-mails à trier.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Link 
                href="/beta" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 group"
              >
                Découvrir la solution
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Clean Cards side (Right) */}
          <div className="w-full lg:w-1/2 flex flex-col gap-5 z-30 animate-in fade-in slide-in-from-right-8 duration-1000 delay-500">
            
            <div className="relative flex items-start gap-5 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">Sécurité Maximale</h3>
                <p className="text-slate-500 leading-relaxed text-sm">Les documents sensibles de vos candidats sont chiffrés. Protégez leurs données et votre responsabilité.</p>
              </div>
            </div>

            <div className="relative flex items-start gap-5 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1 lg:translate-x-6">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0">
                <FolderLock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">Dossiers Centralisés</h3>
                <p className="text-slate-500 leading-relaxed text-sm">Naviguez, comparez et gérez les profils de vos candidats locataires dans un Dashboard ergonomique.</p>
              </div>
            </div>

            <div className="relative flex items-start gap-5 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">Gain de temps</h3>
                <p className="text-slate-500 leading-relaxed text-sm">Génération automatique des créneaux de visites et notifications envoyées aux candidats sans effort.</p>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
