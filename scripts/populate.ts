import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log('Nettoyage de la base de données...');
  // Nettoyage optionnel si besoin, ou on rajoute simplement par-dessus.
  // On va supprimer les données existantes pour avoir un état propre
  await prisma.propertyImage.deleteMany();
  await prisma.document.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.visitSlot.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  console.log('Récupération des images de la banque...');
  let bankImages: string[] = [];
  try {
    const bankDir = path.join(process.cwd(), "public", "bank");
    if (fs.existsSync(bankDir)) {
      const files = fs.readdirSync(bankDir);
      bankImages = files
        .filter(file => file.endsWith(".png") || file.endsWith(".jpg"))
        .map(file => `/bank/${file}`);
    }
  } catch (error) {
    console.log("Erreur lecture banque:", error);
  }

  // Helper pour piocher 2 à 3 images au hasard
  const getRandomImages = () => {
    if (bankImages.length === 0) return [];
    const shuffled = [...bankImages].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 2); // 2 or 3 images
  };

  console.log('Création des Propriétaires...');
  const owner1 = await prisma.user.create({
    data: { name: "Jean Dupont", email: "jean.dupont@proprio.com", role: "OWNER" }
  });
  const owner2 = await prisma.user.create({
    data: { name: "Sophie Martin", email: "sophie.martin@proprio.com", role: "OWNER" }
  });

  console.log('Création des Annonces pour Jean...');
  const prop1 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      code: generateCode(),
      title: "Superbe Canut rénové",
      shortAddress: "Lyon 4ème (Croix-Rousse)",
      rent: 1150,
      surface: 65,
      description: "Magnifique appartement de type Canut entièrement rénové avec goût. Murs en pierres apparentes, plafond à la française et grande hauteur sous plafond. Cuisine ouverte entièrement équipée (four, plaques, frigo, lave-vaisselle). Idéal pour un couple actif.",
      status: "AVAILABLE",
    }
  });
  await prisma.propertyImage.createMany({
    data: getRandomImages().map(url => ({ propertyId: prop1.id, url }))
  });

  const prop2 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      code: generateCode(),
      title: "Studio cosy hyper centre",
      shortAddress: "Lyon 2ème (Cordeliers)",
      rent: 650,
      surface: 22,
      description: "Petit studio très bien agencé en plein cœur de la Presqu'île. Refait à neuf en 2024. Canapé convertible haut de gamme, fibre optique installée, salle de bain moderne avec douche à l'italienne. À 2 minutes du métro A.",
      status: "AVAILABLE",
    }
  });
  await prisma.propertyImage.createMany({
    data: getRandomImages().map(url => ({ propertyId: prop2.id, url }))
  });

  const prop3 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      code: generateCode(),
      title: "Grand T4 familial avec vue",
      shortAddress: "Villeurbanne (Gratte-Ciel)",
      rent: 1450,
      surface: 95,
      description: "Appartement familial très lumineux au 6ème étage avec ascenseur. Grand balcon filant orienté plein Sud avec vue dégagée. 3 belles chambres, nombreux rangements, cave et place de parking privative au sous-sol.",
      status: "RENTED",
    }
  });
  await prisma.propertyImage.createMany({
    data: getRandomImages().map(url => ({ propertyId: prop3.id, url }))
  });

  console.log('Création des Annonces pour Sophie...');
  const prop4 = await prisma.property.create({
    data: {
      ownerId: owner2.id,
      code: generateCode(),
      title: "T2 moderne avec terrasse",
      shortAddress: "Choisy-le-Roi (Gare)",
      rent: 890,
      surface: 45,
      description: "Appartement récent (2020) à 5 minutes à pied du RER C. Prestations de qualité : parquet massif, volets roulants électriques, domotique. Grande terrasse de 15m² sans vis-à-vis. Résidence sécurisée avec local vélo.",
      status: "AVAILABLE",
    }
  });
  await prisma.propertyImage.createMany({
    data: getRandomImages().map(url => ({ propertyId: prop4.id, url }))
  });

  const prop5 = await prisma.property.create({
    data: {
      ownerId: owner2.id,
      code: generateCode(),
      title: "Charmant T3 sous les toits",
      shortAddress: "Paris 11ème (Bastille)",
      rent: 1600,
      surface: 55,
      description: "Appartement coup de cœur avec poutres apparentes. Traversant et très calme (sur cour). Cuisine US équipée, grande salle d'eau, wc séparés. Double vitrage récent. Proche de tous les commerces de bouche et restaurants.",
      status: "AVAILABLE",
    }
  });
  await prisma.propertyImage.createMany({
    data: getRandomImages().map(url => ({ propertyId: prop5.id, url }))
  });


  console.log('Création des Candidats (Locataires potentiels)...');
  const candidatesData = [
    { firstName: "Lucas", lastName: "Bernard", email: "lucas.b@exemple.com", phone: "0612345678" },
    { firstName: "Emma", lastName: "Petit", email: "emma.p@exemple.com", phone: "0623456789" },
    { firstName: "Hugo", lastName: "Dubois", email: "hugo.d@exemple.com", phone: "0634567890" },
    { firstName: "Chloé", lastName: "Moreau", email: "chloe.m@exemple.com", phone: "0645678901" },
    { firstName: "Léo", lastName: "Laurent", email: "leo.l@exemple.com", phone: "0656789012" },
    { firstName: "Inès", lastName: "Simon", email: "ines.s@exemple.com", phone: "0667890123" }
  ];

  for (const c of candidatesData) {
    await prisma.candidate.create({ data: c });
  }

  console.log('✨ Base de données peuplée avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
