"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const PASSWORD = "julien-admin";
const COOKIE_NAME = "db_explorer_auth";

export async function loginToDbExplorer(password: string) {
  if (password === PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "true", { 
      httpOnly: true, 
      path: "/",
      maxAge: 60 * 60 * 24 // 24 hours
    });
    return { success: true };
  }
  return { error: "Mot de passe incorrect" };
}

export async function logoutFromDbExplorer() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true };
}

export async function checkDbAuth() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "true";
}

// Map the string model name to the actual prisma delegate
// We cast it to any because Prisma's dynamic model access is complex to type safely in TS
function getPrismaModel(modelName: string): any {
  const models: Record<string, any> = {
    user: prisma.user,
    property: prisma.property,
    candidate: prisma.candidate,
    visitSlot: prisma.visitSlot,
    document: prisma.document,
  };
  return models[modelName.toLowerCase()];
}

export async function getTableData(modelName: string) {
  const isAuth = await checkDbAuth();
  if (!isAuth) throw new Error("Unauthorized");

  const model = getPrismaModel(modelName);
  if (!model) throw new Error("Model not found");

  try {
    const data = await model.findMany({
      take: 100, // Limit to 100 to avoid huge payloads
      orderBy: { createdAt: 'desc' }
    });
    return { data };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { error: "Erreur lors de la récupération des données" };
  }
}

export async function deleteRecord(modelName: string, id: string) {
  const isAuth = await checkDbAuth();
  if (!isAuth) throw new Error("Unauthorized");

  const model = getPrismaModel(modelName);
  if (!model) throw new Error("Model not found");

  try {
    await model.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting record:", error);
    return { error: "Impossible de supprimer l'enregistrement" };
  }
}

export async function updateRecord(modelName: string, id: string, data: any) {
  const isAuth = await checkDbAuth();
  if (!isAuth) throw new Error("Unauthorized");

  const model = getPrismaModel(modelName);
  if (!model) throw new Error("Model not found");

  // Filter out non-updatable fields or parse JSON
  // For a generic explorer, we just try to update whatever is passed
  // We remove 'id', 'createdAt', 'updatedAt' from the update payload to be safe
  const { id: _, createdAt, updatedAt, ...updateData } = data;

  try {
    const result = await model.update({
      where: { id },
      data: updateData
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating record:", error);
    return { error: "Erreur lors de la mise à jour" };
  }
}
