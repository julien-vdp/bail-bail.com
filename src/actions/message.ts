"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

const emailWrapper = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
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

export async function sendMessageAction(applicationId: string, content: string) {
  const session = await verifySession();
  if (!session) {
    return { error: "Vous devez être connecté pour envoyer un message." };
  }

  if (!content || !content.trim()) {
    return { error: "Le message ne peut pas être vide." };
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        property: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!application) {
      return { error: "Candidature introuvable." };
    }

    // Vérifier l'autorisation
    const isCandidate =
      session.role === "CANDIDATE" &&
      (application.candidateId === session.id || application.candidate.email === session.email);

    const isOwner =
      session.role === "OWNER" &&
      (application.property.ownerId === session.id ||
        application.property.owner?.email === session.email);

    if (!isCandidate && !isOwner) {
      return { error: "Vous n'êtes pas autorisé à envoyer de message sur ce dossier." };
    }

    // Créer le message en base de données
    await prisma.message.create({
      data: {
        applicationId,
        senderId: session.id,
        senderRole: session.role,
        senderName: session.name,
        content: content.trim(),
      },
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        applicationId,
        action: "MESSAGE_ENVOYE",
        details: `Message envoyé par ${
          session.role === "CANDIDATE" ? "le candidat" : "le propriétaire"
        } (${session.name})`,
      },
    });

    // Préparer l'envoi de l'email
    let recipientEmail = "";
    let recipientName = "";
    let emailSubject = "";
    let emailHtml = "";
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bail-bail.com";
    if (appUrl.endsWith("/")) {
      appUrl = appUrl.slice(0, -1);
    }

    if (session.role === "CANDIDATE") {
      const owner = application.property.owner;
      if (owner && owner.email) {
        recipientEmail = owner.email;
        recipientName = owner.name;
        emailSubject = `[Bail-Bail] Nouveau message de ${session.name} pour ${application.property.title}`;
        emailHtml = `
          <p>Bonjour <strong>${recipientName}</strong>,</p>
          <p>Vous avez reçu un nouveau message de <strong>${session.name}</strong> concernant le logement <strong>${application.property.title}</strong>.</p>
          <div style="background: #f8fafc; border-left: 4px solid #1463FF; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; color: #475569; font-style: italic; white-space: pre-wrap;">"${content.trim()}"</p>
          </div>
          <p>Pour lui répondre, accédez à votre espace propriétaire :</p>
          <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
            <a href="${appUrl}/admin/dossiers/${applicationId}" style="padding: 12px 24px; background: #1463FF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à la messagerie du dossier</a>
          </div>
        `;
      }
    } else {
      const candidate = application.candidate;
      recipientEmail = candidate.email;
      recipientName = `${candidate.firstName} ${candidate.lastName}`;
      emailSubject = `[Bail-Bail] Nouveau message du propriétaire pour ${application.property.title}`;
      emailHtml = `
        <p>Bonjour <strong>${candidate.firstName}</strong>,</p>
        <p>Le propriétaire du logement <strong>${application.property.title}</strong> vous a envoyé un nouveau message concernant votre candidature.</p>
        <div style="background: #f8fafc; border-left: 4px solid #1463FF; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; color: #475569; font-style: italic; white-space: pre-wrap;">"${content.trim()}"</p>
        </div>
        <p>Pour lui répondre, accédez à votre dossier de location :</p>
        <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
          <a href="${appUrl}/dossier/${applicationId}" style="padding: 12px 24px; background: #1463FF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à la messagerie de mon dossier</a>
        </div>
      `;
    }

    if (recipientEmail) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject: emailSubject,
          html: emailWrapper(emailSubject, emailHtml),
        });
      } catch (err) {
        console.error("Erreur lors de l'envoi de l'email de notification :", err);
      }
    }

    // Réactualiser les pages
    revalidatePath(`/dossier/${applicationId}`);
    revalidatePath(`/admin/dossiers/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'envoi du message :", error);
    return { error: "Une erreur est survenue lors de l'envoi du message." };
  }
}
