import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function GET() {
  try {
    console.log("Starting prisma db push on server...");
    const pushResult = await execPromise("npx prisma db push");
    console.log("Prisma db push stdout:", pushResult.stdout);
    
    console.log("Starting prisma db seed on server...");
    const seedResult = await execPromise("npx prisma db seed");
    console.log("Prisma db seed stdout:", seedResult.stdout);

    console.log("Updating legacy properties in database...");
    const { prisma } = await import("@/lib/prisma");
    const updateResult = await prisma.property.updateMany({
      data: {
        requiresCurrentAddressProof: true,
        requiresEmploymentProof: true,
        requiresIncomeProof: true,
        requiresTaxNotice: true,
        acceptsGuarantor: true,
        acceptsStudent: true,
        acceptsStudents: true,
        acceptsGuarantors: true,
      }
    });
    console.log("Update legacy properties result:", updateResult);
    
    return NextResponse.json({
      success: true,
      message: "Database schema pushed, seeded and legacy properties updated successfully!",
      updateResult,
      push: {
        stdout: pushResult.stdout,
        stderr: pushResult.stderr
      },
      seed: {
        stdout: seedResult.stdout,
        stderr: seedResult.stderr
      }
    });
  } catch (error: any) {
    console.error("Database schema push or seed failed:", error);
    return NextResponse.json({
      success: false,
      message: "Database migration/seed failed",
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    }, { status: 500 });
  }
}
