import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, FileText, User, Calendar } from "lucide-react";
import { getParisDate } from "@/lib/dateUtils";

export default async function AdminPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const propertyId = (await params).id;
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      applications: {
        include: {
          candidate: true,
          documents: true,
          visitSlots: true,
          confirmedSlot: true,
        },
        orderBy: { createdAt: "desc" }
      },
      visitSlots: {
        include: {
          confirmedApplications: {
            include: {
              candidate: true
            }
          },
          applications: {
            include: {
              candidate: true,
              visitSlots: true
            }
          }
        },
        orderBy: { date: "asc" }
      }
    }
  });

  if (!property) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INCOMPLET': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SOUMIS_INCOMPLET': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLET': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'EN_COURS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ACCEPTE': return 'bg-green-100 text-green-800 border-green-200';
      case 'REFUSE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
          <p className="text-slate-500">{property.code} • {property.shortAddress}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> 
                Candidatures ({property.applications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {property.applications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Aucune candidature pour le moment.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {property.applications.map(app => (
                    <div key={app.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">
                            {app.candidate.firstName} {app.candidate.lastName}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {app.documents.length} document(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {app.confirmedSlot 
                              ? format(getParisDate(app.confirmedSlot.date), "dd MMM HH:mm", { locale: fr }) 
                              : (app.visitSlots.length > 0 ? format(getParisDate(app.visitSlots[0].date), "dd MMM HH:mm", { locale: fr }) : "Aucune visite")}
                          </span>
                        </div>
                      </div>
                      <Link href={`/admin/dossiers/${app.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                          Examiner le dossier
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" /> 
                Créneaux de visite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {property.visitSlots.map(slot => {
                  // Calculer les candidats confirmés (explicitement OU implicitement)
                  const confirmedApps = slot.applications.filter(app => {
                    const confirmedId = app.confirmedSlotId || (
                      (app.status === "ACCEPTE" || app.status === "EN_COURS") 
                        ? app.visitSlots[0]?.id 
                        : null
                    );
                    return confirmedId === slot.id;
                  });

                  const confirmedCount = confirmedApps.length;
                  const isSlotFull = slot.status === "BOOKED" || confirmedCount >= slot.maxCandidates;
                  const isPartiallyBooked = confirmedCount > 0 && confirmedCount < slot.maxCandidates;
                  
                  return (
                    <div key={slot.id} className="flex flex-col p-3 rounded-lg border border-slate-150 bg-slate-50 gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700 capitalize">
                          {format(getParisDate(slot.date), "EEE d MMM - HH:mm", { locale: fr })}
                        </span>
                        
                        {isSlotFull ? (
                          <Badge className="bg-slate-900 text-white border-slate-900">
                            {slot.maxCandidates > 1 ? `Complet (${confirmedCount}/${slot.maxCandidates})` : "Réservé"}
                          </Badge>
                        ) : isPartiallyBooked ? (
                          <Badge className="bg-[#1463FF] text-white border-[#1463FF] hover:bg-[#1463FF]/90">
                            Réservé ({confirmedCount}/{slot.maxCandidates})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-success border-success bg-white">
                            {slot.maxCandidates > 1 ? `Libre (0/${slot.maxCandidates})` : "Libre"}
                          </Badge>
                        )}
                      </div>
                      
                      {confirmedCount > 0 && (
                        <div className="flex flex-col gap-1 border-t border-slate-200/50 pt-1.5 mt-0.5">
                          {confirmedApps.map(app => (
                            <div key={app.id} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                              <span>{app.candidate.firstName} {app.candidate.lastName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Just to avoid unresolved imports, users is implicitly imported or I can import it
import { Users } from "lucide-react";
