"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateDocumentRequirements } from "@/lib/documentRequirements";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import fs from "fs/promises";
import path from "path";
import { getPrivateUploadsRoot } from "@/lib/storage";

const SearchPropertySchema = z.object({
  code: z.string().min(1, "Veuillez saisir un code logement."),
});

export async function searchPropertyAction(prevState: any, formData: FormData) {
  const parsed = SearchPropertySchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const code = parsed.data.code.trim().toUpperCase();

  const property = await prisma.property.findUnique({
    where: { code },
  });

  if (!property) {
    return { error: "Logement introuvable. Veuillez vérifier le code." };
  }

  if (property.status !== "AVAILABLE") {
    return { error: "Ce logement n'est plus disponible pour de nouvelles candidatures." };
  }

  // Si le logement existe, on redirige vers sa page
  redirect(`/logement/${code}`);
}

const SubmitApplicationSchema = z.object({
  propertyId: z.string(),
  slotIds: z.array(z.string()).min(1, "Veuillez sélectionner au moins un créneau"),
});

export async function submitApplicationAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "CANDIDATE") {
    return { error: "Vous devez être connecté en tant que candidat." };
  }

  const slotIds = formData.getAll("slotIds") as string[];
  
  const parsed = SubmitApplicationSchema.safeParse({
    propertyId: formData.get("propertyId"),
    slotIds: slotIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const candidateId = session.id;

  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
    include: { visitSlots: { where: { id: { in: data.slotIds } } } }
  });
  if (!property || property.status !== "AVAILABLE") {
    return { error: "Ce logement n'est plus disponible pour de nouvelles candidatures." };
  }
  if (property.visitSlots.length !== data.slotIds.length) {
    return { error: "Un ou plusieurs créneaux sont invalides pour ce logement." };
  }

  // Vérifier si une candidature existe déjà pour ce logement
  const existingApp = await prisma.application.findFirst({
    where: {
      propertyId: data.propertyId,
      candidateId: candidateId,
    }
  });

  let applicationId;

  if (existingApp) {
    applicationId = existingApp.id;
    // Mettre à jour les créneaux
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        visitSlots: {
          set: data.slotIds.map(id => ({ id }))
        }
      }
    });
  } else {
    const newApp = await prisma.application.create({
      data: {
        propertyId: data.propertyId,
        candidateId: candidateId,
        visitSlots: {
          connect: data.slotIds.map(id => ({ id }))
        }
      }
    });
    applicationId = newApp.id;
    
    await prisma.auditLog.create({
      data: {
        applicationId,
        action: "CREATION_DOSSIER",
        details: "Dossier créé et créneaux sélectionnés"
      }
    });
  }

  redirect(`/dossier/${applicationId}`);
}

const ValidateDossierSchema = z.object({
  applicationId: z.string(),
});

const ApproveDocumentSchema = z.object({
  documentId: z.string(),
  approved: z.boolean(),
  comment: z.string().optional(),
});

