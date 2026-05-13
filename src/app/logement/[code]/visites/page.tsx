import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { VisitsForm } from "./VisitsForm";
import { getSimulatedUser } from "@/lib/auth";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { BackgroundSlider } from "@/components/BackgroundSlider";

export default async function VisitsPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const code = (await params).code.toUpperCase();
  const property = await prisma.property.findUnique({
    where: { code },
    include: {
      visitSlots: {
        where: { status: "AVAILABLE" },
        orderBy: { date: "asc" }
      }
    }
  });

  if (!property) {
    notFound();
  }

  const simulatedUser = await getSimulatedUser();
  
  if (!simulatedUser || simulatedUser.role !== "CANDIDATE") {
    redirect(`/auth?redirect=/logement/${code}/visites`);
  }

  const candidateData = await prisma.candidate.findUnique({
    where: { id: simulatedUser.id }
  });

  if (!candidateData) {
    redirect(`/auth?redirect=/logement/${code}/visites`);
  }

  const slides = code.includes("CHOISY") 
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

  const slotsByDate = property.visitSlots.reduce((acc, slot) => {
    const dateStr = slot.date.toISOString().split("T")[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(slot);
    return acc;
  }, {} as Record<string, typeof property.visitSlots>);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      {/* Left side - Full screen image */}
      <div className="lg:w-1/2 relative min-h-[30vh] lg:min-h-screen hidden md:block">
        <BackgroundSlider slides={slides} />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-slate-900/60 to-transparent pointer-events-none" />
        
        {/* Navigation & Branding */}
        <div className="absolute top-0 left-0 p-6 md:p-10 w-full h-full flex flex-col justify-between pointer-events-none">
          <div>
            <Link href={`/logement/${code}`} className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors pointer-events-auto">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour au logement
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-lg pointer-events-auto">
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
          
          <div className="text-white pb-10 pointer-events-auto">
            <h2 className="text-3xl font-bold drop-shadow-md">{property.title}</h2>
            <p className="opacity-80 mt-2">{property.shortAddress}</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="lg:w-1/2 flex flex-col justify-center px-4 py-8 md:px-12 lg:px-20 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto space-y-8">
          
          <div className="md:hidden mb-6">
            <Link href={`/logement/${code}`} className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour au logement
            </Link>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
              Étape 1 sur 2
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Réserver une visite</h1>
            <p className="text-slate-500 text-lg">
              Choisissez les créneaux qui vous arrangent pour visiter ce logement.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-primary/5">
            <VisitsForm propertyId={property.id} slotsByDate={slotsByDate} candidateData={candidateData} />
          </div>

        </div>
      </div>
    </div>
  );
}
