"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateStatusSchema = z.object({
  applicationId: z.string(),
  status: z.enum(["NOUVEAU", "INCOMPLET", "EN_COURS", "ACCEPTE", "REFUSE"]),
});

export async function updateApplicationStatus(prevState: any, formData: FormData) {
  const parsed = UpdateStatusSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId, status } = parsed.data;

  try {
    const oldApp = await prisma.application.findUnique({ where: { id: applicationId } });
    
    await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    if (oldApp && oldApp.status !== status) {
      await prisma.auditLog.create({
        data: {
          applicationId,
          action: "STATUS_CHANGE",
          details: `Statut passé de ${oldApp.status} à ${status}`
        }
      });
    }

    revalidatePath(`/admin/dossiers/${applicationId}`);
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la mise à jour." };
  }
}

const ConfirmVisitSchema = z.object({
  applicationId: z.string(),
  slotId: z.string(),
});

export async function confirmVisitSlotAction(prevState: any, formData: FormData) {
  const parsed = ConfirmVisitSchema.safeParse({
    applicationId: formData.get("applicationId"),
    slotId: formData.get("slotId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId, slotId } = parsed.data;

  // Récupérer les infos
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, property: true }
  });

  const slot = await prisma.visitSlot.findUnique({
    where: { id: slotId }
  });

  if (!application || !slot) {
    return { error: "Données introuvables" };
  }

  // Mettre le slot en BOOKED
  await prisma.visitSlot.update({
    where: { id: slotId },
    data: { status: "BOOKED" }
  });

  // Déconnecter les autres slots de la candidature pour clarifier
  const otherSlots = await prisma.visitSlot.findMany({
    where: {
      applications: { some: { id: applicationId } },
      id: { not: slotId }
    }
  });

  if (otherSlots.length > 0) {
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        visitSlots: {
          disconnect: otherSlots.map(s => ({ id: s.id }))
        }
      }
    });
  }

  // Logger l'audit
  await prisma.auditLog.create({
    data: {
      applicationId,
      action: "VISITE_VALIDEE",
      details: `Créneau de visite validé pour le ${slot.date.toLocaleString('fr-FR')}. Un email a été envoyé au candidat.`
    }
  });

  // Simulation de l'envoi d'email avec Nodemailer + Ethereal
  try {
    const nodemailer = require("nodemailer");
    // Créer un compte de test Ethereal
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Bail-Bail Admin" <admin@bail-bail.com>',
      to: application.candidate.email,
      subject: "Confirmation de votre visite - Bail-Bail",
      text: `Bonjour ${application.candidate.firstName},\n\nVotre visite pour le logement ${application.property.title} a été confirmée pour le ${slot.date.toLocaleString('fr-FR')}.\n\nÀ bientôt !`,
      html: `<b>Bonjour ${application.candidate.firstName},</b><br><br>Votre visite pour le logement ${application.property.title} a été <b>confirmée</b> pour le ${slot.date.toLocaleString('fr-FR')}.<br><br>À bientôt !`,
    });

    console.log("================ EMAILS SIMULÉS ==================");
    console.log("Email envoyé ! Visualisez-le ici : %s", nodemailer.getTestMessageUrl(info));
    console.log("==================================================");

  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email :", err);
  }

  return { success: true };
}

const UpdateDocumentStatusSchema = z.object({
  documentId: z.string(),
  status: z.enum(["VALIDATED", "REJECTED", "PENDING"]),
  rejectionReason: z.string().optional(),
});

export async function updateDocumentStatusAction(prevState: any, formData: FormData) {
  const parsed = UpdateDocumentStatusSchema.safeParse({
    documentId: formData.get("documentId"),
    status: formData.get("status"),
    rejectionReason: formData.get("rejectionReason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { documentId, status, rejectionReason } = parsed.data;

  try {
    const doc = await prisma.document.findUnique({ 
      where: { id: documentId },
      include: {
        application: {
          include: { candidate: true, property: true }
        }
      }
    });
    
    if (!doc) return { error: "Document introuvable" };

    await prisma.document.update({
      where: { id: documentId },
      data: { status, rejectionReason: status === "REJECTED" ? rejectionReason : null }
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        applicationId: doc.applicationId,
        action: "DOCUMENT_VERIFIE",
        details: `Le document ${doc.type} a été ${status === "VALIDATED" ? "validé" : "refusé"}${rejectionReason ? ` (Motif : ${rejectionReason})` : ""}.`
      }
    });

    // Envoi d'email si refusé
    if (status === "REJECTED") {
      try {
        const nodemailer = require("nodemailer");
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const info = await transporter.sendMail({
          from: '"Bail-Bail Admin" <admin@bail-bail.com>',
          to: doc.application.candidate.email,
          subject: "Action requise : Document refusé - Bail-Bail",
          text: `Bonjour ${doc.application.candidate.firstName},\n\nConcernant votre dossier pour le logement ${doc.application.property.title}, un document (${doc.type}) a été refusé.\n\nMotif : ${rejectionReason || 'Non spécifié'}\n\nMerci de bien vouloir fournir un nouveau document valide.\n\nCordialement, l'équipe Bail-Bail.`,
          html: `<b>Bonjour ${doc.application.candidate.firstName},</b><br><br>Concernant votre dossier pour le logement ${doc.application.property.title}, un document (<b>${doc.type}</b>) a été <b>refusé</b>.<br><br><b>Motif du refus :</b> ${rejectionReason || 'Non spécifié'}<br><br>Merci de bien vouloir vous connecter à votre espace pour fournir un nouveau document valide.<br><br>Cordialement, l'équipe Bail-Bail.`,
        });

        console.log("================ EMAILS SIMULÉS (REFUS DOCUMENT) ==================");
        console.log("Email envoyé ! Visualisez-le ici : %s", nodemailer.getTestMessageUrl(info));
        console.log("===================================================================");
      } catch (err) {
        console.error("Erreur lors de l'envoi de l'email de refus :", err);
      }
    }

    revalidatePath(`/admin/dossiers/${doc.applicationId}`);
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la mise à jour." };
  }
}