export async function approveDocumentAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "CANDIDATE") {
    return { error: "Vous devez être connecté en tant que candidat." };
  }

  const parsed = ApproveDocumentSchema.safeParse({
    documentId: formData.get("documentId"),
    approved: formData.get("approved") === "true",
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { documentId, approved, comment } = parsed.data;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        application: {
          include: { candidate: { select: { email: true } } }
        }
      }
    });

    if (
      !document ||
      (
        document.application.candidateId !== session.id &&
        document.application.candidate.email !== session.email
      )
    ) {
      return { error: "Document introuvable ou non autorisé." };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        candidateApproved: approved,
        candidateComment: approved ? (comment || null) : null,
      }
    });

    await prisma.auditLog.create({
      data: {
        applicationId: document.applicationId,
        action: approved ? "DOCUMENT_VALIDE_CANDIDAT" : "DOCUMENT_DEVALIDE_CANDIDAT",
        details: `Le candidat a ${approved ? 'validé' : 'dé-validé'} le document ${document.type}${comment ? ` avec le commentaire : "${comment}"` : ""}.`
      }
    });

    revalidatePath(`/dossier/${document.applicationId}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la validation du document par le candidat:", error);
    return { error: "Impossible de mettre à jour la validation du document." };
  }
}

export async function validateDossierAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "CANDIDATE") {
    return { error: "Vous devez être connecté en tant que candidat." };
  }

  const parsed = ValidateDossierSchema.safeParse({
    applicationId: formData.get("applicationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId } = parsed.data;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: { select: { email: true } } }
  });
  if (
    !application ||
    (
      application.candidateId !== session.id &&
      application.candidate.email !== session.email
    )
  ) {
    return { error: "Dossier introuvable ou non autorisé." };
  }

  // Vérifier si des documents ne sont pas encore validés par le candidat
  const unapprovedDocs = await prisma.document.count({
    where: {
      applicationId,
      candidateApproved: false
    }
  });

  if (unapprovedDocs > 0) {
    return { error: "Vous devez valider toutes les pièces déposées (filigrane) avant de pouvoir soumettre le dossier." };
  }

  const app = await prisma.application.update({
    where: { id: applicationId },
    data: { status: "COMPLET" },
    include: {
      candidate: true,
      property: {
        include: {
          owner: true
        }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      applicationId,
      action: "SOUMISSION_DOSSIER",
      details: "Dossier validé et soumis pour étude par le candidat."
    }
  });

  const emailWrapper = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 40px; margin-bottom: 40px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://www.bail-bail.com/logo.png" alt="Bail-Bail Logo" style="width: 80px; height: 80px; border-radius: 16px; object-fit: contain;" />
      <h1 style="color: #0f172a; margin-top: 20px; font-size: 24px;">${title}</h1>
    </div>
    <div style="color: #334155; font-size: 16px; line-height: 1.6;">
      ${content}
    </div>
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 14px;">Bail-Bail - La location simplifiée</p>
    </div>
  </div>
</body>
</html>
`;

  // Email au propriétaire
  if (app.property.owner?.email) {
    await sendEmail({
      to: app.property.owner.email,
      subject: `Nouveau dossier complet : ${app.property.title}`,
      html: emailWrapper(
        "Nouveau dossier complet",
        `
        <p>Bonjour <strong>${app.property.owner.name}</strong>,</p>
        <p>Le candidat <strong>${app.candidate.firstName} ${app.candidate.lastName}</strong> a finalisé le dépôt de ses pièces justificatives pour votre annonce <strong>${app.property.title}</strong>.</p>
        <p>Le statut de sa candidature est passé à <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Complet</span>.</p>
        <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
          <a href="https://bail-bail.com/auth" style="padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accéder à mon espace propriétaire</a>
        </div>
        `
      )
    });
  }

  // Email au candidat
  await sendEmail({
    to: app.candidate.email,
    subject: `Votre dossier est complet : ${app.property.title}`,
    html: emailWrapper(
      "Dossier envoyé avec succès",
      `
      <p>Bonjour <strong>${app.candidate.firstName}</strong>,</p>
      <p>Félicitations ! Vous avez finalisé le dépôt de vos pièces justificatives pour le logement <strong>${app.property.title}</strong>.</p>
      <p>Votre dossier a été automatiquement transmis au propriétaire. Celui-ci l'étudiera dans les plus brefs délais et reviendra vers vous.</p>
      <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
        <a href="https://bail-bail.com/dossier/${app.id}" style="padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Suivre ma candidature</a>
      </div>
      `
    )
  });

  return { success: true };
}

const AcceptConditionsSchema = z.object({
  applicationId: z.string(),
  isStudent: z.boolean().default(false),
  isColocation: z.boolean().default(false),
  roommateFirstName: z.string().optional(),
  roommateLastName: z.string().optional(),
  roommateEmploymentStatus: z.string().optional(),
  roommateIncome: z.number().optional(),
});

const DeleteApplicationSchema = z.object({
  applicationId: z.string(),
});

export async function acceptConditionsAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "CANDIDATE") {
    return { error: "Vous devez être connecté en tant que candidat." };
  }

  const parsed = AcceptConditionsSchema.safeParse({
    applicationId: formData.get("applicationId"),
    isStudent: formData.get("isStudent") === "true",
    isColocation: formData.get("isColocation") === "true",
    roommateFirstName: formData.get("roommateFirstName") as string || undefined,
    roommateLastName: formData.get("roommateLastName") as string || undefined,
    roommateEmploymentStatus: formData.get("roommateEmploymentStatus") as string || undefined,
    roommateIncome: formData.get("roommateIncome") ? Number(formData.get("roommateIncome")) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { 
    applicationId, 
    isStudent, 
    isColocation, 
    roommateFirstName, 
    roommateLastName, 
    roommateEmploymentStatus, 
    roommateIncome 
  } = parsed.data;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: { select: { email: true, id: true } }, property: true }
  });
  if (
    !application ||
    (
      application.candidateId !== session.id &&
      application.candidate.email !== session.email
    )
  ) {
    return { error: "Dossier introuvable ou non autorisé." };
  }

  const candidateId = application.candidateId;

  // Mettre à jour le statut colocation du candidat
  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      isColocation,
      roommatesCount: isColocation ? 1 : 0,
    }
  });

  // Mettre à jour le colocataire
  if (isColocation && roommateFirstName && roommateLastName) {
    await prisma.roommate.deleteMany({
      where: { candidateId }
    });
    await prisma.roommate.create({
      data: {
        candidateId,
        firstName: roommateFirstName,
        lastName: roommateLastName,
        employmentStatus: roommateEmploymentStatus || "CDI",
        declaredMonthlyIncome: roommateIncome || 0,
      }
    });
  } else if (!isColocation) {
    await prisma.roommate.deleteMany({
      where: { candidateId }
    });
  }

  // Mettre à jour la candidature
  await prisma.application.update({
    where: { id: applicationId },
    data: { 
      hasAcceptedConditions: true,
      isStudent 
    }
  });

  // Synchroniser les pièces justificatives
  const updatedCandidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { roommates: true, guarantor: true }
  });
  const { syncDocumentRequirements } = await import("@/lib/documentRequirements");
  await syncDocumentRequirements(applicationId, application.property, updatedCandidate);

  revalidatePath(`/dossier/${applicationId}`);

  return { success: true };
}

