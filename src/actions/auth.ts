"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, verifySession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- VRAI SYSTEME D'AUTHENTIFICATION ---

export async function register(formData: FormData, role: "OWNER" | "CANDIDATE") {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) return { error: "Email et mot de passe requis." };

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    if (role === "OWNER") {
      const name = formData.get("name") as string;
      if (!name) return { error: "Nom requis." };

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return { error: "Cet email est déjà utilisé par un propriétaire." };

      const user = await prisma.user.create({
        data: { email, name, passwordHash, role: "OWNER" },
      });
      await createSession({ id: user.id, email: user.email, name: user.name, role: "OWNER" });

    } else {
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;
      const phone = formData.get("phone") as string;
      if (!firstName || !lastName || !phone) return { error: "Tous les champs sont requis." };

      const existing = await prisma.candidate.findUnique({ where: { email } });
      if (existing) return { error: "Cet email est déjà utilisé par un locataire." };

      const candidate = await prisma.candidate.create({
        data: { email, firstName, lastName, phone, passwordHash },
      });

      await createSession({ id: candidate.id, email: candidate.email, name: `${candidate.firstName} ${candidate.lastName}`, role: "CANDIDATE" });
    }

    return { success: true };
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Une erreur est survenue lors de l'inscription." };
  }
}

export async function login(formData: FormData, role: "OWNER" | "CANDIDATE") {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email et mot de passe requis." };

  try {
    if (role === "OWNER") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return { error: "Identifiants incorrects ou compte non initialisé avec un mot de passe." };

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return { error: "Identifiants incorrects." };

      await createSession({ id: user.id, email: user.email, name: user.name, role: "OWNER" });
    } else {
      const candidate = await prisma.candidate.findUnique({ where: { email } });
      if (!candidate || !candidate.passwordHash) return { error: "Identifiants incorrects ou compte non initialisé avec un mot de passe." };

      const isValid = await bcrypt.compare(password, candidate.passwordHash);
      if (!isValid) return { error: "Identifiants incorrects." };

      await createSession({ id: candidate.id, email: candidate.email, name: `${candidate.firstName} ${candidate.lastName}`, role: "CANDIDATE" });
    }

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Une erreur est survenue lors de la connexion." };
  }
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function switchRoleAction() {
  const session = await verifySession();
  if (!session || !session.email) return { error: "Non authentifié ou session trop ancienne (veuillez vous reconnecter)" };

  if (session.role === "OWNER") {
    const candidate = await prisma.candidate.findUnique({ where: { email: session.email } });
    if (candidate) {
      await createSession({
        id: candidate.id,
        email: candidate.email,
        name: `${candidate.firstName} ${candidate.lastName}`,
        role: "CANDIDATE"
      });
      redirect("/compte");
    }
  } else {
    const owner = await prisma.user.findUnique({ where: { email: session.email } });
    if (owner) {
      await createSession({
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: "OWNER"
      });
      redirect("/admin");
    }
  }
  return { error: "Compte alternatif non trouvé" };
}

export async function getAccountInfo() {
  const session = await verifySession();
  if (!session) return { error: "Non authentifié" };

  try {
    if (session.role === "OWNER") {
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (!user) return { error: "Utilisateur non trouvé" };
      return { data: { id: user.id, email: user.email, name: user.name, role: user.role } };
    } else {
      const candidate = await prisma.candidate.findUnique({ where: { id: session.id } });
      if (!candidate) return { error: "Candidat non trouvé" };
      return { data: { id: candidate.id, email: candidate.email, firstName: candidate.firstName, lastName: candidate.lastName, phone: candidate.phone, role: "CANDIDATE" } };
    }
  } catch (e) {
    return { error: "Erreur serveur" };
  }
}

export async function updateAccount(formData: FormData) {
  const session = await verifySession();
  if (!session) return { error: "Non authentifié" };

  try {
    const password = formData.get("password") as string;
    let passwordHash = undefined;
    if (password && password.length > 0) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (session.role === "OWNER") {
      const name = formData.get("name") as string;
      const dataToUpdate: any = { name };
      if (passwordHash) dataToUpdate.passwordHash = passwordHash;
      
      await prisma.user.update({
        where: { id: session.id },
        data: dataToUpdate
      });
    } else {
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;
      const phone = formData.get("phone") as string;
      const dataToUpdate: any = { firstName, lastName, phone };
      if (passwordHash) dataToUpdate.passwordHash = passwordHash;

      await prisma.candidate.update({
        where: { id: session.id },
        data: dataToUpdate
      });
    }

    return { success: true };
  } catch (e) {
    console.error("Update error", e);
    return { error: "Erreur lors de la mise à jour" };
  }
}

// --- ANCIEN SYSTEME POUR COMPATIBILITE PENDANT LA TRANSITION ---

export async function loginAsAction(id: string, name: string, role: "OWNER" | "CANDIDATE") {
  const currentSession = await verifySession();
  const isJulien = currentSession?.email === "julien.favaux@gmail.com" || currentSession?.originalEmail === "julien.favaux@gmail.com";

  if (!isJulien) {
    throw new Error("Non autorisé. Seul l'administrateur principal peut simuler d'autres comptes.");
  }

  let email = "";
  if (role === "OWNER") {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) email = user.email;
  } else {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (candidate) email = candidate.email;
  }

  const originalEmail = currentSession?.originalEmail || currentSession?.email;

  await createSession({ id, email, name, role, originalEmail });
  
  if (role === "OWNER") {
    redirect("/admin");
  } else {
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
  await deleteSession();
  redirect("/");
}

export async function seedTestDataAction() {
  // Existing seed logic kept for compatibility
  const ownerA = await prisma.user.create({ data: { name: "Propriétaire A (Dupont)", email: "proprietaire.a@bail-bail.com", role: "OWNER" }});
  const ownerB = await prisma.user.create({ data: { name: "Propriétaire B (Martin)", email: "proprietaire.b@bail-bail.com", role: "OWNER" }});
  await prisma.property.updateMany({ data: { ownerId: ownerA.id } });
  await prisma.property.create({ data: { code: "BB-TEST-B", title: "Appartement Test Propriétaire B", shortAddress: "Paris 11ème", rent: 1200, surface: 50, description: "Appartement de test pour simuler la vue du propriétaire B", status: "AVAILABLE", ownerId: ownerB.id } });
  await prisma.candidate.create({ data: { firstName: "Candidat", lastName: "Test 1", email: "candidat1@test.com", phone: "0600000001" } });
  await prisma.candidate.create({ data: { firstName: "Candidat", lastName: "Test 2", email: "candidat2@test.com", phone: "0600000002" } });
  revalidatePath("/");
  return { success: true };
}
