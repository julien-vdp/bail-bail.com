import Image from "next/image";
import Link from "next/link";
import { CodeSearchForm } from "@/components/CodeSearchForm";
import { verifySession } from "@/lib/auth";

export default async function HomePage() {
  const session = await verifySession();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between relative selection:bg-primary/20">
      
      {/* Header minimaliste */}
      <header className="w-full max-w-7xl mx-auto p-6 flex items-center justify-end">
        {session ? (
          <Link 
            href={session.role === "OWNER" ? "/admin" : "/compte"} 
            className="text-slate-600 font-medium text-sm hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-slate-100"
          >
            Mon Espace
          </Link>
        ) : (
          <Link 
            href="/auth" 
            className="text-slate-600 font-medium text-sm hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-slate-100"
          >
            Se connecter
          </Link>
        )}
      </header>

      {/* Main Content (Centré façon Google) */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 -mt-20">
        
        <div className="mb-10 text-center">
          <Image 
            src="/logo.png" 
            alt="Bail-Bail Logo" 
            width={120} 
            height={120} 
            className="mx-auto drop-shadow-sm mb-6"
            priority
          />
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Bail-Bail
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Le portail privatif de votre future location</p>
        </div>

        <div className="w-full max-w-lg mb-8">
          <CodeSearchForm />
        </div>

        <div className="text-center">
          <Link 
            href="/annonces" 
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4"
          >
            Vous n'avez pas de code ? Consultez toutes nos annonces.
          </Link>
        </div>
      </main>

      {/* Footer / Espace Publicitaire */}
      <footer className="w-full border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400 mb-4">Espace Sponsorisé</p>
          
          {/* AdSense Unit */}
          <div className="w-full max-w-[728px] min-h-[90px] flex items-center justify-center overflow-hidden">
            <ins className="adsbygoogle"
                 style={{display: 'inline-block', width: '728px', height: '90px'}}
                 data-ad-client="ca-pub-7186584588652268"></ins>
            <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
