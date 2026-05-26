import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { getPrivateUploadsRoot } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const resolvedParams = await params;
  const filename = resolvedParams.filename;
  if (!filename || !filename.endsWith(".jpg")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const session = await verifySession();
  
  // Find the property image in the database to check permissions
  const imageUrl = `/api/images/property/${filename}`;
  const imageRecord = await prisma.propertyImage.findFirst({
    where: { url: imageUrl },
    include: { property: true }
  });

  if (!imageRecord) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let isAuthorized = false;

  // If there's no session but the property is available, we might want to allow it
  // The user asked "ne seront surtout pas accessible aux autres", meaning maybe only owner and logged-in candidates?
  if (session) {
    if (session.role === "OWNER") {
      // Owner can only see images of their own properties
      if (imageRecord.property.ownerId === session.id) {
        isAuthorized = true;
      }
    } else if (session.role === "CANDIDATE") {
      // Candidates can see if property is AVAILABLE or if they have an application
      if (imageRecord.property.status === "AVAILABLE") {
        isAuthorized = true;
      } else {
        const app = await prisma.application.findFirst({
          where: {
            propertyId: imageRecord.propertyId,
            candidateId: session.id
          }
        });
        if (app) isAuthorized = true;
      }
    }
  }

  // Also allow public viewing if property is completely AVAILABLE so the landing page works
  if (imageRecord.property.status === "AVAILABLE") {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const filepath = path.join(getPrivateUploadsRoot(), "properties", filename);
    const fileBuffer = await fs.readFile(filepath);
    
    const response = new NextResponse(fileBuffer);
    response.headers.set("Content-Type", "image/jpeg");
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    
    return response;
  } catch (e) {
    return new NextResponse("Image Not Found on Disk", { status: 404 });
  }
}
