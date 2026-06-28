import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileText, Clock, ShieldCheck, Landmark, Lightbulb, GraduationCap, User, Home, Sparkles, Coins, Users, AlertTriangle } from "lucide-react";
import { UploadForm } from "./UploadForm";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SubmitDossierForm } from "@/components/SubmitDossierForm";
import { CandidateWarningScreen } from "@/components/CandidateWarningScreen";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import Image from "next/image";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { verifySession } from "@/lib/auth";
import { generateDocumentRequirements } from "@/lib/documentRequirements";
import { CandidateProfileForm } from "@/components/CandidateProfileForm";

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const applicationId = (await params).applicationId;
  const session = await verifySession();
  if (!session || session.role !== "CANDIDATE") {
    redirect(`/auth?redirect=/dossier/${applicationId}`);
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      property: true,
      candidate: {
        include: {
          roommates: true,
          guarantor: true,
        }
      },
      documents: true,
      documentRequirements: {
        include: {
          documents: true,
        }
      }
    }
  });

  if (!application) {
    notFound();
  }
  if (application.candidateId !== session.id && application.candidate.email !== session.email) {
    notFound();
  }

  // --- ÉTAPE 3 : Remplir le profil professionnel si manquant ou en cours d'édition ---
  const searchParamsResolved = await searchParams;
  const isEditing = searchParamsResolved?.edit === "true";

  if (!application.candidate.employmentStatus || isEditing) {
    return (
      <div className="container max-w-4xl mx-auto p-4 py-12 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50 gap-4">
        {isEditing && (
          <div className="max-w-2xl w-full mx-auto flex items-center justify-start px-4">
            <Link 
              href={`/dossier/${application.id}`}
              className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5" })}
            >
              ← Retour au dossier
            </Link>
          </div>
        )}
        <CandidateProfileForm 
          applicationId={application.id} 
          candidate={application.candidate} 
          property={application.property}
        />
      </div>
    );
  }

  // --- ÉTAPE 4 : Dépôt documentaire dynamique ---
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

  const EXPECTED_DOCUMENTS = reloadedApp?.documentRequirements || [];

  // Calcul progression
  const mandatoryDocs = EXPECTED_DOCUMENTS.filter(d => d.required);
  const uploadedMandatory = mandatoryDocs.filter(d => 
    application.documents.some(doc => doc.requirementId === d.id || doc.type === d.key)
  ).length;
  
  const progress = mandatoryDocs.length > 0 ? Math.round((uploadedMandatory / mandatoryDocs.length) * 100) : 100;

  // Tous les documents téléversés doivent être validés (filigrane) par le candidat
  const allUploadedDocsApproved = application.documents.every(d => d.candidateApproved);

  // Avertissement d'éligibilité préalable (conditions et charte GLI acceptées)
  if (!application.hasAcceptedConditions) {
    return (
      <div className="container max-w-4xl mx-auto p-4 min-h-screen relative">
        <CandidateWarningScreen applicationId={application.id} property={application.property} />
      </div>
    );
  }

  // Si le dossier a été refusé
  if (application.status === "REFUSE") {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full text-center shadow-xl border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-red-500"></div>
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Dossier non retenu</h1>
          <p className="text-slate-600 text-lg mb-8">
            Nous sommes au regret de vous informer que le propriétaire n'a pas retenu votre candidature pour le logement <strong>{application.property.title}</strong>.
          </p>
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5" /> Protection de vos données (RGPD)
            </h3>
            <p className="text-red-700 text-sm leading-relaxed">
              Conformément à nos engagements de sécurité et à la réglementation européenne, <strong>l'intégralité des pièces justificatives que vous aviez fournies a été définitivement purgée et supprimée de nos serveurs.</strong> Aucune trace de vos documents (carte d'identité, revenus, etc.) n'a été conservée.
            </p>
          </div>
          <Link href="/annonces" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
            Rechercher un autre logement
          </Link>
        </div>
      </div>
    );
  }

  // Groupement des documents par catégorie
  const sections = [
    { title: "Votre identité", icon: <User className="w-5 h-5 text-[#1463FF]" />, category: "IDENTITY" },
    { title: "Votre domicile", icon: <Home className="w-5 h-5 text-[#1463FF]" />, category: "DOMICILE" },
    { title: "Votre situation", icon: <GraduationCap className="w-5 h-5 text-[#1463FF]" />, category: "EMPLOYMENT" },
    { title: "Vos revenus", icon: <Coins className="w-5 h-5 text-[#1463FF]" />, category: "INCOME" },
    { title: "Votre fiscalité", icon: <FileText className="w-5 h-5 text-[#1463FF]" />, category: "TAX" },
    { title: "Documents du garant", icon: <Users className="w-5 h-5 text-[#1463FF]" />, appliesTo: "guarantor" },
    { title: "Documents des colocataires", icon: <Users className="w-5 h-5 text-[#1463FF]" />, appliesTo: "roommate" }
  ];

  const renderedSections = sections.map(sec => {
    let docs;
    if (sec.appliesTo) {
      docs = EXPECTED_DOCUMENTS.filter(d => d.appliesTo === sec.appliesTo);
    } else {
      docs = EXPECTED_DOCUMENTS.filter(d => d.appliesTo === "candidate" && d.category === sec.category);
    }
    return { ...sec, docs };
  }).filter(sec => sec.docs.length > 0);

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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="container max-w-7xl mx-auto p-4 py-8 md:py-12 space-y-8">
        
        {/* Header & RGPD Section */}
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-primary/5 border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex-1 space-y-6 relative z-10">
            <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 mb-2">
              Dossier n° {application.id.split('-')[0].toUpperCase()}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#092B5A] tracking-tight">
              Votre dossier pour <span className="text-[#1463FF]">{application.property.title}</span>
            </h1>
            
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5" />
                "Pourquoi dois-je redéposer mes documents à chaque fois ?"
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                C'est très simple : pour la <strong>protection de vos données personnelles</strong>. 
                Chez Bail-Bail, nous ne stockons pas vos documents sensibles éternellement. À chaque fois qu'une annonce est clôturée ou que vous retirez votre candidature, vos documents sont <span className="text-primary font-bold">automatiquement et définitivement détruits</span>. C'est plus sûr pour vous, et c'est la loi !
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/3 flex justify-center relative z-10">
            <Image 
              src="/data-protection.png" 
              alt="Protection des données" 
              width={220} 
              height={220}
              className="drop-shadow-2xl mix-blend-multiply"
            />
          </div>
        </div>

        {/* Dynamic GLI Warning Block */}
        {application.property.hasGli && (
          <div className="bg-[#1463FF]/5 border border-[#1463FF]/15 rounded-[2rem] p-6 md:p-8 space-y-4">
            <h3 className="font-bold text-lg text-[#092B5A] flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#1463FF]" />
              Conditions liées à la Garantie Loyers Impayés (GLI)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Ce logement est couvert par une Garantie Loyers Impayés. Certaines pièces sont nécessaires pour permettre l'analyse du dossier par l'assureur.
            </p>
            {application.property.gliMonthlyIncomeThreshold && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm">
                  Revenu net mensuel minimum indiqué : <strong className="text-[#092B5A]">{application.property.gliMonthlyIncomeThreshold} € / mois</strong>
                </span>
                {application.candidate.declaredMonthlyIncome && application.candidate.declaredMonthlyIncome < application.property.gliMonthlyIncomeThreshold && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-pulse">
                    ⚠️ Revenu déclaré inférieur au seuil indiqué
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progress & Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
              <span>Complétude du dossier</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          <div className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold text-slate-600 whitespace-nowrap">
            Statut : <span className="text-primary capitalize">{application.status.toLowerCase().replace('_', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Documents Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 space-y-8">
              
              <div>
                <h2 className="text-2xl font-bold text-[#092B5A]">Pièces justificatives requises</h2>
                <p className="text-slate-500 text-sm mt-1">Uploadez les documents manquants au format PDF, JPG ou PNG.</p>
                {application.property.customInstructions && (
                  <div className="mt-3 bg-amber-50/50 border border-amber-100 text-amber-800 rounded-xl p-3 text-xs flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="font-medium"><strong>Consigne du propriétaire :</strong> {application.property.customInstructions}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-10">
                {renderedSections.map(sec => (
                  <div key={sec.title} className="space-y-4">
                    <h3 className="font-bold text-[#092B5A] text-lg border-b pb-2 flex items-center gap-2">
                      {sec.icon}
                      <span>{sec.title}</span>
                    </h3>
                    
                    {sec.title === "Documents du garant" && (
                      <p className="text-xs text-slate-500 bg-slate-50 border p-3 rounded-xl leading-relaxed italic">
                        Selon les règles de certaines assurances, un garant ne remplace pas toujours le critère de revenus du candidat. Les pièces du garant peuvent néanmoins être utiles si l'annonce les accepte.
                      </p>
                    )}

                    <div className="space-y-4">
                      {sec.docs.map(expectedDoc => {
                        const uploadedDoc = application.documents.find(d => d.requirementId === expectedDoc.id || d.type === expectedDoc.key);
                        const isRejected = uploadedDoc?.status === "REJECTED";
                        const isPending = uploadedDoc?.status === "PENDING";
                        const isValidated = uploadedDoc?.status === "VALIDATED";
                        
                        return (
                          <div key={expectedDoc.key} className={`p-5 border rounded-2xl space-y-4 transition-all duration-300 shadow-sm ${
                            isRejected ? 'bg-gradient-to-br from-red-50/50 to-white border-red-300' :
                            isValidated ? 'bg-gradient-to-br from-green-50/50 to-white border-green-200' :
                            isPending ? 'bg-gradient-to-br from-blue-50/50 to-white border-blue-200' :
                            'bg-white border-slate-200 hover:border-primary/30 hover:shadow-md'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold flex items-center gap-3 ${
                                isRejected ? 'text-red-800' : 
                                isValidated ? 'text-green-800' : 
                                isPending ? 'text-blue-800' : 
                                'text-slate-800'
                              }`}>
                                {isRejected ? (
                                  <div className="bg-red-100 p-2 rounded-full shadow-sm"><ShieldCheck className="w-5 h-5 text-red-600" /></div>
                                ) : isValidated ? (
                                  <div className="bg-green-100 p-2 rounded-full shadow-sm"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                                ) : isPending ? (
                                  <div className="bg-blue-100 p-2 rounded-full shadow-sm"><Clock className="w-5 h-5 text-blue-600" /></div>
                                ) : (
                                  <div className="bg-slate-100 p-2 rounded-full"><Clock className="w-5 h-5 text-slate-400" /></div>
                                )}
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800">{expectedDoc.label}</span>
                                    {!expectedDoc.required ? (
                                      <span className="text-[10px] text-slate-500 bg-white/60 border border-slate-200 px-2 py-0.5 rounded-full font-bold uppercase">Optionnel</span>
                                    ) : (
                                      <span className="text-[10px] text-[#1463FF] bg-[#1463FF]/10 border border-[#1463FF]/20 px-2 py-0.5 rounded-full font-bold uppercase">Obligatoire</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium mt-0.5">{expectedDoc.description}</p>
                                  {uploadedDoc && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <span className={`text-[10px] uppercase font-bold w-fit px-2.5 py-0.5 rounded-full ${
                                        isValidated ? 'bg-green-100 text-green-700' : 
                                        isRejected ? 'bg-red-100 text-red-700' : 
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                        Propriétaire : {isValidated ? "Validé" : isRejected ? "Refusé" : "En cours d'analyse"}
                                      </span>
                                      <span className={`text-[10px] uppercase font-bold w-fit px-2.5 py-0.5 rounded-full ${
                                        uploadedDoc.candidateApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                                      }`}>
                                        Filigrane : {uploadedDoc.candidateApproved ? "Validé par vous" : "À valider"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </span>
                            </div>

                            {isRejected && uploadedDoc?.rejectionReason && (
                              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium mt-2">
                                <p className="text-xs uppercase text-red-500 font-bold mb-1">Motif du refus</p>
                                {uploadedDoc.rejectionReason}
                              </div>
                            )}

                            {!uploadedDoc ? (
                              <div className="pt-2">
                                <UploadForm applicationId={applicationId} documentType={expectedDoc.key} />
                              </div>
                            ) : (
                              <div className={`flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-white/60 backdrop-blur-sm border p-3 rounded-xl mt-2 shadow-sm gap-3 sm:gap-0 ${
                                isRejected ? 'border-red-100' : isValidated ? 'border-green-100' : 'border-blue-100'
                              }`}>
                                <span className="flex items-center gap-2 text-slate-700 font-medium truncate sm:max-w-[200px]">
                                  <FileText className={`w-5 h-5 drop-shadow-sm ${isRejected ? 'text-red-500' : isValidated ? 'text-green-600' : 'text-blue-500'}`} />
                                  <span className="truncate">{uploadedDoc.fileName}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <DocumentViewerModal 
                                    documentId={uploadedDoc.id}
                                    filePath={uploadedDoc.filePath}
                                    fileName={uploadedDoc.fileName}
                                    mimeType={uploadedDoc.mimeType}
                                    candidateApproved={uploadedDoc.candidateApproved}
                                    candidateComment={uploadedDoc.candidateComment}
                                    applicationStatus={application.status}
                                    documentType={expectedDoc.key}
                                  />
                                  {(application.status === "NOUVEAU" || application.status === "INCOMPLET" || isRejected) && (
                                    <DeleteDocumentButton documentId={uploadedDoc.id} applicationId={application.id} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!application.property.acceptsGuarantor && (
                <div className="bg-slate-50 border rounded-2xl p-4 text-xs text-slate-500 font-medium text-center">
                  Le propriétaire n'a pas prévu l'ajout de garant pour cette annonce.
                </div>
              )}

              <div className="border-t pt-4 text-center">
                <p className="text-xs text-slate-400">
                  Bail-Bail vous aide à constituer un dossier clair, en limitant les pièces demandées à ce qui est utile pour l’étude de votre candidature.
                </p>
              </div>

            </div>
          </div>

          {/* Sidebar / Recap */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Récapitulatif du dossier</h2>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Solvency Warning if applicable */}
                {(() => {
                  const rentAmount = application.property.rentWithCharges || application.property.rent || 0;
                  const candidateIncome = application.candidate.declaredMonthlyIncome || 0;
                  const roommatesIncome = application.candidate.roommates?.reduce((sum: number, r: any) => sum + (r.declaredMonthlyIncome || 0), 0) || 0;
                  const totalIncome = candidateIncome + roommatesIncome;
                  const effortRate = totalIncome > 0 ? Math.round((rentAmount / totalIncome) * 100) : 0;
                  const gliThreshold = application.property.gliMonthlyIncomeThreshold || Math.round(rentAmount * 3);
                  const isUnderThreshold = totalIncome < gliThreshold;
                  const isGliActive = application.property.gliMode === "STRICT" || application.property.gliMode === "INDICATIVE" || application.property.hasGli;

                  if (isUnderThreshold && isGliActive) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-bold text-xs text-amber-900">Seuil indicatif non atteint</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          Votre revenu net global déclaré ({totalIncome} €) est inférieur au seuil indicatif conseillé pour ce logement ({gliThreshold} €). Vous pouvez finaliser votre dossier, mais il pourra faire l'objet d'une analyse complémentaire.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 1. Candidat Info */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidat</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-800">{application.candidate.firstName} {application.candidate.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{application.candidate.email}</p>
                    <p className="text-xs text-slate-500">{application.candidate.phone}</p>
                  </div>
                </div>

                {/* 2. Logement Info */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logement</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm">{application.property.title}</p>
                    <p className="text-xs text-slate-500 mt-1">📍 {application.property.shortAddress}</p>
                    <p className="text-[#092B5A] font-bold text-xs mt-2">
                      Loyer : {application.property.rent} € / mois
                    </p>
                    {application.property.rentWithCharges > 0 && (
                      <p className="text-primary font-extrabold text-sm mt-1">
                        Charges comprises : {application.property.rentWithCharges} € / mois
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Paramètres Annonce */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paramètres annonce</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span>GLI :</span>
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {application.property.gliMode !== "NONE" ? application.property.gliMode : "Non activée"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Garants :</span>
                      <span className="font-bold">{application.property.acceptsGuarantor ? "Acceptés" : "Refusés"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Étudiants :</span>
                      <span className="font-bold">{application.property.acceptsStudent ? "Acceptés" : "Refusés"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Colocation :</span>
                      <span className="font-bold">{application.property.acceptsColocation ? "Acceptée" : "Refusée"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Profil Déclaré */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Votre situation</span>
                    {(application.status === "NOUVEAU" || application.status === "INCOMPLET") && (
                      <Link 
                        href={`/dossier/${application.id}?edit=true`}
                        className="text-[11px] text-[#1463FF] hover:underline font-bold"
                      >
                        Modifier
                      </Link>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span>Activité :</span>
                      <span className="font-bold text-primary">{getStatusLabelFr(application.candidate.employmentStatus || "")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Votre revenu :</span>
                      <span className="font-bold">{application.candidate.declaredMonthlyIncome || 0} € / mois</span>
                    </div>
                    {application.candidate.isColocation && application.candidate.roommates && application.candidate.roommates.length > 0 && (
                      <div className="border-t pt-2 mt-2 space-y-1">
                        <p className="font-bold text-slate-800 text-[10px] uppercase">Colocataires ({application.candidate.roommates.length}) :</p>
                        {application.candidate.roommates.map((rm: any, i: number) => (
                          <div key={i} className="flex justify-between text-[11px] text-slate-600 pl-2">
                            <span>{rm.firstName} ({getStatusLabelFr(rm.employmentStatus || "")}) :</span>
                            <span className="font-semibold">{rm.declaredMonthlyIncome || 0} €</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {application.candidate.hasGuarantor && application.candidate.guarantor && (
                      <div className="border-t pt-2 mt-2 space-y-1 bg-white/50 p-2 rounded-xl">
                        <p className="font-bold text-[#1463FF] text-[10px] uppercase">Garant :</p>
                        <p className="text-[11px] font-semibold text-slate-700">{application.candidate.guarantor.firstName} {application.candidate.guarantor.lastName}</p>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Revenu garant :</span>
                          <span className="font-bold">{application.candidate.guarantor.declaredMonthlyIncome || 0} €/m</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Progression & Dépôt */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Progression documents</span>
                    <span>{uploadedMandatory} / {mandatoryDocs.length}</span>
                  </div>
                </div>

                {(application.status === "NOUVEAU" || application.status === "INCOMPLET") && (
                  <div className="pt-2">
                    <SubmitDossierForm 
                      applicationId={application.id} 
                      rent={application.property.rent} 
                      progress={progress} 
                      allApproved={allUploadedDocsApproved}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
