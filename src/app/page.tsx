import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, FolderLock, Zap, ChevronRight, ArrowRight } from "lucide-react";

export default function WaitingPage() {
  return (
    <div className="min-h-screen bg-[#020817] flex flex-col relative overflow-hidden selection:bg-teal-500/30">
      {/* Background Ambient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-teal-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />

      {/* Grid Pattern (Optional subtle texture) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navigation */}
      <header className="relative z-50 flex items-center justify-between p-6 md:p-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-xl">
            <Image 
              src="/logo.png" 
              alt="Bail-Bail Logo" 
              width={36} 
              height={36} 
              className="rounded-lg object-contain brightness-0 invert"
            />
          </div>
          <span className="font-extrabold text-2xl text-white tracking-tight drop-shadow-md">
            Bail-Bail
          </span>
        </div>
        <Link 
          href="/beta" 
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-full backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20"
        >
          <span>Espace Admin</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 md:px-10 pb-20 pt-10">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Text side (Left) */}
          <div className="flex-1 space-y-10 text-center lg:text-left z-30">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(20,184,166,0.15)] text-teal-300 font-semibold text-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              Lancement de la plateforme 2026
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-extrabold text-white tracking-tight leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              La location,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-blue-500 filter drop-shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                sans le chaos.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              Bail-Bail révolutionne la gestion locative. Constitution, sécurisation et sélection des dossiers centralisés dans une interface conçue pour la tranquillité d'esprit.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Link 
                href="/beta" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] hover:scale-105 transition-all duration-300 group"
              >
                Découvrir la solution
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Glassmorphism Feature Cards side (Right) */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6 z-30 animate-in fade-in slide-in-from-right-8 duration-1000 delay-500">
            
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-start gap-5 p-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-slate-900/60 transition duration-300 transform hover:-translate-y-1">
                <div className="p-4 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Sécurité Bancaire AES-256</h3>
                  <p className="text-slate-400 leading-relaxed">Les documents sensibles de vos candidats sont chiffrés à froid. Fini les pièces d'identités envoyées par e-mail en clair.</p>
                </div>
              </div>
            </div>

            <div className="group relative lg:translate-x-8">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-start gap-5 p-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-slate-900/60 transition duration-300 transform hover:-translate-y-1">
                <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                  <FolderLock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Dossiers Centralisés</h3>
                  <p className="text-slate-400 leading-relaxed">Filtrez, naviguez et comparez les profils de vos candidats locataires dans un Dashboard ergonomique de niveau startup.</p>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-start gap-5 p-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-slate-900/60 transition duration-300 transform hover:-translate-y-1">
                <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Créneaux Intelligents</h3>
                  <p className="text-slate-400 leading-relaxed">Surbooking maîtrisé, génération automatique de visites, et notification hybride par e-mail sans effort.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
