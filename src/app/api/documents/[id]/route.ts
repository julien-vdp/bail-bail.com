import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getPrivateUploadsRoot } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const documentId = resolvedParams.id;

  if (!documentId) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const session = await verifySession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Find the document and its relations
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      application: {
        include: { property: true }
      }
    }
  });

  if (!document) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Authorization check
  let isAuthorized = false;
  if (session.role === "CANDIDATE" && document.application.candidateId === session.id) {
    isAuthorized = true;
  } else if (session.role === "OWNER" && document.application.property.ownerId === session.id) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Read the encrypted file
  const filepath = path.join(getPrivateUploadsRoot(), "documents", document.applicationId, `${documentId}.enc`);
  
  try {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
      throw new Error("Server misconfiguration: ENCRYPTION_KEY");
    }

    const fileBuffer = await fs.readFile(filepath);

    // Extract IV, AuthTag and Encrypted Data
    // We saved it as: IV (16 bytes) + AuthTag (16 bytes) + EncryptedData
    const iv = fileBuffer.subarray(0, 16);
    const authTag = fileBuffer.subarray(16, 32);
    const encryptedData = fileBuffer.subarray(32);

    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    // Serve the decrypted file
    const response = new NextResponse(decrypted);
    response.headers.set("Content-Type", document.mimeType);
    
    // We do NOT cache sensitive documents publicly. Only private short-lived cache.
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    response.headers.set("Content-Disposition", `inline; filename="${document.fileName}"`);
    
    return response;

  } catch (e) {
    console.error("Erreur de déchiffrement du document:", e);
    return new NextResponse("Document introuvable ou corrompu sur le disque", { status: 500 });
  }
}
