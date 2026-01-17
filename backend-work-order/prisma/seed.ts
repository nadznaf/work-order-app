import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Optional: Clean up existing data to avoid duplicates or errors (be careful in production!)
  // In development, it helps reset state.
  // We use deleteMany instead of clean/truncate to respect foreign keys if cascading is set,
  // or we delete in specific order: Items -> Requests -> WorkOrders -> Users
  await prisma.sparepartItem.deleteMany();
  await prisma.sparepartRequest.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });

  const spv = await prisma.user.create({
    data: {
      name: 'Supervisor John',
      role: 'SPV',
    },
  });

  const mechanic = await prisma.user.create({
    data: {
      name: 'Mechanic Mike',
      role: 'MECHANIC',
    },
  });

  console.log({ admin, spv, mechanic });
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
