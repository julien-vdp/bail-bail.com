import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Home, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSimulatedUser } from "@/lib/auth";

export default async function AdminDashboard() {
  const user = await getSimulatedUser();
  
  const properties = await prisma.property.findMany({
    where: { ownerId: user?.id },
    include: {
      _count: {
        select: { applications: true }
      },
      visitSlots: {
        where: { status: "BOOKED" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Gérez vos logements et candidatures en un coup d'œil.</p>
        </div>
        <Link href="/admin/logements/new" className={buttonVariants({ variant: "default", className: "gap-2" })}>
          <Plus className="w-4 h-4" />
          Créer une annonce
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(property => (
          <Card key={property.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl line-clamp-1" title={property.title}>
                {property.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-slate-500 font-mono bg-slate-100 w-fit px-2 py-0.5 rounded">
                  {property.code}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${
                  property.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                  property.status === 'RENTED' ? 'bg-blue-100 text-blue-700' :
                  property.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {property.status === 'AVAILABLE' ? 'Actif' : property.status === 'RENTED' ? 'Loué' : property.status === 'ARCHIVED' ? 'Archivé' : 'Brouillon'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Loyer</span>
                  <span className="font-semibold">{property.rent} €</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Candidats</span>
                    <span className="text-2xl font-bold text-primary">{property._count.applications}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Visites</span>
                    <span className="text-2xl font-bold text-primary">{property.visitSlots.length}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link href={`/admin/logements/${property.id}`} className={buttonVariants({ variant: "outline", className: "flex-1 group" })}>
                      Dossiers
                  </Link>
                  <Link href={`/admin/logements/${property.id}/edit`} className={buttonVariants({ variant: "secondary", className: "flex-1" })}>
                      Éditer
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
