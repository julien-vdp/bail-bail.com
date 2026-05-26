import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const properties = [
  {
    code: "BB-PARIS-01",
    title: "Superbe T2 rénové au cœur du Marais",
    shortAddress: "Paris 4ème",
    rent: 1450,
    surface: 42,
    description: "Appartement de charme avec poutres apparentes, entièrement rénové par un architecte d'intérieur. Cuisine équipée ouverte sur le salon, chambre séparée avec grand dressing. Très lumineux, exposition sud.",
    status: "AVAILABLE",
    isEligibleGLI: true,
    minSalaryRequired: 4350,
    studentPolicy: "ACCEPTED",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1de2d93688?q=80&w=1000&auto=format&fit=crop", "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-PARIS-02",
    title: "Studio cocon parfait pour étudiant",
    shortAddress: "Paris 11ème",
    rent: 850,
    surface: 22,
    description: "Idéal étudiant. Studio très bien optimisé au 5ème étage sans ascenseur. Espace nuit en mezzanine, salle d'eau fonctionnelle. Proche métros Bastille et Bréguet-Sabin. Quartier très dynamique.",
    status: "AVAILABLE",
    isEligibleGLI: false,
    minSalaryRequired: null,
    studentPolicy: "ONLY_STUDENTS",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-LYON-01",
    title: "Grand T4 familial Presqu'île",
    shortAddress: "Lyon 2ème",
    rent: 2100,
    surface: 110,
    description: "Vaste appartement bourgeois, parquet chevron, cheminées, belle hauteur sous plafond. 3 vraies chambres, 2 salles de bains. Balcon filant offrant une vue dégagée. Cave et grenier inclus.",
    status: "AVAILABLE",
    isEligibleGLI: true,
    minSalaryRequired: 6300,
    studentPolicy: "REFUSED",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000&auto=format&fit=crop", "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-BORDEAUX-01",
    title: "Loft atypique Chartrons",
    shortAddress: "Bordeaux Chartrons",
    rent: 1600,
    surface: 85,
    description: "Ancien chai réhabilité en loft. Immense pièce de vie de 50m2, verrière zénithale, murs en pierre apparente. Espace nuit à l'étage. Coup de cœur assuré pour les amateurs d'espaces atypiques.",
    status: "AVAILABLE",
    isEligibleGLI: true,
    minSalaryRequired: 4800,
    studentPolicy: "ACCEPTED",
    images: ["https://images.unsplash.com/photo-1600607687959-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-LILLE-01",
    title: "T3 moderne avec terrasse",
    shortAddress: "Lille Vieux-Lille",
    rent: 1250,
    surface: 65,
    description: "Dans résidence récente sécurisée, bel appartement T3 avec terrasse de 15m2 orientée ouest. 2 chambres, salle de bain avec baignoire. Place de parking couverte incluse.",
    status: "AVAILABLE",
    isEligibleGLI: true,
    minSalaryRequired: 3750,
    studentPolicy: "ACCEPTED",
    images: ["https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-PARIS-03",
    title: "Chambre de bonne standing",
    shortAddress: "Paris 16ème",
    rent: 650,
    surface: 12,
    description: "Petite surface mais prestations haut de gamme. Douche intégrée, lit escamotable, kitchenette discrète. Toilettes sur le palier. Parfait comme pied à terre ou pour étudiant.",
    status: "AVAILABLE",
    isEligibleGLI: false,
    minSalaryRequired: 1950,
    studentPolicy: "ONLY_STUDENTS",
    images: ["https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-STRAS-01",
    title: "Duplex de charme Krutenau",
    shortAddress: "Strasbourg Krutenau",
    rent: 1100,
    surface: 55,
    description: "Au dernier étage d'un immeuble alsacien traditionnel, duplex très lumineux. Belle pièce à vivre avec cuisine US équipée. A l'étage, grande chambre mansardée avec coin bureau.",
    status: "AVAILABLE",
    isEligibleGLI: true,
    minSalaryRequired: 3300,
    studentPolicy: "ACCEPTED",
    images: ["https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-NANTES-01",
    title: "Appartement vue sur la Loire",
    shortAddress: "Nantes Île de Nantes",
    rent: 1350,
    surface: 70,
    description: "T3 exceptionnel offrant une vue panoramique sur le fleuve. Balcon de 10m2, grand salon très clair, deux chambres dont une suite parentale avec dressing. Cellier et parking.",
    status: "AVAILABLE",
    isEligibleGLI: true,
    minSalaryRequired: 4050,
    studentPolicy: "REFUSED",
    images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-MONT-01",
    title: "P2 avec loggia Écusson",
    shortAddress: "Montpellier Écusson",
    rent: 920,
    surface: 45,
    description: "Idéalement situé dans l'hyper centre, P2 charmant avec petite loggia. Rue calme. Grande chambre avec rangements. Double vitrage récent, électricité refaite à neuf.",
    status: "AVAILABLE",
    isEligibleGLI: true,
    minSalaryRequired: 2760,
    studentPolicy: "ACCEPTED",
    images: ["https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1000&auto=format&fit=crop"]
  },
  {
    code: "BB-PARIS-04",
    title: "Penthouse d'exception",
    shortAddress: "Paris 8ème",
    rent: 5500,
    surface: 160,
    description: "Appartement de très grand standing à deux pas des Champs-Élysées. Terrasse de 40m2 aménagée. Triple réception, 3 suites avec salles de bains privatives. Conciergerie 24/7.",
    status: "AVAILABLE",
    isEligibleGLI: false,
    minSalaryRequired: 16500,
    studentPolicy: "REFUSED",
    images: ["https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=1000&auto=format&fit=crop", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1000&auto=format&fit=crop"]
  }
];

export async function GET() {
  const session = await verifySession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = "julien.favaux@gmail.com";
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Julien Favaux",
        role: "OWNER"
      }
    });
  }

  const results = [];

  for (const prop of properties) {
    const existing = await prisma.property.findUnique({ where: { code: prop.code } });
    if (existing) {
      results.push(`Ignored: ${prop.code} already exists.`);
      continue;
    }

    const { images, ...data } = prop;
    
    const createdProp = await prisma.property.create({
      data: {
        ...data,
        ownerId: user.id,
      }
    });

    for (const imgUrl of images) {
      await prisma.propertyImage.create({
        data: {
          propertyId: createdProp.id,
          url: imgUrl
        }
      });
    }

    results.push(`Created: ${prop.code} - ${prop.title}`);
  }

  return NextResponse.json({ message: "Seed done", results });
}
