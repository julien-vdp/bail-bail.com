import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const email = "julien.favaux@gmail.com";
  const user = await prisma.user.findUnique({ where: { email }, include: { properties: true } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const results = [];

  for (const property of user.properties) {
    // Generate 3 slots for each property in the coming week
    const slots = [];
    const baseDate = new Date();
    baseDate.setHours(10, 0, 0, 0); // start around 10 AM

    for (let i = 1; i <= 3; i++) {
      const slotDate = new Date(baseDate);
      slotDate.setDate(slotDate.getDate() + i + Math.floor(Math.random() * 2)); // 1 to 4 days ahead
      slotDate.setHours(9 + Math.floor(Math.random() * 8)); // Between 9am and 5pm
      
      slots.push({
        propertyId: property.id,
        date: slotDate,
        duration: 30,
        maxCandidates: 5,
        status: "AVAILABLE",
      });
    }

    await prisma.visitSlot.createMany({
      data: slots
    });

    results.push(`Created 3 slots for property: ${property.code}`);
  }

  return NextResponse.json({ message: "Slots created", results });
}
