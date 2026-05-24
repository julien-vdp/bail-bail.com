import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, FileText, User, Calendar, MapPin, Download, History, MessageSquare } from "lucide-react";
import { StatusForm } from "./StatusForm";
import { DocumentViewerModal } from "@/components/admin/DocumentViewerModal";
import { ConfirmVisitSlotForm } from "@/components/admin/ConfirmVisitSlotForm";

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const applicationId = (await params).id;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: true,
      property: true,
      documents: {
        orderBy: { createdAt: "desc" }
      },
      visitSlots: true,
      auditLogs: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!application) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return <Badge className="bg-blue-500 hover:bg-blue-600">Nouveau</Badge>;
      case 'INCOMPLET': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Incomplet</Badge>;
      case 'EN_COURS': return <Badge className="bg-purple-500 hover:bg-purple-600">En cours</Badge>;
      case 'ACCEPTE': return <Badge className="bg-green-500 hover:bg-green-600">Accepté</Badge>;
      case 'REFUSE': return <Badge variant="destructive">Refusé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAnySlotBooked = application.visitSlots.some(s => s.status === "BOOKED");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/logements/${application.propertyId}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Dossier de {application.candidate.firstName} {application.candidate.lastName}
            </h1>
            {getStatusBadge(application.status)}
          </div>
          <p className="text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" /> {application.property.title}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" /> 
                Documents fournis ({application.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents.length === 0 ? (
                <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg">
                  Aucun document déposé pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {application.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{doc.type}</p>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                              doc.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : 
                              doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {doc.status}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                              doc.candidateApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              Filigrane : {doc.candidateApproved ? "Validé" : "Non validé"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{doc.fileName}</p>
                          {doc.candidateComment && (
                            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5 mt-1 italic flex items-center gap-1.5 w-fit">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Commentaire candidat : "{doc.candidateComment}"</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <DocumentViewerModal 
                        documentId={doc.id}
                        status={doc.status}
                        filePath={doc.filePath} 
                        fileName={doc.fileName} 
                        mimeType={doc.mimeType} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" /> 
                Historique du dossier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {application.auditLogs.map((log, i) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">{log.action}</div>
                        <time className="text-xs text-slate-500">{format(new Date(log.createdAt), "dd/MM HH:mm")}</time>
                      </div>
                      <div className="text-slate-500 text-sm">{log.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border bg-slate-50">
              <CardTitle className="text-base">Gestion</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusForm applicationId={applicationId} currentStatus={application.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Candidat
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs uppercase">Nom</p>
                <p className="font-medium">{application.candidate.firstName} {application.candidate.lastName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase">Email</p>
                <p className="font-medium"><a href={`mailto:${application.candidate.email}`} className="text-primary hover:underline">{application.candidate.email}</a></p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase">Téléphone</p>
                <p className="font-medium">{application.candidate.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Visites prévues
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {application.visitSlots.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune visite.</p>
              ) : (
                application.visitSlots.map(slot => (
                  <ConfirmVisitSlotForm 
                    key={slot.id} 
                    applicationId={application.id} 
                    slot={slot} 
                    isBooked={isAnySlotBooked} 
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
