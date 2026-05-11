"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAsAction(id: string, name: string, role: "OWNER" | "CANDIDATE") {
  const cookieStore = await cookies();
  cookieStore.set("bail_bail_session", JSON.stringify({ id, name, role }), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  if (role === "OWNER") {
    redirect("/admin");
  } else {
    // Si c'est un candidat, on va essayer de trouver sa candidature
    const app = await prisma.application.findFirst({
      where: { candidateId: id }
    });
    if (app) {
      redirect(`/dossier/${app.id}`);
    } else {
      redirect("/");
    }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("bail_bail_session");
  redirect("/");
}

export async function seedTestDataAction() {
  // Création de 2 propriétaires de test
  const ownerA = await prisma.user.create({
    data: {
      name: "Propriétaire A (Dupont)",
      email: "proprietaire.a@bail-bail.com",
      role: "OWNER"
    }
  });

  const ownerB = await prisma.user.create({
    data: {
      name: "Propriétaire B (Martin)",
      email: "proprietaire.b@bail-bail.com",
      role: "OWNER"
    }
  });

  // Assignation des logements existants au propriétaire A
  await prisma.property.updateMany({
    data: { ownerId: ownerA.id }
  });

  // Création d'un logement pour B pour tester
  await prisma.property.create({
    data: {
      code: "BB-TEST-B",
      title: "Appartement Test Propriétaire B",
      shortAddress: "Paris 11ème",
      rent: 1200,
      surface: 50,
      description: "Appartement de test pour simuler la vue du propriétaire B",
      status: "AVAILABLE",
      ownerId: ownerB.id
    }
  });

  // Création de 2 candidats de test (S'ils n'existent pas)
  await prisma.candidate.create({
    data: {
      firstName: "Candidat",
      lastName: "Test 1",
      email: "candidat1@test.com",
      phone: "0600000001"
    }
  });

  await prisma.candidate.create({
    data: {
      firstName: "Candidat",
      lastName: "Test 2",
      email: "candidat2@test.com",
      phone: "0600000002"
    }
  });

  revalidatePath("/");
  return { success: true };
}
