"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { getParisDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

async function requireOwnerSession() {
  const session = await verifySession();
  if (!session || session.role !== "OWNER") return null;
  return session;
}

const UpdateStatusSchema = z.object({
  applicationId: z.string(),
  status: z.enum(["NOUVEAU", "INCOMPLET", "SOUMIS_INCOMPLET", "COMPLET", "EN_COURS", "ACCEPTE", "REFUSE"]),
});

export async function updateApplicationStatus(prevState: any, formData: FormData) {
  const session = await requireOwnerSession();
  if (!session) return { error: "Non autorisé" };

  const parsed = UpdateStatusSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId, status } = parsed.data;

  try {
    const oldApp = await prisma.application.findUnique({ 
      where: { id: applicationId },
      include: { candidate: true, property: true, documents: true, visitSlots: true }
    });
    if (!oldApp || oldApp.property.ownerId !== session.id) {
      return { error: "Dossier introuvable ou non autorisé" };
    }
    
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

      // Envoi de l'email si le dossier est ACCEPTE
      if (status === "ACCEPTE") {
        try {
          const nodemailer = require("nodemailer");
          let transporter;

          if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            // Mode Production Réel
            transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
              },
            });
          } else {
            // Mode Simulation Ethereal
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: { user: testAccount.user, pass: testAccount.pass },
            });
          }

          const fromEmail = process.env.EMAIL_FROM || '"Bail-Bail" <contact@bail-bail.com>';
          const info = await transporter.sendMail({
            from: fromEmail,
            to: oldApp.candidate.email,
            subject: "Félicitations ! Votre dossier a été accepté - Bail-Bail",
            text: `Bonjour ${oldApp.candidate.firstName},\n\nExcellente nouvelle ! Votre dossier pour le logement "${oldApp.property.title}" a été accepté par le propriétaire.\nLe propriétaire va prendre contact avec vous très prochainement pour finaliser les démarches.\n\nCordialement,\nL'équipe Bail-Bail.`,
            html: `<b>Bonjour ${oldApp.candidate.firstName},</b><br><br>Excellente nouvelle ! Votre dossier pour le logement <b>${oldApp.property.title}</b> a été <span style="color: green; font-weight: bold;">accepté</span> par le propriétaire.<br><br>Le propriétaire va prendre contact avec vous très prochainement pour finaliser les démarches (signature du bail, état des lieux).<br><br>Cordialement,<br>L'équipe Bail-Bail.`,
          });

          if (!process.env.SMTP_HOST) {
            console.log("================ EMAILS SIMULÉS (DOSSIER ACCEPTÉ) ================");
            console.log("Email envoyé ! Visualisez-le ici : %s", nodemailer.getTestMessageUrl(info));
            console.log("==================================================================");
          }
        } catch (err) {
          console.error("Erreur lors de l'envoi de l'email d'acceptation :", err);
        }
      }

      // Traitement complet si le dossier est REFUSE
      if (status === "REFUSE") {
        const fs = require('fs/promises');
        const path = require('path');
        
        // 1. Purge Physique
        if (oldApp.documents && oldApp.documents.length > 0) {
          for (const doc of oldApp.documents) {
            const safeFilename = `${doc.id}.enc`;
            const filePath = path.join(process.cwd(), "private_uploads", "documents", applicationId, safeFilename);
            try {
              await fs.unlink(filePath);
            } catch (e) {
              console.warn("Fichier physique introuvable, suppression logique continue.");
            }
          }
        }
        
        // 2. Purge Logique
        await prisma.document.deleteMany({
          where: { applicationId }
        });
        
        // 3. Libération de créneau
        if (oldApp.visitSlots && oldApp.visitSlots.length > 0) {
          for (const slot of oldApp.visitSlots) {
            await prisma.visitSlot.update({
              where: { id: slot.id },
              data: {
                status: "AVAILABLE",
                applications: { disconnect: { id: applicationId } }
              }
            });
          }
        }
        
        // 4. Notification Email
        try {
          const nodemailer = require("nodemailer");
          let transporter;

          if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
              },
            });
          } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: { user: testAccount.user, pass: testAccount.pass },
            });
          }

          const fromEmail = process.env.EMAIL_FROM || '"Bail-Bail Admin" <contact@bail-bail.com>';
          const info = await transporter.sendMail({
            from: fromEmail,
            to: oldApp.candidate.email,
            subject: "Mise à jour concernant votre dossier - Bail-Bail",
            text: `Bonjour ${oldApp.candidate.firstName},\n\nNous vous informons que votre dossier pour le logement "${oldApp.property.title}" n'a pas été retenu par le propriétaire.\n\nConformément à nos engagements de confidentialité (RGPD), l'intégralité de vos pièces justificatives a été supprimée de nos serveurs.\n\nNous vous souhaitons une excellente recherche.\nL'équipe Bail-Bail.`,
            html: `<b>Bonjour ${oldApp.candidate.firstName},</b><br><br>Nous vous informons que votre dossier pour le logement <b>${oldApp.property.title}</b> n'a pas été retenu par le propriétaire.<br><br>Conformément à nos engagements de confidentialité et à la réglementation RGPD, <b>l'intégralité de vos pièces justificatives a été définitivement supprimée de nos serveurs</b>.<br><br>Nous vous souhaitons de fructueuses recherches pour votre futur logement.<br><br>Cordialement,<br>L'équipe Bail-Bail.`,
          });

          if (!process.env.SMTP_HOST) {
            console.log("================ EMAILS SIMULÉS (DOSSIER REFUSÉ & PURGÉ) ================");
            console.log("Email envoyé ! Visualisez-le ici : %s", nodemailer.getTestMessageUrl(info));
            console.log("=========================================================================");
          }
        } catch (err) {
          console.error("Erreur lors de l'envoi de l'email de refus :", err);
        }
      }
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
  const session = await requireOwnerSession();
  if (!session) return { error: "Non autorisé" };

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

  if (application.property.ownerId !== session.id || slot.propertyId !== application.propertyId) {
    return { error: "Données introuvables ou non autorisées" };
  }

  // 1. Déconnecter les autres slots de la candidature pour clarifier
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
          disconnect: otherSlots.map((s: { id: string }) => ({ id: s.id }))
        }
      }
    });

    // Mettre à jour le statut de chacun de ces autres créneaux libérés
    for (const os of otherSlots) {
      const count = await prisma.application.count({
        where: { visitSlots: { some: { id: os.id } } }
      });
      await prisma.visitSlot.update({
        where: { id: os.id },
        data: {
          status: count >= os.maxCandidates ? "BOOKED" : "AVAILABLE"
        }
      });
    }
  }

  // 2. Connecter le créneau sélectionné à la candidature
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      visitSlots: {
        connect: { id: slotId }
      }
    }
  });

  // 3. Mettre à jour le statut du créneau choisi
  const connectedAppsCount = await prisma.application.count({
    where: { visitSlots: { some: { id: slotId } } }
  });

  await prisma.visitSlot.update({
    where: { id: slotId },
    data: {
      status: connectedAppsCount >= slot.maxCandidates ? "BOOKED" : "AVAILABLE"
    }
  });

  const formattedDate = format(getParisDate(slot.date), "dd/MM/yyyy 'à' HH:mm", { locale: fr });

  // Logger l'audit
  await prisma.auditLog.create({
    data: {
      applicationId,
      action: "VISITE_VALIDEE",
      details: `Créneau de visite validé pour le ${formattedDate}. Un email a été envoyé au candidat.`
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
      text: `Bonjour ${application.candidate.firstName},\n\nVotre visite pour le logement ${application.property.title} a été confirmée pour le ${formattedDate}.\n\nÀ bientôt !`,
      html: `<b>Bonjour ${application.candidate.firstName},</b><br><br>Votre visite pour le logement ${application.property.title} a été <b>confirmée</b> pour le ${formattedDate}.<br><br>À bientôt !`,
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
  const session = await requireOwnerSession();
  if (!session) return { error: "Non autorisé" };

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
    if (doc.application.property.ownerId !== session.id) {
      return { error: "Document introuvable ou non autorisé" };
    }

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
        let transporter;

        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          });
        } else {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
          });
        }

        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Bail-Bail Admin" <admin@bail-bail.com>',
          to: doc.application.candidate.email,
          subject: "Action requise urgemment : Document refusé - Bail-Bail",
          text: `Bonjour ${doc.application.candidate.firstName},\n\nConcernant votre dossier pour le logement ${doc.application.property.title}, un document (${doc.type}) a été refusé.\n\nMotif : ${rejectionReason || 'Non spécifié'}\n\n⚠️ IMPORTANT : Vous devez vous connecter, modifier ce document et re-confirmer votre intérêt au plus vite. Sans action de votre part, votre place pour le créneau de visite sera libérée pour un autre candidat.\n\nCordialement, l'équipe Bail-Bail.`,
          html: `<b>Bonjour ${doc.application.candidate.firstName},</b><br><br>Concernant votre dossier pour le logement ${doc.application.property.title}, un document (<b>${doc.type}</b>) a été <b>refusé</b>.<br><br><b>Motif du refus :</b> ${rejectionReason || 'Non spécifié'}<br><br><div style="background-color: #FEF2F2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0;"><b>⚠️ IMPORTANT :</b> Vous devez vous connecter à votre espace, supprimer le document refusé et en fournir un nouveau au plus vite pour re-confirmer votre intérêt.<br><br>Sans action rapide de votre part, <b>votre créneau de visite sera libéré</b> au profit d'un autre candidat.</div><br>Cordialement, l'équipe Bail-Bail.`,
        });

        if (!process.env.SMTP_HOST) {
          console.log("================ EMAILS SIMULÉS (REFUS DOCUMENT) ==================");
          console.log("Email envoyé ! Visualisez-le ici : %s", nodemailer.getTestMessageUrl(info));
          console.log("===================================================================");
        }
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

