import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { SearchForm } from "@/components/SearchForm";
import { BackgroundSlider } from "@/components/BackgroundSlider";
import Image from "next/image";
import Link from "next/link";

const HOME_SLIDES = [
  { src: "/slide-1.png", alt: "Salon moderne et lumineux" },
  { src: "/slide-2.png", alt: "Cuisine équipée contemporaine" },
  { src: "/slide-3.png", alt: "Chambre chaleureuse" },
];

export default async function HomePage() {
  const session = await verifySession();
  
  const properties = await prisma.property.findMany({
    where: { status: "AVAILABLE" },
    select: {
      code: true,
      title: true,
      shortAddress: true,
    },
  });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 flex flex-col">
      <BackgroundSlider slides={HOME_SLIDES} />

      {/* Custom transparent header for the landing page */}
      <header className="relative z-20 flex items-center justify-between p-6 md:p-10 w-full">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-2xl">
            <Image 
              src="/logo.png" 
              alt="Bail-Bail Logo" 
              width={48} 
              height={48} 
              className="rounded-lg object-contain"
            />
          </div>
          <span className="font-extrabold text-3xl md:text-4xl text-white tracking-tight drop-shadow-md">
            Bail-Bail
          </span>
        </div>
        
        {session ? (
          <Link 
            href={session.role === "OWNER" ? "/admin" : "/compte"} 
            className="text-white font-medium text-sm md:text-base hover:text-white/80 transition-colors bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full backdrop-blur-md border border-white/20"
          >
            Mon Espace
          </Link>
        ) : (
          <Link 
            href="/auth" 
            className="text-white font-semibold text-sm md:text-base hover:text-white/90 transition-colors bg-primary hover:bg-primary/90 px-5 py-2 rounded-full backdrop-blur-md shadow-lg"
          >
            Se connecter
          </Link>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 md:px-10 pb-20">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Text side */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-semibold text-white shadow-xl">
              <span className="flex h-2 w-2 rounded-full bg-green-400 mr-3 animate-pulse"></span>
              🚀 Version Production - Officiellement en ligne !
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-xl">
              Trouvez votre chez-vous, <span className="text-primary brightness-125">sereinement</span>.
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto lg:mx-0 drop-shadow-md font-medium">
              Découvrez nos logements disponibles, choisissez un créneau de visite et déposez votre dossier de location en toute sécurité, le tout en quelques clics.
            </p>
          </div>

          {/* Form side */}
          <div className="w-full max-w-md">
            <div className="backdrop-blur-2xl bg-white/90 rounded-3xl border border-white/40 shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              <div className="relative z-10">
                <SearchForm properties={properties} />
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm font-semibold text-white/80 drop-shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/20">1</div>
                Choix
              </div>
              <div className="w-8 h-px bg-white/30" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/20">2</div>
                Visite
              </div>
              <div className="w-8 h-px bg-white/30" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/20">3</div>
                Dossier
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
