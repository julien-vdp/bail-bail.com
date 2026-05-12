import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PropertyEditForm } from "@/components/admin/PropertyEditForm";
import { VisitSlotManager } from "@/components/admin/VisitSlotManager";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import fs from "fs";
import path from "path";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const propertyId = (await params).id;
  
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { 
      images: true,
      visitSlots: {
        include: { applications: true },
        orderBy: { date: 'asc' }
      }
    }
  });

  if (!property) {
    notFound();
  }

  // Read images from public/bank
  let bankImages: string[] = [];
  try {
    const bankDir = path.join(process.cwd(), "public", "bank");
    if (fs.existsSync(bankDir)) {
      const files = fs.readdirSync(bankDir);
      bankImages = files
        .filter(file => file.endsWith(".png") || file.endsWith(".jpg"))
        .map(file => `/bank/${file}`);
    }
  } catch (error) {
    console.error("Erreur lors de la lecture de la banque d'images", error);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Éditer l'annonce</h1>
            <p className="text-sm text-slate-500">{property.title}</p>
          </div>
        </div>
      </div>

      <PropertyEditForm property={property} bankImages={bankImages} />
      <VisitSlotManager propertyId={property.id} initialSlots={property.visitSlots} />
    </div>
  );
}
