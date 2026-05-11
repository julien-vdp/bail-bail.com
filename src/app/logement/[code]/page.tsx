import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { MapPin, Expand, Euro, Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BackgroundSlider } from "@/components/BackgroundSlider";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const code = (await params).code.toUpperCase();
  const property = await prisma.property.findUnique({
    where: { code },
    include: { images: true }
  });

  if (!property) {
    notFound();
  }

  const slides = property.images && property.images.length > 0
    ? property.images.map(img => ({ src: img.url, alt: property.title }))
    : code.includes("CHOISY") 
      ? [
          { src: "/choisy.png", alt: "Salon" },
          { src: "/choisy-2.png", alt: "Chambre" },
          { src: "/choisy-3.png", alt: "Cuisine" }
        ]
      : code.includes("LYON")
      ? [
          { src: "/lyon.png", alt: "Salon Canut" },
          { src: "/lyon-2.png", alt: "Chambre Canut" },
          { src: "/lyon-3.png", alt: "Bibliothèque" }
        ]
      : [{ src: "/hero-illustration.png", alt: "Appartement" }];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      {/* Left side - Full screen image */}
      <div className="lg:w-1/2 relative min-h-[40vh] lg:min-h-screen">
        <BackgroundSlider slides={slides} />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-slate-900/60 to-transparent pointer-events-none" />
        
        {/* Navigation & Branding */}
        <div className="absolute top-0 left-0 p-6 md:p-10 w-full">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <Image 
                src="/logo.png" 
                alt="Bail-Bail Logo" 
                width={40} 
                height={40} 
                className="rounded-lg object-contain"
              />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight drop-shadow-md">
              Bail-Bail
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24">
        <div className="max-w-xl w-full mx-auto lg:mx-0 space-y-10">
          
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Réf : {property.code}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              {property.title}
            </h1>
            <p className="text-lg text-slate-500 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              {property.shortAddress}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Euro className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Loyer</p>
                <p className="text-xl font-bold text-slate-900">{property.rent} €<span className="text-sm font-normal text-slate-500">/mois</span></p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Expand className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Surface</p>
                <p className="text-xl font-bold text-slate-900">{property.surface} m²</p>
              </div>
            </div>
          </div>

          {property.description && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-3">À propos de ce logement</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Prochaines étapes</h3>
            <ol className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <li className="relative flex items-center gap-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold shadow-md shrink-0 z-10 relative">
                  1
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex-1">
                  <p className="font-semibold text-slate-900">Choix du créneau</p>
                  <p className="text-sm text-slate-500">Sélectionnez les moments qui vous arrangent pour visiter le logement.</p>
                </div>
              </li>
              <li className="relative flex items-center gap-6 opacity-50">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-200 bg-white text-slate-400 font-bold shrink-0 z-10 relative">
                  2
                </div>
                <div className="bg-transparent rounded-xl p-4 flex-1">
                  <p className="font-semibold text-slate-900">Dépôt du dossier</p>
                  <p className="text-sm text-slate-500">Uploadez vos pièces justificatives de manière sécurisée.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="pt-6 border-t border-slate-200">
            {property.status === "AVAILABLE" ? (
              <Link href={`/logement/${code}/visites`} className={buttonVariants({ className: "w-full h-16 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all rounded-2xl" })}>
                <Calendar className="mr-2 h-6 w-6" />
                Choisir un créneau de visite
              </Link>
            ) : (
              <div className="p-4 bg-orange-50 text-orange-800 rounded-xl font-medium flex items-center gap-2 border border-orange-200">
                Ce logement n'est plus disponible pour de nouvelles candidatures.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
