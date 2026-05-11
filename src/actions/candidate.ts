"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Téléphone invalide"),
  slotIds: z.array(z.string()).min(1, "Veuillez sélectionner au moins un créneau"),
});

export async function submitApplicationAction(prevState: any, formData: FormData) {
  const slotIds = formData.getAll("slotIds") as string[];
  
  const parsed = SubmitApplicationSchema.safeParse({
    propertyId: formData.get("propertyId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    slotIds: slotIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Créer ou mettre à jour le candidat
  const candidate = await prisma.candidate.upsert({
    where: { email: data.email },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
    create: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    },
  });

  // Vérifier si une candidature existe déjà pour ce logement
  const existingApp = await prisma.application.findFirst({
    where: {
      propertyId: data.propertyId,
      candidateId: candidate.id,
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
        candidateId: candidate.id,
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

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "EN_COURS" }
  });

  await prisma.auditLog.create({
    data: {
      applicationId,
      action: "SOUMISSION_DOSSIER",
      details: "Dossier validé et soumis pour étude par le candidat."
    }
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
