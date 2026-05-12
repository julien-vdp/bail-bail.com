"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function generateVisitSlotsAction(
  propertyId: string, 
  dateStr: string, 
  startTime: string, 
  endTime: string, 
  duration: number,
  maxCandidates: number
) {
  const session = await verifySession();
  if (!session || session.role !== "OWNER") {
    return { error: "Non autorisé" };
  }

  // Vérifier la propriété
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });

  if (!property || property.ownerId !== session.id) {
    return { error: "Propriété introuvable ou vous n'êtes pas le propriétaire" };
  }

  if (maxCandidates < 1) {
    return { error: "Le nombre maximum de candidats doit être d'au moins 1" };
  }

  try {
    // Parsing times
    // dateStr is 'YYYY-MM-DD'
    // startTime is 'HH:MM'
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startDateTime = new Date(`${dateStr}T${startTime}:00`);
    const endDateTime = new Date(`${dateStr}T${endTime}:00`);

    if (startDateTime >= endDateTime) {
      return { error: "L'heure de fin doit être postérieure à l'heure de début" };
    }

    const slotsToCreate = [];
    let current = new Date(startDateTime);

    // Boucle de découpage
    while (current < endDateTime) {
      // Check if slot exceeds end time
      const nextTime = new Date(current.getTime() + duration * 60000);
      if (nextTime > endDateTime) {
        break; // Ignore le dernier bout s'il ne rentre pas
      }

      slotsToCreate.push({
        propertyId,
        date: new Date(current),
        duration,
        maxCandidates,
        status: "AVAILABLE"
      });

      current = nextTime;
    }

    if (slotsToCreate.length === 0) {
      return { error: "La plage horaire est trop courte pour créer au moins un créneau" };
    }

    await prisma.visitSlot.createMany({
      data: slotsToCreate
    });

    revalidatePath(`/admin/logements/${propertyId}/edit`);
    return { success: true, count: slotsToCreate.length };

  } catch (error) {
    console.error("Erreur génération slots", error);
    return { error: "Erreur lors de la génération des créneaux" };
  }
}

export async function deleteVisitSlotAction(slotId: string) {
  const session = await verifySession();
  if (!session || session.role !== "OWNER") {
    return { error: "Non autorisé" };
  }

  try {
    const slot = await prisma.visitSlot.findUnique({
      where: { id: slotId },
      include: { property: true, applications: true }
    });

    if (!slot || slot.property.ownerId !== session.id) {
      return { error: "Créneau introuvable ou non autorisé" };
    }

    // Optionally check if applications are attached.
    // If it's already booked by someone, maybe prevent deletion?
    if (slot.applications.length > 0) {
      return { error: "Impossible de supprimer un créneau avec des candidats inscrits." };
    }

    await prisma.visitSlot.delete({
      where: { id: slotId }
    });

    revalidatePath(`/admin/logements/${slot.propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Delete slot error:", error);
    return { error: "Erreur lors de la suppression du créneau" };
  }
}
