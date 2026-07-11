import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, FileText, User, Users, Calendar, MapPin, Download, History, MessageSquare, ShieldCheck, CheckCircle2, Clock, Sliders, AlertTriangle, Landmark } from "lucide-react";
import { StatusForm } from "./StatusForm";
import { DocumentViewerModal } from "@/components/admin/DocumentViewerModal";
import { ConfirmVisitSlotForm } from "@/components/admin/ConfirmVisitSlotForm";
import { generateDocumentRequirements } from "@/lib/documentRequirements";
import Image from "next/image";
import { verifySession } from "@/lib/auth";
import { ChatModule } from "@/components/ChatModule";
import { getParisDate } from "@/lib/dateUtils";
import { ModifyVisitSlotModal } from "@/components/admin/ModifyVisitSlotModal";

export default async function AdminApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const applicationId = (await params).id;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        include: {
          roommates: true,
          guarantor: true,
        }
      },
      property: true,
      documentRequirements: {
        include: {
          documents: true,
        }
      },
      documents: {
        orderBy: { createdAt: "desc" }
      },
      visitSlots: true,
      proposedSlot: true,
      auditLogs: {
        orderBy: { createdAt: "desc" }
      },
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!application) {
    notFound();
  }

  const session = await verifySession();
  const currentUserId = session?.id || "";

  // Mappe les messages pour l'affichage avec date formatée
  const formattedMessages = (application.messages || []).map(msg => ({
    id: msg.id,
    senderId: msg.senderId,
    senderRole: msg.senderRole as "CANDIDATE" | "OWNER",
    senderName: msg.senderName,
    content: msg.content,
    formattedDate: format(getParisDate(msg.createdAt), "d MMMM 'à' HH:mm", { locale: fr })
  }));

  // Récupérer les créneaux disponibles du logement pour la modification
  const propertySlots = await prisma.visitSlot.findMany({
    where: {
      propertyId: application.propertyId,
      status: "AVAILABLE",
    },
    orderBy: { date: "asc" }
  });

  const availableSlots = propertySlots.map(slot => ({
    id: slot.id,
    dateStr: format(getParisDate(slot.date), "EEEE d MMMM 'à' HH:mm", { locale: fr }),
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return <Badge className="bg-blue-500 hover:bg-blue-600">Nouveau</Badge>;
      case 'INCOMPLET': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Incomplet</Badge>;
      case 'SOUMIS_INCOMPLET': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-amber-600">Soumis Incomplet</Badge>;
      case 'COMPLET': return <Badge className="bg-teal-500 hover:bg-teal-600 text-white border-teal-600">Complet</Badge>;
      case 'EN_COURS': return <Badge className="bg-purple-500 hover:bg-purple-600">En cours</Badge>;
      case 'ACCEPTE': return <Badge className="bg-green-500 hover:bg-green-600">Accepté</Badge>;
      case 'REFUSE': return <Badge variant="destructive">Refusé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusLabelFr = (status: string) => {
    if (status === "STUDENT") return "Étudiant(e)";
    if (status === "CDI") return "Salarié CDI";
    if (status === "CDI_MOBILITY") return "Salarié CDI (mobilité)";
    if (status === "CDD") return "Salarié CDD";
    if (status === "PUBLIC_SERVANT") return "Fonctionnaire";
    if (status === "SELF_EMPLOYED") return "Indépendant / Freelance";
    if (status === "RETIRED") return "Retraité(e)";
    if (status === "UNEMPLOYED") return "Recherche d'emploi";
    return "Autre";
  };

  const isAnySlotBooked = application.visitSlots.some(s => s.status === "BOOKED");

  // Logic to compute dynamic requirements, completeness, and coherence metrics
  // Sync document requirements on page load to ensure they match the current property settings and candidate situation
  const { syncDocumentRequirements } = await import("@/lib/documentRequirements");
  await syncDocumentRequirements(applicationId, application.property, application.candidate);

  const reloadedApp = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      documentRequirements: {
        include: {
          documents: true,
        }
      }
    }
  });

  const expectedDocs = reloadedApp?.documentRequirements || [];
  
  const searchParamsResolved = await searchParams;
  const activeTab = (searchParamsResolved?.tab as string) || "locataire1";
  const isRoommateTab = activeTab.startsWith("roommate_");

  let filteredExpectedDocs = expectedDocs;
  if (activeTab === "locataire1") {
    filteredExpectedDocs = expectedDocs.filter(d => d.appliesTo === "candidate");
  } else if (activeTab === "garant") {
    filteredExpectedDocs = expectedDocs.filter(d => d.appliesTo === "guarantor");
  } else if (isRoommateTab) {
    filteredExpectedDocs = expectedDocs.filter(d => d.appliesTo === "roommate" && d.key.startsWith(activeTab));
  } else {
    filteredExpectedDocs = [];
  }
  
  const mandatoryDocs = expectedDocs.filter(d => d.required);
  const uploadedMandatoryCount = mandatoryDocs.filter(d => 
    application.documents.some(doc => doc.requirementId === d.id || doc.type === d.key)
  ).length;
  
  const isComplet = uploadedMandatoryCount === mandatoryDocs.length;
  const isToVerify = application.documents.some(doc => doc.status === "PENDING");
  
  const isStudentNotAccepted = (application.property.acceptsStudents === false || application.property.studentPolicy === "REFUSED") && application.candidate.employmentStatus === "STUDENT";
  
  const rent = application.property.rent;
  const hasGli = application.property.gliMode !== "NONE" || application.property.hasGli || application.property.isEligibleGLI || false;
  const gliMonthlyIncomeThreshold = application.property.gliMonthlyIncomeThreshold || application.property.minSalaryRequired || (rent * 3);
  const declaredMonthlyIncome = application.candidate.declaredMonthlyIncome || 0;
  const isIncomeUnderThreshold = hasGli && declaredMonthlyIncome < gliMonthlyIncomeThreshold;
  const incomeGap = declaredMonthlyIncome - gliMonthlyIncomeThreshold;

  const otherUploadedDocs = application.documents.filter(doc => 
    !expectedDocs.some(expected => expected.key === doc.type)
  );

  // Rechercher un éventuel commentaire dans l'historique de soumission
  const submissionLog = application.auditLogs.find(
    log => log.action === "SOUMIS_INCOMPLET" || (log.action === "SOUMISSION_DOSSIER" && log.details?.includes("Commentaire :"))
  );
  
  let candidateCommentText = "";
  if (submissionLog && submissionLog.details) {
    const parts = submissionLog.details.split("Commentaire : ");
    if (parts.length > 1) {
      candidateCommentText = parts[1];
    }
  }

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

      {/* Alerte si le dossier a été soumis incomplet */}
      {application.status === "SOUMIS_INCOMPLET" && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-sm">
          <div className="relative w-16 h-16 shrink-0 bg-white rounded-2xl border border-amber-100 flex items-center justify-center p-1.5 shadow-sm">
            <Image 
              src="/warning_incomplete.png" 
              alt="Attention dossier incomplet" 
              width={56} 
              height={56} 
              className="object-contain" 
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="font-extrabold text-amber-900 text-base flex items-center justify-center sm:justify-start gap-2">
              ⚠️ Candidature soumise en l&apos;état (incomplète)
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              Le candidat a choisi de valider son dossier sans avoir déposé toutes les pièces obligatoires.
            </p>
            {candidateCommentText && (
              <div className="mt-4 bg-white/60 backdrop-blur-sm border border-amber-200/50 p-4 rounded-2xl relative">
                <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider block mb-1">
                  Message d&apos;accompagnement du candidat :
                </span>
                <p className="text-amber-900 font-semibold italic text-sm">
                  &quot;{candidateCommentText}&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message simple si complet mais avec un commentaire */}
      {application.status !== "SOUMIS_INCOMPLET" && candidateCommentText && (
        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-sm">
          <MessageSquare className="h-6 w-6 text-[#1463FF] shrink-0 mt-1" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Message d&apos;accompagnement du candidat :
            </span>
            <p className="text-slate-700 font-semibold italic text-sm">
              &quot;{candidateCommentText}&quot;
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1463FF]" /> 
                Checklist documentaire dynamique ({application.documents.length} pièces déposées)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Tab Switcher for Admin/Owner */}
              {(application.candidate.isColocation || application.candidate.hasGuarantor) && (
                <div className="flex flex-wrap p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
                  <Link
                    href={`/admin/dossiers/${application.id}?tab=locataire1`}
                    className={`flex-1 py-2.5 px-4 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] ${
                      activeTab === "locataire1"
                        ? "bg-white text-primary shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <span>Locataire 1 : {application.candidate.firstName} {application.candidate.lastName}</span>
                  </Link>

                  {application.candidate.isColocation && application.candidate.roommates?.map((roommate: any, index: number) => {
                    const tabKey = `roommate_${roommate.id || index + 1}`;
                    return (
                      <Link
                        key={roommate.id || index}
                        href={`/admin/dossiers/${application.id}?tab=${tabKey}`}
                        className={`flex-1 py-2.5 px-4 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] ${
                          activeTab === tabKey
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Users className="w-4 h-4 text-primary shrink-0" />
                        <span>Locataire {index + 2} : {roommate.firstName} {roommate.lastName}</span>
                      </Link>
                    );
                  })}

                  {application.candidate.hasGuarantor && application.candidate.guarantor && (
                    <Link
                      href={`/admin/dossiers/${application.id}?tab=garant`}
                      className={`flex-1 py-2.5 px-4 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] ${
                        activeTab === "garant"
                          ? "bg-white text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Garant : {application.candidate.guarantor.firstName} {application.candidate.guarantor.lastName}</span>
                    </Link>
                  )}
                </div>
              )}

              {activeTab === "garant" && (
                <p className="text-xs text-slate-500 bg-amber-50/50 border border-amber-100 p-3 rounded-xl leading-relaxed italic">
                  Note : Les contrats GLI interdisent généralement le recours au garant pour les candidats non-étudiants.
                </p>
              )}

              <div className="space-y-4">
                {filteredExpectedDocs.map(expected => {
                  const doc = application.documents.find(d => d.requirementId === expected.id || d.type === expected.key);
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
                          : expected.required 
                            ? 'bg-slate-50 border-dashed border-slate-200' 
                            : 'bg-white border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-800">{expected.label}</span>
                          {expected.required ? (
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
                              expected.required ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
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
                                <span className="text-[10px] text-slate-400 font-medium">Déposé le {format(getParisDate(doc.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
                              )}
                            </div>
                            {doc.candidateComment && (
                              <p className="text-[11px] text-slate-600 bg-white/80 border rounded px-2 py-1 mt-1 italic">
                                Commentaire candidat : &quot;{doc.candidateComment}&quot;
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
                        <time className="text-xs text-slate-500">{format(getParisDate(log.createdAt), "dd/MM HH:mm")}</time>
                      </div>
                      <div className="text-slate-500 text-sm">{log.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Messagerie */}
          <ChatModule
            applicationId={application.id}
            currentUserId={currentUserId}
            currentRole="OWNER"
            messages={formattedMessages}
          />
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

          {/* Card Lecture GLI indicative */}
          {(() => {
            const rentWithCharges = application.property.rentWithCharges || application.property.rent || 0;
            const candidateIncome = application.candidate.declaredMonthlyIncome || 0;
            const roommatesIncome = application.candidate.roommates?.reduce((sum: number, r: any) => sum + (r.declaredMonthlyIncome || 0), 0) || 0;
            const totalIncome = candidateIncome + roommatesIncome;
            const effortRate = totalIncome > 0 ? Math.round((rentWithCharges / totalIncome) * 100) : 0;
            const isStudent = application.candidate.employmentStatus === "STUDENT" || application.candidate.isStudentOrApprentice === true;
            const hasGuarantor = application.candidate.hasGuarantor;
            const isColocation = application.candidate.isColocation;
            const gliMonthlyIncomeThreshold = application.property.gliMonthlyIncomeThreshold || Math.round(rentWithCharges * 3);
            const hasGli = application.property.gliMode !== "NONE" || application.property.hasGli;

            const missingDocs = expectedDocs.filter(d => d.required && !application.documents.some(doc => doc.requirementId === d.id || doc.type === d.key));
            const isComplet = missingDocs.length === 0;

            let targetThreshold = 37;
            let profileEligible = true;
            let eligibilityReason = "";

            const status = application.candidate.employmentStatus || "OTHER";
            if (status === "CDI") {
              if (application.candidate.isInProbationPeriod) {
                profileEligible = false;
                eligibilityReason = "CDI en période d'essai.";
              } else if (application.candidate.isCdiMobility) {
                targetThreshold = 30;
              }
            } else if (status === "PUBLIC_SERVANT") {
              targetThreshold = 37;
            } else if (status === "SELF_EMPLOYED") {
              targetThreshold = 33;
              if ((application.candidate.selfEmployedYears ?? 0) < 2) {
                profileEligible = false;
                eligibilityReason = "Indépendant depuis moins de 2 ans.";
              }
            } else if (status === "CDD") {
              targetThreshold = 25;
              if ((application.candidate.cddRemainingMonths ?? 0) < 12) {
                profileEligible = false;
                eligibilityReason = "CDD restant inférieur à 12 mois.";
              }
            } else if (status === "RETIRED") {
              targetThreshold = 37;
            } else if (status === "STUDENT") {
              targetThreshold = 37;
              if (!application.property.acceptsStudents) {
                profileEligible = false;
                eligibilityReason = "Profil étudiant refusé par l'annonce.";
              }
            } else {
              targetThreshold = 33;
              if (!application.property.acceptsUnstableProfiles && !isColocation) {
                profileEligible = false;
                eligibilityReason = "Profil atypique non accepté par l'assurance standard.";
              }
            }

            const isCompatible = (status === "STUDENT" ? hasGuarantor : true) && effortRate <= targetThreshold && profileEligible && isComplet;
            const isToVerifyBadge = !isCompatible && effortRate <= 40 && profileEligible;
            const isPotentiallyIneligible = !profileEligible || effortRate > 40 || (status === "STUDENT" && !hasGuarantor && hasGli);

            return (
              <Card className="border border-slate-200 shadow-md">
                <CardHeader className="pb-3 border-b border-border bg-[#092B5A] text-white rounded-t-xl">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-[#1463FF]" /> Lecture GLI indicative
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-sm">
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b">
                    {isCompatible && (
                      <Badge className="bg-green-100 hover:bg-green-100 text-green-800 border border-green-200 text-[10px]">Compatible à première vue</Badge>
                    )}
                    {isToVerifyBadge && (
                      <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10px]">À vérifier</Badge>
                    )}
                    {isPotentiallyIneligible && (
                      <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">Profil potentiellement non éligible GLI</Badge>
                    )}
                    {!isComplet && (
                      <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-800 border border-orange-200 text-[10px]">Documents incomplets ({missingDocs.length})</Badge>
                    )}
                    {hasGuarantor && (
                      <Badge className="bg-purple-100 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px]">Garant présent</Badge>
                    )}
                    {hasGli && hasGuarantor && status !== "STUDENT" && (
                      <Badge className="bg-red-100 hover:bg-red-100 text-red-800 border border-red-200 text-[10px]">Caution non applicable GLI</Badge>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Profil candidat :</span>
                      <span className="font-bold text-slate-800">
                        {getStatusLabelFr(status)} {application.candidate.isInProbationPeriod ? "(période d'essai)" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Revenu net global :</span>
                      <span className="font-bold text-slate-800">{totalIncome} € / mois</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Loyer CC :</span>
                      <span className="font-bold text-[#092B5A]">{rentWithCharges} € / mois</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Taux d&apos;effort calculé :</span>
                      <span className={`font-extrabold ${effortRate <= targetThreshold ? 'text-green-600' : 'text-amber-600'}`}>
                        {effortRate} %
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Seuil conseillé (GLI) :</span>
                      <span className="font-bold text-slate-800">{targetThreshold} %</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Colocation :</span>
                      <span className="font-semibold text-slate-800">{isColocation ? `Oui (${application.candidate.roommates.length} colocataires)` : "Non"}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Garant :</span>
                      <span className="font-semibold text-slate-800">
                        {hasGuarantor && application.candidate.guarantor ? `Oui (${application.candidate.guarantor.firstName} ${application.candidate.guarantor.lastName})` : "Non"}
                      </span>
                    </div>

                    {!isComplet && (
                      <div className="p-3 bg-orange-50 text-orange-950 border border-orange-200 rounded-xl space-y-1.5 mt-2">
                        <span className="font-bold text-xs uppercase block text-orange-850">Documents obligatoires manquants :</span>
                        <ul className="list-disc pl-4 text-xs text-orange-800 space-y-0.5">
                          {missingDocs.map((d: any) => (
                            <li key={d.key}>{d.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasGli && hasGuarantor && status !== "STUDENT" && (
                      <div className="p-3 bg-red-50 text-red-950 border border-red-200 rounded-xl mt-2 text-xs">
                        ⚠️ Les contrats GLI interdisent généralement le recours au garant pour les candidats non-étudiants.
                      </div>
                    )}

                    {eligibilityReason && (
                      <div className="p-3 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl mt-2 text-xs">
                        ⚠️ <strong>Non-conformité GLI :</strong> {eligibilityReason}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 mt-4 text-[10px] text-slate-400 italic text-center border-t leading-relaxed">
                    Cette analyse est indicative. La décision finale dépend du propriétaire et, le cas échéant, de l’assureur.
                  </div>
                </CardContent>
              </Card>
            );
          })()}

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
              {application.openToOtherSlots && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <p className="font-semibold text-amber-900">Candidat flexible</p>
                    <p className="text-amber-700 mt-0.5">Le candidat est ouvert à la proposition d'autres créneaux de visite.</p>
                  </div>
                </div>
              )}
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

              {application.proposedSlotId && application.proposedSlot && (
                <div className="p-3 bg-blue-50/50 border border-blue-200 text-blue-800 text-xs rounded-2xl flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    Proposition en attente
                  </div>
                  <p>Vous avez proposé le créneau : <strong>{format(getParisDate(application.proposedSlot.date), "EEEE d MMMM 'à' HH:mm", { locale: fr })}</strong></p>
                  {application.proposalMessage && (
                    <p className="italic text-slate-600 bg-white/85 px-2.5 py-1.5 rounded-lg border border-blue-100/50 mt-1 font-medium">
                      &quot;{application.proposalMessage}&quot;
                    </p>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end border-t border-slate-100 mt-2">
                <ModifyVisitSlotModal
                  applicationId={application.id}
                  availableSlots={availableSlots}
                  currentSlotDateStr={
                    application.visitSlots.find((s) => s.status === "BOOKED")
                      ? format(getParisDate(application.visitSlots.find((s) => s.status === "BOOKED")!.date), "EEEE d MMMM 'à' HH:mm", { locale: fr })
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