export async function modifyVisitSlotAction(
  applicationId: string,
  slotId: string,
  type: "PROPOSE" | "IMPOSE",
  message: string
) {
  const session = await requireOwnerSession();
  if (!session) return { error: "Non autorisé" };

  if (!applicationId || !slotId) {
    return { error: "Paramètres manquants" };
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        property: true,
        visitSlots: true,
      }
    });

    const newSlot = await prisma.visitSlot.findUnique({
      where: { id: slotId }
    });

    if (!application || !newSlot) {
      return { error: "Candidature ou créneau introuvable" };
    }

    if (application.property.ownerId !== session.id || newSlot.propertyId !== application.propertyId) {
      return { error: "Non autorisé" };
    }

    const newSlotDateStr = format(getParisDate(newSlot.date), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bail-bail.com";
    const appUrlClean = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;

    let emailSubject = "";
    let emailText = "";
    let emailHtml = "";

    if (type === "IMPOSE") {
      // 1. Déconnecter les créneaux existants de la candidature
      const currentSlots = application.visitSlots;
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          visitSlots: {
            disconnect: currentSlots.map(s => ({ id: s.id }))
          }
        }
      });

      // 2. Mettre à jour le statut des anciens créneaux libérés
      for (const slot of currentSlots) {
        const count = await prisma.application.count({
          where: { visitSlots: { some: { id: slot.id } } }
        });
        await prisma.visitSlot.update({
          where: { id: slot.id },
          data: {
            status: count >= slot.maxCandidates ? "BOOKED" : "AVAILABLE"
          }
        });
      }

      // 3. Connecter le nouveau créneau
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          visitSlots: {
            connect: { id: slotId }
          }
        }
      });

      // 4. Mettre à jour le statut du nouveau créneau
      const newSlotCount = await prisma.application.count({
        where: { visitSlots: { some: { id: slotId } } }
      });
      await prisma.visitSlot.update({
        where: { id: slotId },
        data: {
          status: newSlotCount >= newSlot.maxCandidates ? "BOOKED" : "AVAILABLE"
        }
      });

      // 5. Nettoyer les propositions pendantes
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          proposedSlotId: null,
          proposalMessage: null,
          proposalStatus: null
        }
      });

      // 6. Logger l'audit
      await prisma.auditLog.create({
        data: {
          applicationId,
          action: "VISITE_MODIFIEE_IMPOSEE",
          details: `Créneau de visite modifié et imposé par le propriétaire pour le ${newSlotDateStr}.${message ? ` Message : "${message}"` : ""}`
        }
      });

      emailSubject = "Modification de votre créneau de visite - Bail-Bail";
      emailText = `Bonjour ${application.candidate.firstName},\n\nLe propriétaire a modifié votre créneau de visite pour le logement "${application.property.title}".\n\nNouveau créneau confirmé : Le ${newSlotDateStr}.\n${message ? `\nMessage du propriétaire : "${message}"` : ""}\n\nCordialement,\nL'équipe Bail-Bail.`;
      emailHtml = `<b>Bonjour ${application.candidate.firstName},</b><br><br>Le propriétaire a <b>modifié votre créneau de visite</b> pour le logement <b>${application.property.title}</b>.<br><br><b>Nouveau créneau confirmé :</b> Le ${newSlotDateStr}.<br>${message ? `<br><b>Message du propriétaire :</b><br><div style="background: #f8fafc; border-left: 4px solid #1463FF; padding: 15px; margin: 15px 0; border-radius: 8px; font-style: italic;">"${message}"</div>` : ""}<br>Cordialement,<br>L'équipe Bail-Bail.`;

    } else {
      // PROPOSE
      // 1. Enregistrer la proposition
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          proposedSlotId: slotId,
          proposalMessage: message.trim() || null,
          proposalStatus: "PENDING"
        }
      });

      // 2. Logger l'audit
      await prisma.auditLog.create({
        data: {
          applicationId,
          action: "VISITE_PROPOSEE",
          details: `Proposition d'un nouveau créneau de visite pour le ${newSlotDateStr}.${message ? ` Message : "${message}"` : ""}`
        }
      });

      emailSubject = "Proposition d'un nouveau créneau de visite - Bail-Bail";
      emailText = `Bonjour ${application.candidate.firstName},\n\nLe propriétaire du logement "${application.property.title}" vous propose un autre créneau de visite : le ${newSlotDateStr}.\n${message ? `\nMessage : "${message}"` : ""}\n\nVous pouvez accepter ou refuser ce créneau depuis votre espace personnel : ${appUrlClean}/dossier/${applicationId}\n\nCordialement,\nL'équipe Bail-Bail.`;
      emailHtml = `<b>Bonjour ${application.candidate.firstName},</b><br><br>Le propriétaire du logement <b>${application.property.title}</b> vous propose un <b>autre créneau de visite</b> : le ${newSlotDateStr}.<br>${message ? `<br><b>Message du propriétaire :</b><br><div style="background: #f8fafc; border-left: 4px solid #1463FF; padding: 15px; margin: 15px 0; border-radius: 8px; font-style: italic;">"${message}"</div>` : ""}<br><div style="text-align: center; margin: 30px 0;"><a href="${appUrlClean}/dossier/${applicationId}" style="padding: 12px 24px; background: #1463FF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accepter ou Refuser la proposition</a></div><br>Cordialement,<br>L'équipe Bail-Bail.`;
    }

    // Envoi de l'email
    try {
      const nodemailer = require("nodemailer");
      let transporter;

      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      }

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Bail-Bail Admin" <admin@bail-bail.com>',
        to: application.candidate.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      if (!process.env.SMTP_HOST) {
        console.log(`================ EMAILS SIMULÉS (${type}) ==================`);
        console.log("Email envoyé ! Visualisez-le ici : %s", nodemailer.getTestMessageUrl(info));
        console.log("===================================================================");
      }
    } catch (err) {
      console.error("Erreur d'envoi d'email pour changement de créneau :", err);
    }

    revalidatePath(`/admin/dossiers/${applicationId}`);
    revalidatePath(`/dossier/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error("Error modifyVisitSlotAction:", error);
    return { error: "Erreur lors de la modification du créneau" };
  }
}
