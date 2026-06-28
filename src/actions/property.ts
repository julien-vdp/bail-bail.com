"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { getPrivateUploadsRoot } from "@/lib/storage";

const PropertySchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères"),
  shortAddress: z.string().min(5, "L'adresse courte est requise"),
  rent: z.coerce.number().min(1, "Le loyer doit être supérieur à 0"),
  surface: z.coerce.number().min(1, "La surface doit être supérieure à 0"),
  description: z.string().optional(),
  status: z.enum(["AVAILABLE", "RENTED", "DRAFT", "ARCHIVED"]).default("AVAILABLE"),
  isEligibleGLI: z.boolean().default(false),
  minSalaryRequired: z.coerce.number().optional().nullable(),
  studentPolicy: z.enum(["ACCEPTED", "REFUSED", "ONLY_STUDENTS"]).default("ACCEPTED"),
  
  hasGli: z.boolean().default(false),
  gliMonthlyIncomeThreshold: z.coerce.number().optional().nullable(),
  acceptsGuarantor: z.boolean().default(true),
  acceptsStudent: z.boolean().default(true),
  requiresTaxNotice: z.boolean().default(true),
  requiresCurrentAddressProof: z.boolean().default(true),
  requiresEmploymentProof: z.boolean().default(true),
  requiresIncomeProof: z.boolean().default(true),
  customInstructions: z.string().optional().nullable(),

  // Nouveaux paramètres moteur conditionnel GLI
  rentWithCharges: z.coerce.number().default(0),
  gliMode: z.enum(["NONE", "INDICATIVE", "STRICT"]).default("NONE"),
  acceptsStudents: z.boolean().default(true),
  acceptsGuarantors: z.boolean().default(true),
  acceptsColocation: z.boolean().default(false),
  acceptsUnstableProfiles: z.boolean().default(false),
  tenantAlreadyInPlaceStatus: z.enum(["NEW_TENANT", "IN_PLACE_LESS_THAN_6_MONTHS", "IN_PLACE_MORE_THAN_6_MONTHS"]).default("NEW_TENANT"),
  customDocumentInstructions: z.string().optional().nullable(),
});

function generatePropertyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createPropertyAction(prevState: any, formData: FormData) {
  const parsed = PropertySchema.safeParse({
    title: formData.get("title"),
    shortAddress: formData.get("shortAddress"),
    rent: formData.get("rent"),
    surface: formData.get("surface"),
    description: formData.get("description"),
    status: formData.get("status") || "DRAFT",
    isEligibleGLI: formData.get("isEligibleGLI") === "on" || formData.get("isEligibleGLI") === "true",
    minSalaryRequired: formData.get("minSalaryRequired") ? formData.get("minSalaryRequired") : null,
    studentPolicy: formData.get("studentPolicy") || "ACCEPTED",
    
    hasGli: formData.get("isEligibleGLI") === "on" || formData.get("isEligibleGLI") === "true",
    gliMonthlyIncomeThreshold: formData.get("minSalaryRequired") ? Number(formData.get("minSalaryRequired")) : null,
    acceptsGuarantor: true,
    acceptsStudent: formData.get("studentPolicy") !== "REFUSED",
    requiresTaxNotice: true,
    requiresCurrentAddressProof: true,
    requiresEmploymentProof: true,
    requiresIncomeProof: true,
    customInstructions: null,

    // Moteur conditionnel
    rentWithCharges: formData.get("rent") ? Number(formData.get("rent")) : 0,
    gliMode: (formData.get("isEligibleGLI") === "on" || formData.get("isEligibleGLI") === "true") ? "STRICT" : "NONE",
    acceptsStudents: formData.get("studentPolicy") !== "REFUSED",
    acceptsGuarantors: true,
    acceptsColocation: false,
    acceptsUnstableProfiles: false,
    tenantAlreadyInPlaceStatus: "NEW_TENANT",
    customDocumentInstructions: null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const code = "BB-" + generatePropertyCode();
  const user = await verifySession();
  if (!user || user.role !== "OWNER") {
    return { error: "Non autorisé" };
  }

  let propertyId: string;
  try {
    const property = await prisma.property.create({
      data: {
        ...parsed.data,
        code,
        ownerId: user?.id,
      }
    });
    propertyId = property.id;
  } catch (error) {
    console.error("[createPropertyAction Error]:", error);
    return { error: "Erreur lors de la création de l'annonce" };
  }

  redirect(`/admin/logements/${propertyId}/edit`);
}

export async function updatePropertyAction(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  if (!propertyId) return { error: "ID du logement manquant" };

  const user = await verifySession();
  if (!user || user.role !== "OWNER") {
    return { error: "Non autorisé" };
  }

  const parsed = PropertySchema.safeParse({
    title: formData.get("title"),
    shortAddress: formData.get("shortAddress"),
    rent: formData.get("rent"),
    surface: formData.get("surface"),
    description: formData.get("description"),
    status: formData.get("status"),
    isEligibleGLI: formData.get("isEligibleGLI") === "on" || formData.get("isEligibleGLI") === "true",
    minSalaryRequired: formData.get("minSalaryRequired") ? formData.get("minSalaryRequired") : null,
    studentPolicy: formData.get("studentPolicy") || "ACCEPTED",
    
    hasGli: formData.get("hasGli") === "on" || formData.get("hasGli") === "true" || formData.get("gliMode") === "STRICT" || formData.get("gliMode") === "INDICATIVE",
    gliMonthlyIncomeThreshold: formData.get("gliMonthlyIncomeThreshold") ? formData.get("gliMonthlyIncomeThreshold") : null,
    acceptsGuarantor: formData.get("acceptsGuarantor") === "on" || formData.get("acceptsGuarantor") === "true",
    acceptsStudent: formData.get("acceptsStudent") === "on" || formData.get("acceptsStudent") === "true",
    requiresTaxNotice: formData.get("requiresTaxNotice") === "on" || formData.get("requiresTaxNotice") === "true",
    requiresCurrentAddressProof: formData.get("requiresCurrentAddressProof") === "on" || formData.get("requiresCurrentAddressProof") === "true",
    requiresEmploymentProof: formData.get("requiresEmploymentProof") === "on" || formData.get("requiresEmploymentProof") === "true",
    requiresIncomeProof: formData.get("requiresIncomeProof") === "on" || formData.get("requiresIncomeProof") === "true",
    customInstructions: formData.get("customInstructions") || null,

    // Moteur conditionnel
    rentWithCharges: formData.get("rentWithCharges") ? Number(formData.get("rentWithCharges")) : Number(formData.get("rent") || 0),
    gliMode: formData.get("gliMode") || "NONE",
    acceptsStudents: formData.get("acceptsStudents") === "on" || formData.get("acceptsStudents") === "true",
    acceptsGuarantors: formData.get("acceptsGuarantors") === "on" || formData.get("acceptsGuarantors") === "true",
    acceptsColocation: formData.get("acceptsColocation") === "on" || formData.get("acceptsColocation") === "true",
    acceptsUnstableProfiles: formData.get("acceptsUnstableProfiles") === "on" || formData.get("acceptsUnstableProfiles") === "true",
    tenantAlreadyInPlaceStatus: formData.get("tenantAlreadyInPlaceStatus") || "NEW_TENANT",
    customDocumentInstructions: formData.get("customDocumentInstructions") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.ownerId !== user.id) {
      return { error: "Logement introuvable ou non autorisé" };
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: parsed.data,
    });

    // Mettre à jour les images
    const selectedImages = formData.getAll("images") as string[];
    
    // Effacer uniquement les images de la banque (qui ne commencent pas par /api/images/)
    await prisma.propertyImage.deleteMany({
      where: { 
        propertyId,
        NOT: { url: { startsWith: "/api/images/" } }
      }
    });
    
    // Rajouter les images de la banque sélectionnées
    const bankImagesToKeep = selectedImages.filter(url => !url.startsWith("/api/images/"));
    if (bankImagesToKeep.length > 0) {
      await prisma.propertyImage.createMany({
        data: bankImagesToKeep.map(url => ({
          propertyId,
          url
        }))
      });
    }

    revalidatePath(`/admin/logements`);
    revalidatePath(`/admin/logements/${propertyId}`);
    revalidatePath(`/admin/logements/${propertyId}/edit`);
    
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la mise à jour de l'annonce" };
  }
}

export async function deletePropertyAction(propertyId: string) {
  const user = await verifySession();
  if (!user || user.role !== "OWNER") {
    return { error: "Non autorisé" };
  }

  try {
    // Récupérer le logement avec ses images, ses candidatures et leurs documents et candidats
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: true,
        applications: {
          include: {
            documents: true,
            candidate: true,
          }
        }
      }
    });

    if (!property || property.ownerId !== user.id) {
      return { error: "Logement introuvable ou non autorisé" };
    }

    // 1. Purger physiquement les documents de toutes les candidatures sur le disque
    for (const app of property.applications) {
      // Supprimer les fichiers physiques cryptés (.enc)
      for (const doc of app.documents) {
        const safeFilename = `${doc.id}.enc`;
        const filePath = path.join(getPrivateUploadsRoot(), "documents", app.id, safeFilename);
        try {
          await fs.unlink(filePath);
        } catch (e) {
          console.warn(`Fichier physique non trouvé pour le document ${doc.id}`);
        }
      }
      // Supprimer le répertoire de la candidature
      const appDir = path.join(getPrivateUploadsRoot(), "documents", app.id);
      try {
        await fs.rm(appDir, { recursive: true, force: true });
      } catch (e) {
        console.warn(`Répertoire de candidature non supprimé : ${appDir}`);
      }

      // 2. Envoyer un e-mail aux candidats n'ayant pas le statut "ACCEPTE" (les non validés)
      if (app.status !== "ACCEPTE" && app.candidate.email) {
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
          const emailHtml = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 40px; margin-bottom: 40px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0f172a; margin-top: 20px; font-size: 24px;">Annonce supprimée</h1>
    </div>
    <div style="color: #334155; font-size: 16px; line-height: 1.6;">
      <p>Bonjour <strong>${app.candidate.firstName}</strong>,</p>
      <p>Nous vous informons que le propriétaire a supprimé l'annonce pour le logement <strong>${property.title}</strong>.</p>
      <p>En conséquence, votre candidature pour ce logement a été annulée. Conformément à la réglementation RGPD et à nos engagements de confidentialité, l'intégralité de vos pièces justificatives et documents déposés a été <strong>définitivement supprimée de nos serveurs</strong>.</p>
      <p>Nous vous souhaitons une excellente continuation dans vos recherches.</p>
    </div>
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 14px;">Bail-Bail - La location simplifiée</p>
    </div>
  </div>
</body>
</html>
          `;

          const info = await transporter.sendMail({
            from: fromEmail,
            to: app.candidate.email,
            subject: `Suppression de l'annonce : ${property.title} - Bail-Bail`,
            html: emailHtml,
          });

          if (!process.env.SMTP_HOST) {
            console.log("================ EMAILS SIMULÉS (LOGEMENT SUPPRIMÉ) ================");
            console.log("Email envoyé à %s ! Visualisez-le ici : %s", app.candidate.email, nodemailer.getTestMessageUrl(info));
            console.log("====================================================================");
          }
        } catch (err) {
          console.error(`Erreur d'envoi d'e-mail pour la candidature ${app.id}:`, err);
        }
      }
    }

    // 3. Purger physiquement les images du logement sur le disque
    for (const image of property.images) {
      if (image.url.startsWith("/api/images/property/")) {
        const filename = image.url.split("/").pop();
        if (filename) {
          const filepath = path.join(getPrivateUploadsRoot(), "properties", filename);
          try {
            await fs.unlink(filepath);
          } catch (e) {
            console.warn(`Fichier image non trouvé sur le disque : ${filepath}`);
          }
        }
      }
    }

    // 4. Supprimer l'annonce en base de données.
    // Les cascades onDelete configurées au niveau du schéma Prisma supprimeront automatiquement
    // les enregistrements correspondants dans PropertyImage, VisitSlot, Application, Document, etc.
    await prisma.property.delete({
      where: { id: propertyId }
    });

    revalidatePath(`/admin/logements`);
    return { success: true };
  } catch (error) {
    console.error("[deletePropertyAction Error]:", error);
    return { error: "Erreur lors de la suppression de l'annonce" };
  }
}
