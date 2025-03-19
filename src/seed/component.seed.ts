import { PrismaClient, Role, RequestStatus, VehicleStatus, DriverStatus, Department } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface SeedParams {
  numberOfUsers: number;
  numberOfRequisitions: number;
  numberOfVehicles: number;
  numberOfDrivers: number;
  numberOfApprovals: number;
}

async function seedDatabase(params: SeedParams): Promise<void> {
  const { numberOfUsers, numberOfRequisitions, numberOfVehicles, numberOfDrivers, numberOfApprovals } = params;

  try {
    // Seed Users
    for (let i = 0; i < numberOfUsers; i++) {
      const user = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash: '$2b$10$YeRR36HD9D9txk0VgNOMbOpGni5GJ1cANvjGA9PfHTMoxuggOWZNS', // Password: password123
        designation: faker.helpers.arrayElement(['Faculty', 'Assistant Professor', 'Associate Professor', 'Professor', 'Staff']),
        contactNumber: faker.phone.number(),
        role: faker.helpers.arrayElement([Role.USER, Role.ADMIN, Role.TRANSPORT_OFFICER]),
        eWalletBalance: faker.number.float({ min: 0, max: 1000 }),
        department: faker.helpers.arrayElement([Department.CSE, Department.EEE, Department.CEE, Department.MPE, Department.GENERAL]),
      };

      await prisma.user.create({ data: user });
    }

    console.log(`Seeded ${numberOfUsers} users successfully.`);

    // Seed Vehicles
    for (let i = 0; i < numberOfVehicles; i++) {
      const vehicle = {
        registrationNumber: faker.vehicle.vrm(),
        type: faker.vehicle.type(),
        capacity: faker.number.int({ min: 4, max: 50 }),
        status: faker.helpers.arrayElement([VehicleStatus.ACTIVE, VehicleStatus.UNDER_MAINTENANCE, VehicleStatus.INACTIVE]),
      };

      await prisma.vehicle.create({ data: vehicle });
    }

    console.log(`Seeded ${numberOfVehicles} vehicles successfully.`);

    // Seed Drivers
    const users = await prisma.user.findMany();
    for (let i = 0; i < numberOfDrivers; i++) {
      const user = users[i % users.length]; // Cycle through users to assign as drivers
      const driver = {
        userId: user.id,
        licenseNumber: faker.string.alphanumeric(10),
        status: faker.helpers.arrayElement([DriverStatus.ACTIVE, DriverStatus.ON_LEAVE, DriverStatus.INACTIVE]),
      };

      await prisma.driver.create({ data: driver });
    }

    console.log(`Seeded ${numberOfDrivers} drivers successfully.`);

    // Seed Requisitions
    for (let i = 0; i < numberOfRequisitions; i++) {
      const user = users[i % users.length]; // Cycle through users to assign as requisition creators
      const requisition = {
        userId: user.id,
        purpose: faker.lorem.sentence(),
        placesToVisit: faker.location.city(),
        placeToPickup: faker.location.streetAddress(),
        numberOfPassengers: faker.number.int({ min: 1, max: 10 }),
        dateTimeRequired: faker.date.future(),
        contactPersonNumber: faker.phone.number(),
        status: RequestStatus.PENDING,
      };

      await prisma.requisition.create({ data: requisition });
    }

    console.log(`Seeded ${numberOfRequisitions} requisitions successfully.`);

    // Seed Approvals
    const requisitions = await prisma.requisition.findMany();
    for (let i = 0; i < numberOfApprovals; i++) {
      const requisition = requisitions[i % requisitions.length]; // Cycle through requisitions to assign approvals
      const approval = {
        requisitionId: requisition.id,
        approverUserId: users[i % users.length].id, // Cycle through users to assign as approvers
        approverRole: faker.helpers.arrayElement([Role.HOD, Role.TRANSPORT_OFFICER, Role.ADMIN]),
        approvalStatus: faker.helpers.arrayElement([RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED]),
        comments: faker.lorem.sentence(),
      };

      await prisma.approval.create({ data: approval });
    }

    console.log(`Seeded ${numberOfApprovals} approvals successfully.`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export default seedDatabase;