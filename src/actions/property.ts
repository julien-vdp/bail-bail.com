"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSimulatedUser } from "@/lib/auth";

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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const code = "BB-" + generatePropertyCode();
  const user = await getSimulatedUser();

  try {
    const property = await prisma.property.create({
      data: {
        ...parsed.data,
        code,
        ownerId: user?.id,
      }
    });

    // Optionnel: ajouter des images sélectionnées lors de la création s'il y en a (ici on gère la création simple)
    redirect(`/admin/logements/${property.id}/edit`);
  } catch (error) {
    return { error: "Erreur lors de la création de l'annonce" };
  }
}

export async function updatePropertyAction(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  if (!propertyId) return { error: "ID du logement manquant" };

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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
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
  try {
    // Soft delete en passant le statut à ARCHIVED ou delete réel
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: "ARCHIVED" }
    });
    revalidatePath(`/admin/logements`);
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de l'archivage" };
  }
}