export async function deleteApplicationAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "CANDIDATE") {
    return { error: "Vous devez être connecté en tant que candidat." };
  }

  const parsed = DeleteApplicationSchema.safeParse({
    applicationId: formData.get("applicationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId } = parsed.data;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: { select: { email: true } },
      documents: true,
      visitSlots: true,
    }
  });

  if (
    !application ||
    (
      application.candidateId !== session.id &&
      application.candidate.email !== session.email
    )
  ) {
    return { error: "Dossier introuvable ou non autorisé." };
  }

  if (application.status === "ACCEPTE") {
    return { error: "Un dossier accepté ne peut pas être supprimé depuis cet espace." };
  }

  for (const document of application.documents) {
    const filePath = path.join(getPrivateUploadsRoot(), "documents", applicationId, `${document.id}.enc`);
    try {
      await fs.unlink(filePath);
    } catch {
      // The database record is still removed below, even if the physical file was already gone.
    }
  }

  if (application.visitSlots.length > 0) {
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        visitSlots: {
          disconnect: application.visitSlots.map((slot: { id: string }) => ({ id: slot.id }))
        }
      }
    });
  }

  await prisma.application.delete({
    where: { id: applicationId }
  });

  revalidatePath("/compte");
  return { success: true };
}

const SaveProfileSchema = z.object({
  applicationId: z.string(),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("L'adresse e-mail est invalide"),
  phone: z.string().min(6, "Le numéro de téléphone doit comporter au moins 6 chiffres"),
  employmentStatus: z.string().min(1, "Veuillez indiquer votre situation professionnelle"),
  declaredMonthlyIncome: z.coerce.number().min(0, "Le revenu mensuel déclaré doit être supérieur ou égal à 0"),
  hasGuarantor: z.boolean().default(false),
  
  isInProbationPeriod: z.boolean().optional().nullable(),
  cddRemainingMonths: z.coerce.number().optional().nullable(),
  selfEmployedYears: z.coerce.number().optional().nullable(),
  isStudentOrApprentice: z.boolean().optional().nullable(),
  isApprentice: z.boolean().optional().nullable(),
  isColocation: z.boolean().default(false),
  roommatesCount: z.coerce.number().default(0),

  isCdiMobility: z.boolean().optional().nullable(),
  roommatesJson: z.string().optional().nullable(),
  
  guarantorFirstName: z.string().optional().nullable(),
  guarantorLastName: z.string().optional().nullable(),
  guarantorEmploymentStatus: z.string().optional().nullable(),
  guarantorDeclaredMonthlyIncome: z.coerce.number().optional().nullable(),
  guarantorFiscalResidenceInFrance: z.boolean().default(true),
});

