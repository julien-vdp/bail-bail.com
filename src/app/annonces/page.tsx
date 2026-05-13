import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, Building2 } from "lucide-react";

export default async function AnnoncesPage() {
  const session = await verifySession();
  
  const properties = await prisma.property.findMany({
    where: { status: "AVAILABLE" },
    include: {
      images: {
        take: 1
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Bail-Bail Logo" width={28} height={28} className="object-contain" />
              <span className="font-bold text-lg text-slate-900 tracking-tight">Bail-Bail</span>
            </Link>
          </div>
          
          {session ? (
            <Link 
              href={session.role === "OWNER" ? "/admin" : "/compte"} 
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Mon Espace
            </Link>
          ) : (
            <Link 
              href="/auth" 
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Se connecter
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nos logements disponibles</h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Découvrez les annonces actuellement ouvertes à la candidature.</p>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aucun logement disponible</h2>
            <p className="text-slate-500">Revenez plus tard pour découvrir nos nouvelles annonces.</p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 mt-6 text-primary font-semibold hover:underline">
              <ChevronLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Link 
                href={`/logement/${property.code}`} 
                key={property.id}
                className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  {property.images[0] ? (
                    <Image 
                      src={property.images[0].url} 
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <Building2 className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                    {property.code}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{property.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-1">{property.shortAddress}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-lg font-extrabold text-primary">
                      {property.rent} € <span className="text-sm font-medium text-slate-400">/ mois</span>
                    </span>
                    <span className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
