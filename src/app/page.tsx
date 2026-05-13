import Image from "next/image";
import Link from "next/link";
import { CodeSearchForm } from "@/components/CodeSearchForm";
import { verifySession } from "@/lib/auth";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop", // Appartement moderne (clair)
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", // Architecture moderne
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop", // Contrats / Administratif
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop", // Belle maison intérieur
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop", // Signature de contrat
];

export default async function HomePage() {
  const session = await verifySession();
  
  // Sélection aléatoire d'une image à chaque chargement de la page
  const randomImage = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between relative selection:bg-primary/20 text-white overflow-hidden">
      
      {/* Background Animated Image (Ken Burns Effect) */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden bg-slate-900 pointer-events-none">
        <Image 
          src={randomImage} 
          alt="Bail-Bail Background" 
          fill
          priority
          className="object-cover animate-ken-burns opacity-80"
        />
      </div>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[1px] -z-10 pointer-events-none" />

      {/* Header minimaliste */}
      <header className="w-full max-w-7xl mx-auto p-6 flex items-center justify-end relative z-10">
        {session ? (
          <Link 
            href={session.role === "OWNER" ? "/admin" : "/compte"} 
            className="text-white/80 font-semibold text-sm hover:text-white transition-colors px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10"
          >
            Mon Espace
          </Link>
        ) : (
          <Link 
            href="/auth" 
            className="text-white/80 font-semibold text-sm hover:text-white transition-colors px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10"
          >
            Se connecter
          </Link>
        )}
      </header>

      {/* Main Content (Centré façon Google) */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 -mt-20 relative z-10">
        
        <div className="mb-10 text-center">
          <div className="bg-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 w-fit mx-auto mb-6">
            <Image 
              src="/logo.png" 
              alt="Bail-Bail Logo" 
              width={100} 
              height={100} 
              className="drop-shadow-md rounded-xl bg-white p-2"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Bail-Bail
          </h1>
          <p className="text-white/80 mt-3 font-medium text-lg drop-shadow-md">Le portail privatif de votre future location</p>
        </div>

        <div className="w-full max-w-lg mb-8">
          <CodeSearchForm />
        </div>

        <div className="text-center">
          <Link 
            href="/annonces" 
            className="text-sm font-medium text-white/60 hover:text-white transition-colors underline underline-offset-4 drop-shadow-sm"
          >
            Vous n'avez pas de code ? Consultez toutes nos annonces.
          </Link>
        </div>
      </main>
    </div>
  );
}
