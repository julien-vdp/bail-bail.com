"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const COOKIE_NAME = "db_explorer_auth";

async function isAuthorizedAdmin() {
  const session = await verifySession();
  return session?.email === "julien.favaux@gmail.com" || session?.originalEmail === "julien.favaux@gmail.com";
}

export async function loginToDbExplorer(password: string) {
  if (!(await isAuthorizedAdmin())) {
    return { error: "Non autorisé" };
  }

  const configuredPassword = process.env.DB_EXPLORER_PASSWORD;
  if (!configuredPassword) {
    console.error("DB_EXPLORER_PASSWORD is not configured");
    return { error: "Le DB Explorer n'est pas configuré." };
  }

  if (password === configuredPassword) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
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
  if (!(await isAuthorizedAdmin())) {
    return false;
  }
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
    application: prisma.application,
    auditLog: prisma.auditLog,
    propertyImage: prisma.propertyImage,
  };
  return models[modelName];
}

export async function getDatabaseMetrics() {
  try {
    const isAuth = await checkDbAuth();
    if (!isAuth) return { error: "Unauthorized" };

    const [
      totalProperties,
      activeProperties,
      totalCandidates,
      totalApplications,
      totalVisits,
      applicationsByStatus
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: "AVAILABLE" } }),
      prisma.candidate.count(),
      prisma.application.count(),
      prisma.visitSlot.count(),
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    return {
      data: {
        properties: { total: totalProperties, active: activeProperties },
        candidates: totalCandidates,
        applications: { total: totalApplications, byStatus: applicationsByStatus },
        visits: totalVisits
      }
    };
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return { error: "Erreur lors de la récupération des métriques" };
  }
}

export async function getTableData(modelName: string, filter?: { field: string, value: string }) {
  try {
    const isAuth = await checkDbAuth();
    if (!isAuth) return { error: "Unauthorized" };

    const model = getPrismaModel(modelName);
    if (!model) return { error: "Model not found" };

    let include = undefined;

    // Define smart includes to replace foreign keys with real visual objects
    if (modelName === "property") {
      include = { owner: { select: { id: true, name: true, email: true } } };
    } else if (modelName === "application") {
      include = {
        property: { select: { id: true, title: true } },
        candidate: { select: { id: true, firstName: true, lastName: true } },
      };
    } else if (modelName === "visitSlot") {
      include = { property: { select: { id: true, title: true } } };
    } else if (modelName === "document") {
      include = {
        application: { 
          select: { 
            id: true, 
            candidate: { select: { firstName: true, lastName: true } },
            property: { select: { title: true } }
          } 
        }
      };
    }

    const where = filter && filter.field && filter.value 
      ? { [filter.field]: filter.value } 
      : {};

    const data = await model.findMany({
      where,
      take: 100, // Limit to 100 to avoid huge payloads
      orderBy: { createdAt: 'desc' },
      include
    });
    return { data };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { error: "Erreur lors de la récupération des données" };
  }
}

export async function deleteRecord(modelName: string, id: string) {
  try {
    const isAuth = await checkDbAuth();
    if (!isAuth) return { error: "Unauthorized" };

    const model = getPrismaModel(modelName);
    if (!model) return { error: "Model not found" };

    await model.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting record:", error);
    return { error: "Impossible de supprimer l'enregistrement" };
  }
}

export async function updateRecord(modelName: string, id: string, data: any) {
  try {
    const isAuth = await checkDbAuth();
    if (!isAuth) return { error: "Unauthorized" };

    const model = getPrismaModel(modelName);
    if (!model) return { error: "Model not found" };

    // Filter out non-updatable fields
    const { id: _, createdAt, updatedAt, ...updateData } = data;

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
