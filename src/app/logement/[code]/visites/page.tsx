import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { VisitsForm } from "./VisitsForm";
import { getSimulatedUser } from "@/lib/auth";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";

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
        where: { 
          status: "AVAILABLE",
          date: { gte: new Date() }
        },
        include: {
          _count: {
            select: { applications: true }
          }
        },
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

  // Récupérer l'éventuelle candidature existante pour ce candidat et logement
  const existingApplication = await prisma.application.findFirst({
    where: {
      propertyId: property.id,
      candidateId: simulatedUser.id
    },
    include: {
      visitSlots: true
    }
  });

  const initialSelectedSlots = existingApplication?.visitSlots.map(s => s.id) || [];
  const initialOpenToOtherSlots = existingApplication?.openToOtherSlots || false;

  const slotsByDate = property.visitSlots.reduce((acc: Record<string, typeof property.visitSlots>, slot: typeof property.visitSlots[number]) => {
    const dateStr = slot.date.toISOString().split("T")[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(slot);
    return acc;
  }, {} as Record<string, typeof property.visitSlots>);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      {/* Left side - Full screen image */}
      <div className="lg:w-1/2 relative min-h-[30vh] lg:min-h-screen hidden md:block overflow-hidden bg-white">
        <Image src="/visit_schedule_bg.png" alt="Créneaux de visite" fill className="object-cover object-center opacity-90" priority />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-white/95 via-white/70 to-transparent pointer-events-none" />
        
        {/* Navigation & Branding */}
        <div className="absolute top-0 left-0 p-6 md:p-10 w-full h-full flex flex-col justify-between pointer-events-none">
          <div>
            <Link href={`/logement/${code}`} className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors pointer-events-auto font-medium">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour au logement
            </Link>
            <div className="flex items-center gap-3">
              <div className="pointer-events-auto flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="Bail-Bail Logo" 
                  width={48} 
                  height={48} 
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-3xl text-slate-900 tracking-tight">
                Bail-Bail
              </span>
            </div>
          </div>
          
          <div className="text-slate-900 pb-10 pointer-events-auto max-w-md">
            <h2 className="text-4xl font-black tracking-tight leading-tight">{property.title}</h2>
            <p className="text-slate-600 font-medium text-lg mt-3 flex items-center">
              📍 {property.shortAddress}
            </p>
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
            <VisitsForm 
              propertyId={property.id} 
              slotsByDate={slotsByDate} 
              candidateData={candidateData} 
              initialSelectedSlots={initialSelectedSlots}
              initialOpenToOtherSlots={initialOpenToOtherSlots}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
