import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function WaitingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />

      {/* Top spacing */}
      <header className="relative z-20 flex items-center justify-between p-6 md:p-10 w-full">
        {/* Simple top padding to match the previous layout structure */}
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 md:px-10 pb-20">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Text side (Left) */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-primary font-semibold text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              Lancement imminent
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              La gestion locative,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                sans le chaos.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Bail-Bail n'est pas un énième site d'annonces. Nous facilitons la constitution, la sécurisation et la transmission de vos dossiers locatifs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4 text-slate-700 font-medium">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Dossiers centralisés
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                100% sécurisé
              </div>
            </div>
          </div>

          {/* Logo side (Right) */}
          <div className="w-full max-w-md lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative group w-full aspect-square max-w-[400px]">
              {/* Glow effect behind the card */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-primary/30 to-blue-400/30 rounded-[3rem] blur-xl opacity-70 group-hover:opacity-100 transition duration-700" />
              
              {/* Glass/White Card */}
              <div className="relative h-full w-full bg-white/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl border border-white flex items-center justify-center transform transition duration-500 hover:-translate-y-2">
                <Image 
                  src="/logo.png" 
                  alt="Bail-Bail Logo" 
                  width={300} 
                  height={300} 
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
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
