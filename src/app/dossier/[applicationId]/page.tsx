import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileText, Clock } from "lucide-react";
import { UploadForm } from "./UploadForm";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { SubmitDossierForm } from "@/components/SubmitDossierForm";
import { CandidateWarningScreen } from "@/components/CandidateWarningScreen";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";

// Moved to a function inside the component to be dynamic
// const EXPECTED_DOCUMENTS = [...]

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
    <div className="container max-w-4xl mx-auto p-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Votre dossier de location</h1>
        <p className="text-muted-foreground text-lg">
          Logement : {application.property.title}
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-3">
        <h3 className="font-semibold text-primary">Statut de votre dossier : {application.status}</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Vos documents sont uniquement utilisés pour l'étude du dossier. Dans la vraie version, ils seront protégés, chiffrés et supprimés automatiquement après traitement.
        </p>
        <div className="space-y-2 mt-4 max-w-md mx-auto">
          <div className="flex justify-between text-sm font-medium">
            <span>Complétude du dossier</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-secondary/30 border-b border-border">
              <CardTitle>Documents requis</CardTitle>
              <CardDescription>Uploadez les documents manquants (PDF, JPG, PNG).</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {EXPECTED_DOCUMENTS.map(expectedDoc => {
                const uploadedDoc = application.documents.find(d => d.type === expectedDoc.id);
                
                return (
                  <div key={expectedDoc.id} className="p-4 border rounded-lg space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-2">
                        {uploadedDoc ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        {expectedDoc.label}
                        {expectedDoc.optional && <span className="text-xs text-muted-foreground font-normal">(Optionnel)</span>}
                      </span>
                    </div>

                    {!uploadedDoc ? (
                      <UploadForm applicationId={applicationId} documentType={expectedDoc.id} />
                    ) : (
                      <div className="flex items-center justify-between text-sm bg-secondary/50 p-2 rounded-md">
                        <span className="flex items-center gap-2 text-muted-foreground truncate max-w-[200px]">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{uploadedDoc.fileName}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <Link href={uploadedDoc.filePath} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm", className: "px-2" })}>Voir</Link>
                          {(application.status === "NOUVEAU" || application.status === "INCOMPLET") && (
                            <DeleteDocumentButton documentId={uploadedDoc.id} applicationId={application.id} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Candidat</span>
                <p className="font-medium">{application.candidate.firstName} {application.candidate.lastName}</p>
                <p className="text-sm">{application.candidate.email}</p>
                <p className="text-sm">{application.candidate.phone}</p>
              </div>
              <div className="pt-4 border-t border-border mt-4 space-y-1">
                <span className="text-sm text-muted-foreground">Logement</span>
                <p className="font-medium">{application.property.shortAddress}</p>
                <p className="text-sm">{application.property.rent} € / mois</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {(application.status === "NOUVEAU" || application.status === "INCOMPLET") && (
        <SubmitDossierForm 
          applicationId={application.id} 
          rent={application.property.rent} 
          progress={progress} 
        />
      )}
    </div>
  );
}