export async function saveCandidateProfileAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "CANDIDATE") {
    return { error: "Vous devez être connecté en tant que candidat." };
  }

  const parsed = SaveProfileSchema.safeParse({
    applicationId: formData.get("applicationId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    employmentStatus: formData.get("employmentStatus"),
    declaredMonthlyIncome: formData.get("declaredMonthlyIncome"),
    hasGuarantor: formData.get("hasGuarantor") === "true",
    
    isInProbationPeriod: formData.get("isInProbationPeriod") === "true",
    cddRemainingMonths: formData.get("cddRemainingMonths") ? Number(formData.get("cddRemainingMonths")) : null,
    selfEmployedYears: formData.get("selfEmployedYears") ? Number(formData.get("selfEmployedYears")) : null,
    isStudentOrApprentice: formData.get("isStudentOrApprentice") === "true" || formData.get("employmentStatus") === "STUDENT",
    isApprentice: formData.get("isApprentice") === "true",
    isColocation: formData.get("isColocation") === "true",
    roommatesCount: formData.get("roommatesCount") ? Number(formData.get("roommatesCount")) : 0,

    isCdiMobility: formData.get("isCdiMobility") === "true",
    roommatesJson: formData.get("roommatesJson"),
    
    guarantorFirstName: formData.get("guarantorFirstName"),
    guarantorLastName: formData.get("guarantorLastName"),
    guarantorEmploymentStatus: formData.get("guarantorEmploymentStatus"),
    guarantorDeclaredMonthlyIncome: formData.get("guarantorDeclaredMonthlyIncome") ? Number(formData.get("guarantorDeclaredMonthlyIncome")) : null,
    guarantorFiscalResidenceInFrance: formData.get("guarantorFiscalResidenceInFrance") !== "false",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    applicationId,
    firstName,
    lastName,
    email,
    phone,
    employmentStatus,
    declaredMonthlyIncome,
    hasGuarantor,
    isInProbationPeriod,
    cddRemainingMonths,
    selfEmployedYears,
    isStudentOrApprentice,
    isApprentice,
    isColocation,
    isCdiMobility,
    roommatesCount,
    roommatesJson,
    guarantorFirstName,
    guarantorLastName,
    guarantorEmploymentStatus,
    guarantorDeclaredMonthlyIncome,
    guarantorFiscalResidenceInFrance,
  } = parsed.data;

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { candidate: true, property: true }
    });

    if (
      !application ||
      (application.candidateId !== session.id && application.candidate.email !== session.email)
    ) {
      return { error: "Dossier introuvable ou non autorisé." };
    }

    // Update candidate details
    await prisma.candidate.update({
      where: { id: application.candidateId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        employmentStatus,
        declaredMonthlyIncome,
        hasGuarantor,
        isInProbationPeriod,
        cddRemainingMonths,
        selfEmployedYears,
        isStudentOrApprentice,
        isApprentice,
        isColocation,
        isCdiMobility,
        roommatesCount,
      }
    });

    // Sync isStudent on application
    const isStudent = employmentStatus === "STUDENT" || isStudentOrApprentice === true;
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        isStudent,
      }
    });

    // Supprimer les anciens colocataires et garants
    await prisma.roommate.deleteMany({ where: { candidateId: application.candidateId } });
    await prisma.guarantor.deleteMany({ where: { candidateId: application.candidateId } });

    // Créer le garant si hasGuarantor est vrai
    if (hasGuarantor && guarantorFirstName && guarantorLastName) {
      await prisma.guarantor.create({
        data: {
          candidateId: application.candidateId,
          firstName: guarantorFirstName,
          lastName: guarantorLastName,
          employmentStatus: guarantorEmploymentStatus || "CDI",
          declaredMonthlyIncome: guarantorDeclaredMonthlyIncome || 0,
          fiscalResidenceInFrance: guarantorFiscalResidenceInFrance,
        }
      });
    }

    // Créer les colocataires
    if (isColocation && roommatesJson) {
      try {
        const roommatesList = JSON.parse(roommatesJson);
        if (Array.isArray(roommatesList)) {
          await prisma.roommate.createMany({
            data: roommatesList.map((roommate: any) => ({
              candidateId: application.candidateId,
              firstName: roommate.firstName || "",
              lastName: roommate.lastName || "",
              employmentStatus: roommate.employmentStatus || "CDI",
              declaredMonthlyIncome: Number(roommate.declaredMonthlyIncome || 0),
            }))
          });
        }
      } catch (e) {
        console.error("Error parsing roommatesJson:", e);
      }
    }

    // Fetch full updated candidate with roommates and guarantor
    const candidateData = await prisma.candidate.findUnique({
      where: { id: application.candidateId },
      include: { roommates: true, guarantor: true }
    });

    // Sync document requirements
    const { syncDocumentRequirements } = await import("@/lib/documentRequirements");
    await syncDocumentRequirements(applicationId, application.property, candidateData);

    await prisma.auditLog.create({
      data: {
        applicationId,
        action: "PROFIL_COMPLETE",
        details: `Profil candidat mis à jour : ${employmentStatus}, ${declaredMonthlyIncome}€/mois, garant: ${hasGuarantor ? 'Oui' : 'Non'}.`
      }
    });

    revalidatePath(`/dossier/${applicationId}`);
    return { success: true };
  } catch (error) {
    console.error("Error saving candidate profile:", error);
    return { error: "Impossible d'enregistrer les informations de votre profil." };
  }
}

