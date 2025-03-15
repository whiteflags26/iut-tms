import { PrismaClient, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seedUsers(numberOfUsers: number): Promise<void> {
  try {
    for (let i = 0; i < numberOfUsers; i++) {
      const user = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash: '$2b$10$YeRR36HD9D9txk0VgNOMbOpGni5GJ1cANvjGA9PfHTMoxuggOWZNS', // Password: password123
        designation: faker.helpers.arrayElement(['Faculty', 'Assistant Professor', 'Associate Professor', 'Professor', 'Staff']),
        contactNumber: faker.phone.number(),
        role: faker.helpers.arrayElement([Role.USER, Role.ADMIN, Role.TRANSPORT_OFFICER]),
        eWalletBalance: faker.number.float({ min: 0, max: 1000 }),
      };

      await prisma.user.create({ data: user });
    }

    console.log(`Seeded ${numberOfUsers} users successfully.`);
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export default seedUsers;