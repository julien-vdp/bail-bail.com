import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileText, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { UploadForm } from "./UploadForm";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SubmitDossierForm } from "@/components/SubmitDossierForm";
import { CandidateWarningScreen } from "@/components/CandidateWarningScreen";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import Image from "next/image";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
export default async function DossierPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const applicationId = (await params).applicationId;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      property: true,
      candidate: true,
      documents: true,
    }
  });

  if (!application) {
    notFound();
  }

  // Dynamic documents based on student status
  const EXPECTED_DOCUMENTS = [
    { id: "ID_CARD", label: "Pièce d'identité" },
    { id: "INCOME", label: "Justificatif de revenus / Bourses" },
    { 
      id: "EMPLOYMENT", 
      label: application.isStudent ? "Contrat étudiant ou attestation (Optionnel)" : "Contrat de travail ou attestation", 
      optional: application.isStudent // Optional for students!
    },
    ...(application.isStudent ? [{ id: "STUDENT_CARD", label: "Carte étudiante ou certificat" }] : []),
    { id: "TAX", label: "Dernier avis d'imposition" },
    { id: "RESIDENCE", label: "Justificatif de domicile" },
    { 
      id: "GUARANTOR", 
      label: application.isStudent ? "Dossier du Garant (Obligatoire)" : "Documents garant (Optionnel)", 
      optional: !application.isStudent // Mandatory for students!
    },
  ];

  // Calcul progression
  const mandatoryDocs = EXPECTED_DOCUMENTS.filter(d => !d.optional);
  const uploadedMandatory = mandatoryDocs.filter(d => 
    application.documents.some(doc => doc.type === d.id)
  ).length;
  
  const progress = mandatoryDocs.length > 0 ? Math.round((uploadedMandatory / mandatoryDocs.length) * 100) : 100;

  if (!application.hasAcceptedConditions) {
    return (
      <div className="container max-w-4xl mx-auto p-4 min-h-screen relative">
        <CandidateWarningScreen applicationId={application.id} property={application.property} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="container max-w-5xl mx-auto p-4 py-8 md:py-12 space-y-8">
        
        {/* Header & RGPD Section */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-primary/5 border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex-1 space-y-6 relative z-10">
            <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 mb-2">
              Dossier n° {application.id.split('-')[0].toUpperCase()}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Constituez votre dossier pour <span className="text-primary">{application.property.title}</span>
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
              width={250} 
              height={250}
              className="drop-shadow-2xl mix-blend-multiply"
            />
          </div>
        </div>

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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">Pièces justificatives</h2>
                <p className="text-slate-500 mt-1">Uploadez les documents manquants au format PDF, JPG ou PNG.</p>
              </div>
              
              <div className="p-6 space-y-6">
                {EXPECTED_DOCUMENTS.map(expectedDoc => {
                  const uploadedDoc = application.documents.find(d => d.type === expectedDoc.id);
                  
                  return (
                    <div key={expectedDoc.id} className={`p-5 border rounded-2xl space-y-4 transition-all duration-300 shadow-sm ${uploadedDoc ? 'bg-gradient-to-br from-green-50/50 to-white border-green-200' : 'bg-white border-slate-200 hover:border-primary/30 hover:shadow-md'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold flex items-center gap-3 ${uploadedDoc ? 'text-green-800' : 'text-slate-800'}`}>
                          {uploadedDoc ? (
                            <div className="bg-green-100 p-2 rounded-full shadow-sm"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                          ) : (
                            <div className="bg-slate-100 p-2 rounded-full"><Clock className="w-5 h-5 text-slate-400" /></div>
                          )}
                          {expectedDoc.label}
                          {expectedDoc.optional && <span className="text-xs text-slate-500 bg-white/60 border border-slate-200 px-2 py-0.5 rounded-full font-medium ml-2">Optionnel</span>}
                        </span>
                      </div>

                      {!uploadedDoc ? (
                        <div className="pt-2">
                          <UploadForm applicationId={applicationId} documentType={expectedDoc.id} />
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-white/60 backdrop-blur-sm border border-green-100 p-3 rounded-xl mt-2 shadow-sm gap-3 sm:gap-0">
                          <span className="flex items-center gap-2 text-slate-700 font-medium truncate sm:max-w-[200px]">
                            <FileText className="w-5 h-5 text-green-600 drop-shadow-sm" />
                            <span className="truncate">{uploadedDoc.fileName}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <DocumentViewerModal fileName={uploadedDoc.fileName} />
                            {(application.status === "NOUVEAU" || application.status === "INCOMPLET") && (
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
          </div>

          {/* Sidebar / Recap */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Récapitulatif</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidat</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-800 text-lg">{application.candidate.firstName} {application.candidate.lastName}</p>
                    <p className="text-slate-500 mt-1">{application.candidate.email}</p>
                    <p className="text-slate-500">{application.candidate.phone}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logement</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-800">{application.property.shortAddress}</p>
                    <p className="text-primary font-bold text-xl mt-2">{application.property.rent} € <span className="text-sm font-medium text-slate-500">/ mois</span></p>
                  </div>
                </div>

                {(application.status === "NOUVEAU" || application.status === "INCOMPLET") && (
                  <div className="pt-4 border-t border-slate-100">
                    <SubmitDossierForm 
                      applicationId={application.id} 
                      rent={application.property.rent} 
                      progress={progress} 
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
