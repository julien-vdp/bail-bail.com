"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { addDays } from "date-fns";
import { verifySession } from "@/lib/auth";
import sharp from "sharp";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const UploadSchema = z.object({
  applicationId: z.string(),
  type: z.enum(["ID_CARD", "INCOME", "EMPLOYMENT", "TAX", "RESIDENCE", "GUARANTOR"]),
  file: z.any()
    .refine((file) => file instanceof File, "Fichier manquant")
    .refine((file) => file.size <= MAX_FILE_SIZE, "Le fichier ne doit pas dépasser 10 Mo.")
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), "Seuls les PDF, JPG et PNG sont acceptés."),
});

export async function uploadDocumentAction(prevState: any, formData: FormData) {
  const parsed = UploadSchema.safeParse({
    applicationId: formData.get("applicationId"),
    type: formData.get("type"),
    file: formData.get("file"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { applicationId, type, file } = parsed.data;

  // Vérifier si le dossier existe
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return { error: "Dossier introuvable." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Créer le dossier public/uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), "public", "uploads", applicationId);
    await fs.mkdir(uploadDir, { recursive: true });

    const safeFilename = `${type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeFilename);
    const dbFilePath = `/uploads/${applicationId}/${safeFilename}`;

    await fs.writeFile(filePath, buffer);

    // Enregistrer en base
    await prisma.document.create({
      data: {
        applicationId,
        type,
        filePath: dbFilePath,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        expiresAt: addDays(new Date(), 30), // Simulation d'expiration
      },
    });

    await prisma.auditLog.create({
      data: {
        applicationId,
        action: "DOCUMENT_UPLOAD",
        details: `Document ${type} ajouté : ${file.name}`
      }
    });

    // Mettre à jour le statut du dossier en INCOMPLET ou EN_COURS selon l'avancement
    if (application.status === "NOUVEAU") {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "INCOMPLET" }
      });
    }

    revalidatePath(`/dossier/${applicationId}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'upload", error);
    return { error: "Une erreur est survenue lors de l'enregistrement du fichier." };
  }
}

// --- NOUVELLES ACTIONS POUR LES IMAGES D'ANNONCES ---

export async function uploadPropertyImageAction(propertyId: string, formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "OWNER") {
    return { error: "Non autorisé" };
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });

  if (!property || property.ownerId !== session.id) {
    return { error: "Propriété introuvable ou vous n'êtes pas le propriétaire" };
  }

  const files = formData.getAll("images") as File[];
  if (!files || files.length === 0) {
    return { error: "Aucun fichier fourni" };
  }

  try {
    const uploadDir = path.join(process.cwd(), "private_uploads", "properties");
    await fs.mkdir(uploadDir, { recursive: true });

    // Load watermark if exists
    let watermarkBuffer: Buffer | null = null;
    try {
      // Trying the icon.png which we created earlier
      const iconPath = path.join(process.cwd(), "src", "app", "icon.png");
      watermarkBuffer = await sharp(iconPath)
        .resize({ width: 120 })
        .ensureAlpha(0.8)
        .toBuffer();
    } catch (e) {
      try {
        const logoPath = path.join(process.cwd(), "public", "logo.png");
        watermarkBuffer = await sharp(logoPath)
          .resize({ width: 120 })
          .ensureAlpha(0.8)
          .toBuffer();
      } catch (e2) {
        console.warn("No logo found for watermark");
      }
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.size === 0 || !file.type.startsWith("image/")) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${crypto.randomUUID()}.jpg`;
      const filepath = path.join(uploadDir, filename);

      let image = sharp(buffer)
        .resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 });

      if (watermarkBuffer) {
        image = image.composite([
          {
            input: watermarkBuffer,
            gravity: "southwest",
          }
        ]);
      }

      await image.toFile(filepath);

      const imageUrl = `/api/images/property/${filename}`;
      await prisma.propertyImage.create({
        data: {
          propertyId,
          url: imageUrl
        }
      });

      uploadedUrls.push(imageUrl);
    }

    revalidatePath(`/admin/logements/${propertyId}/edit`);
    return { success: true, urls: uploadedUrls };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Erreur lors du traitement de l'image" };
  }
}

export async function deletePropertyImageAction(imageUrl: string) {
  const session = await verifySession();
  if (!session || session.role !== "OWNER") {
    return { error: "Non autorisé" };
  }

  try {
    const imageRecord = await prisma.propertyImage.findFirst({
      where: { url: imageUrl },
      include: { property: true }
    });

    if (!imageRecord || imageRecord.property.ownerId !== session.id) {
      return { error: "Image introuvable ou non autorisé" };
    }

    const filename = imageUrl.split("/").pop();
    if (filename) {
      const filepath = path.join(process.cwd(), "private_uploads", "properties", filename);
      try {
        await fs.unlink(filepath);
      } catch (e) {
        console.warn("Fichier introuvable sur le disque", filepath);
      }
    }

    await prisma.propertyImage.delete({
      where: { id: imageRecord.id }
    });

    revalidatePath(`/admin/logements/${imageRecord.propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Delete image error:", error);
    return { error: "Erreur lors de la suppression de l'image" };
  }
}
