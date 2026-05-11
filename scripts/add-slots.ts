import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Adding visit slots to properties...");
  
  const properties = await prisma.property.findMany();
  
  let slotsCreated = 0;
  for (const property of properties) {
    const existingSlots = await prisma.visitSlot.count({
      where: { propertyId: property.id }
    });
    
    if (existingSlots === 0) {
      console.log(`Adding slots for property ${property.code}`);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      dayAfter.setHours(14, 0, 0, 0);

      const dayAfter2 = new Date();
      dayAfter2.setDate(dayAfter2.getDate() + 2);
      dayAfter2.setHours(14, 30, 0, 0);
      
      await prisma.visitSlot.createMany({
        data: [
          { propertyId: property.id, date: tomorrow, duration: 30 },
          { propertyId: property.id, date: dayAfter, duration: 30 },
          { propertyId: property.id, date: dayAfter2, duration: 30 },
        ]
      });
      slotsCreated += 3;
    }
  }
  
  console.log(`Finished! Created ${slotsCreated} slots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
