import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Owner
  const owner = await prisma.user.upsert({
    where: { email: 'julien.favaux@gmail.com' },
    update: {},
    create: {
      email: 'julien.favaux@gmail.com',
      name: 'Julien Favaux',
      role: 'OWNER',
    },
  });

  // 2. Create Properties
  const choisy = await prisma.property.upsert({
    where: { code: 'BB-CHOISY-001' },
    update: {},
    create: {
      code: 'BB-CHOISY-001',
      title: 'Appartement T2 lumineux à Choisy-le-Roi',
      shortAddress: 'Choisy-le-Roi, Val-de-Marne',
      rent: 890,
      surface: 42,
      status: 'AVAILABLE',
    },
  });

  const lyon = await prisma.property.upsert({
    where: { code: 'BB-LYON-002' },
    update: {},
    create: {
      code: 'BB-LYON-002',
      title: 'Studio meublé proche centre',
      shortAddress: 'Lyon',
      rent: 720,
      surface: 25,
      status: 'AVAILABLE',
    },
  });

  // 3. Create Visit Slots
  const today = new Date();
  const days = [1, 2, 3];
  
  for (const day of days) {
    const slotDate1 = setMinutes(setHours(addDays(today, day), 10), 0); // 10:00
    const slotDate2 = setMinutes(setHours(addDays(today, day), 14), 0); // 14:00

    await prisma.visitSlot.create({
      data: {
        propertyId: choisy.id,
        date: slotDate1,
        duration: 30,
        status: 'AVAILABLE',
      },
    });
    await prisma.visitSlot.create({
      data: {
        propertyId: choisy.id,
        date: slotDate2,
        duration: 30,
        status: 'AVAILABLE',
      },
    });

    await prisma.visitSlot.create({
      data: {
        propertyId: lyon.id,
        date: slotDate1,
        duration: 30,
        status: 'AVAILABLE',
      },
    });
  }

  // 4. Create Candidates (without applications for now)
  await prisma.candidate.upsert({
    where: { email: 'camille@example.com' },
    update: {},
    create: {
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@example.com',
      phone: '0601020304',
    },
  });

  await prisma.candidate.upsert({
    where: { email: 'sami@example.com' },
    update: {},
    create: {
      firstName: 'Sami',
      lastName: 'Benali',
      email: 'sami@example.com',
      phone: '0610203040',
    },
  });

  await prisma.candidate.upsert({
    where: { email: 'lea@example.com' },
    update: {},
    create: {
      firstName: 'Léa',
      lastName: 'Durand',
      email: 'lea@example.com',
      phone: '0690807060',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
