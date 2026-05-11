"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { addDays } from "date-fns";

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
