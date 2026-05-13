"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

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

export async function validateDossierAction(prevState: any, formData: FormData) {
  const parsed = ValidateDossierSchema.safeParse({
    applicationId: formData.get("applicationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId } = parsed.data;

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
});

export async function acceptConditionsAction(prevState: any, formData: FormData) {
  const parsed = AcceptConditionsSchema.safeParse({
    applicationId: formData.get("applicationId"),
    isStudent: formData.get("isStudent") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId, isStudent } = parsed.data;

  await prisma.application.update({
    where: { id: applicationId },
    data: { 
      hasAcceptedConditions: true,
      isStudent 
    }
  });

  revalidatePath(`/dossier/${applicationId}`);

  return { success: true };
}
