import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, FileText, User, Calendar, MapPin, Download, History, MessageSquare, ShieldCheck, CheckCircle2, Clock, Sliders } from "lucide-react";
import { StatusForm } from "./StatusForm";
import { DocumentViewerModal } from "@/components/admin/DocumentViewerModal";
import { ConfirmVisitSlotForm } from "@/components/admin/ConfirmVisitSlotForm";
import { generateDocumentRequirements } from "@/lib/documentRequirements";

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

  const getStatusLabelFr = (status: string) => {
    if (status === "STUDENT") return "Étudiant(e)";
    if (status === "CDI") return "Salarié CDI";
    if (status === "CDD") return "Salarié CDD";
    if (status === "PUBLIC_SERVANT") return "Fonctionnaire";
    if (status === "SELF_EMPLOYED") return "Indépendant / Freelance";
    if (status === "RETIRED") return "Retraité(e)";
    if (status === "UNEMPLOYED") return "Recherche d'emploi";
    return "Autre";
  };

  const isAnySlotBooked = application.visitSlots.some(s => s.status === "BOOKED");

  // Logic to compute dynamic requirements, completeness, and coherence metrics
  const expectedDocs = generateDocumentRequirements(application.property, application.candidate);
  
  const mandatoryDocs = expectedDocs.filter(d => d.isRequired);
  const uploadedMandatoryCount = mandatoryDocs.filter(d => 
    application.documents.some(doc => doc.type === d.key)
  ).length;
  
  const isComplet = uploadedMandatoryCount === mandatoryDocs.length;
  const isToVerify = application.documents.some(doc => doc.status === "PENDING");
  
  const isStudentNotAccepted = (application.property.acceptsStudent === false || application.property.studentPolicy === "REFUSED") && application.candidate.employmentStatus === "STUDENT";
  
  const rent = application.property.rent;
  const hasGli = application.property.hasGli || application.property.isEligibleGLI || false;
  const gliMonthlyIncomeThreshold = application.property.gliMonthlyIncomeThreshold || application.property.minSalaryRequired || (rent * 3);
  const declaredMonthlyIncome = application.candidate.declaredMonthlyIncome || 0;
  const isIncomeUnderThreshold = hasGli && declaredMonthlyIncome < gliMonthlyIncomeThreshold;
  const incomeGap = declaredMonthlyIncome - gliMonthlyIncomeThreshold;

  const otherUploadedDocs = application.documents.filter(doc => 
    !expectedDocs.some(expected => expected.key === doc.type)
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin/logements/${application.propertyId}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
              <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                Dossier de {application.candidate.firstName} {application.candidate.lastName}
              </h1>
              {getStatusBadge(application.status)}
              {isComplet ? (
                <Badge className="bg-green-100 hover:bg-green-100 text-green-800 border border-green-200 text-xs">Complet</Badge>
              ) : (
                <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs">Incomplet</Badge>
              )}
              {isToVerify && (
                <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs">À vérifier</Badge>
              )}
              {isStudentNotAccepted && (
                <Badge className="bg-red-100 hover:bg-red-100 text-red-800 border border-red-200 text-xs animate-pulse">Profil étudiant non accepté</Badge>
              )}
              {isIncomeUnderThreshold && (
                <Badge className="bg-red-100 hover:bg-red-100 text-red-800 border border-red-200 text-xs">Revenu sous seuil</Badge>
              )}
            </div>
            <p className="text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" /> {application.property.title}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1463FF]" /> 
                Checklist documentaire dynamique ({application.documents.length} pièces déposées)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {expectedDocs.map(expected => {
                  const doc = application.documents.find(d => d.type === expected.key);
                  const isUploaded = !!doc;
                  
                  return (
                    <div 
                      key={expected.key} 
                      className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isUploaded 
                          ? doc.status === 'VALIDATED' 
                            ? 'bg-green-50/30 border-green-200' 
                            : doc.status === 'REJECTED' 
                              ? 'bg-red-50/30 border-red-200'
                              : 'bg-blue-50/20 border-blue-200'
                          : expected.isRequired 
                            ? 'bg-slate-50 border-dashed border-slate-200' 
                            : 'bg-white border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-800">{expected.label}</span>
                          {expected.isRequired ? (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              Requis
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                              Optionnel
                            </span>
                          )}
                          
                          {isUploaded ? (
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              doc.status === 'VALIDATED' ? 'bg-green-100 text-green-700' :
                              doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {doc.status === 'VALIDATED' ? 'Validé' : doc.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                            </span>
                          ) : (
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              expected.isRequired ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              Manquant
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{expected.description}</p>
                        
                        {isUploaded && (
                          <div className="pt-2 text-xs space-y-1">
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <span className="font-medium">Fichier :</span> <span className="font-mono bg-white border px-1.5 py-0.5 rounded text-[11px] text-slate-700">{doc.fileName}</span>
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                                doc.candidateApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                Filigrane : {doc.candidateApproved ? "Validé par candidat" : "Non validé"}
                              </span>
                              {doc.createdAt && (
                                <span className="text-[10px] text-slate-400 font-medium">Déposé le {format(new Date(doc.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
                              )}
                            </div>
                            {doc.candidateComment && (
                              <p className="text-[11px] text-slate-600 bg-white/80 border rounded px-2 py-1 mt-1 italic">
                                Commentaire candidat : "{doc.candidateComment}"
                              </p>
                            )}
                            {doc.status === "REJECTED" && doc.rejectionReason && (
                              <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 mt-1">
                                <strong>Motif du refus :</strong> {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {isUploaded && (
                        <div className="shrink-0 flex items-center gap-2">
                          <DocumentViewerModal 
                            documentId={doc.id}
                            status={doc.status}
                            filePath={doc.filePath} 
                            fileName={doc.fileName} 
                            mimeType={doc.mimeType} 
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {otherUploadedDocs.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents additionnels</h4>
                    {otherUploadedDocs.map(doc => (
                      <div key={doc.id} className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">{doc.type}</span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              Déposé
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{doc.fileName}</p>
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
              </div>
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

          {/* Card Cohérence du dossier */}
          <Card className="border border-slate-200 shadow-md">
            <CardHeader className="pb-3 border-b border-border bg-[#092B5A]/5">
              <CardTitle className="text-base flex items-center gap-2 text-[#092B5A]">
                <ShieldCheck className="h-4.5 w-4.5 text-[#1463FF]" /> Cohérence du dossier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-slate-500 font-medium">GLI activée</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${hasGli ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                  {hasGli ? "Oui" : "Non"}
                </span>
              </div>
              {hasGli && (
                <>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-slate-500 font-medium">Revenu minimum requis</span>
                    <span className="font-bold text-slate-800">{gliMonthlyIncomeThreshold} € / mois</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-slate-500 font-medium">Revenu déclaré</span>
                    <span className="font-bold text-slate-800">{declaredMonthlyIncome} € / mois</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-slate-500 font-medium">Écart de revenu</span>
                    <span className={`font-extrabold ${incomeGap >= 0 ? 'text-green-600' : 'text-red-600 animate-pulse'}`}>
                      {incomeGap >= 0 ? `+${incomeGap} €` : `${incomeGap} €`}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-slate-500 font-medium">Garant autorisé / fourni</span>
                <span className="font-semibold text-slate-800">
                  {application.property.acceptsGuarantor ? "Oui" : "Non"} / {application.candidate.hasGuarantor ? "Oui" : "Non"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Documents obligatoires</span>
                <span className="font-extrabold text-[#1463FF]">
                  {uploadedMandatoryCount} / {mandatoryDocs.length}
                </span>
              </div>

              {/* Badges container inside card */}
              <div className="pt-3 border-t flex flex-wrap gap-2">
                {isComplet ? (
                  <Badge className="bg-green-100 hover:bg-green-100 text-green-800 border border-green-200">Complet</Badge>
                ) : (
                  <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-800 border border-orange-200">Incomplet</Badge>
                )}
                {isToVerify && (
                  <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-800 border border-blue-200">À vérifier</Badge>
                )}
                {isStudentNotAccepted && (
                  <Badge className="bg-red-100 hover:bg-red-100 text-red-800 border border-red-200 animate-pulse">Profil étudiant non accepté</Badge>
                )}
                {isIncomeUnderThreshold && (
                  <Badge className="bg-red-100 hover:bg-red-100 text-red-800 border border-red-200">Revenu sous seuil</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Candidat Profile Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border bg-slate-50/50">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-[#1463FF]" /> Candidat & Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500 text-xs uppercase">Prénom</p>
                  <p className="font-semibold text-slate-800">{application.candidate.firstName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Nom</p>
                  <p className="font-semibold text-slate-800">{application.candidate.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase">Email</p>
                <p className="font-medium"><a href={`mailto:${application.candidate.email}`} className="text-[#1463FF] hover:underline font-semibold">{application.candidate.email}</a></p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase">Téléphone</p>
                <p className="font-medium text-slate-800">{application.candidate.phone}</p>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div>
                  <p className="text-slate-500 text-xs uppercase">Situation professionnelle</p>
                  <p className="font-bold text-slate-800">{getStatusLabelFr(application.candidate.employmentStatus || "")}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Revenu déclaré</p>
                  <p className="font-extrabold text-[#092B5A] text-base">{application.candidate.declaredMonthlyIncome || 0} € / mois</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Garant déclaré</p>
                  <p className="font-bold text-slate-800">{application.candidate.hasGuarantor ? "Oui" : "Non"}</p>
                </div>
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
