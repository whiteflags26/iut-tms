import { PrismaClient } from '@prisma/client';
import seedUsers from './user.seed';

const prisma = new PrismaClient();

const numberOfUsers = 20; // Number of fake users to create

seedUsers(numberOfUsers)
  .catch((error) => {
    console.error('Error seeding users:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });