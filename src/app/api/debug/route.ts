import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        visitSlots: true
      }
    });

    const info = properties.map(p => ({
      code: p.code,
      title: p.title,
      slotsCount: p.visitSlots.length,
      slots: p.visitSlots.map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        status: s.status
      }))
    }));

    return NextResponse.json({ success: true, properties: info });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
