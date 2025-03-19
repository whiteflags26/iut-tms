import { PrismaClient, Driver, DriverStatus, RequestStatus, Role } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors';

const prisma = new PrismaClient();

interface DriverInput {
  userId: number;
  licenseNumber: string;
  status?: DriverStatus;
}

interface LeaveRequestInput {
  driverId: number;
  startDate: Date;
  endDate: Date;
  reason: string;
}

interface DriverRatingInput {
  driverId: number;
  userId: number;
  rating: number;
  comment?: string;
}

export const createDriver = async (driverData: DriverInput): Promise<Driver> => {
  const { userId, licenseNumber, status } = driverData;

  // Check if the user exists and update their role to DRIVER
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

//   if (user.role !== Role.USER) {
//     throw new BadRequestError('User is already assigned a role');
//   }

  await prisma.user.update({
    where: { id: userId },
    data: { role: Role.DRIVER },
  });

  // Create the driver
  const driver = await prisma.driver.create({
    data: {
      userId,
      licenseNumber,
      status: status || DriverStatus.ACTIVE,
    },
  });

  return driver;
};

export const updateDriver = async (id: number, driverData: Partial<DriverInput>): Promise<Driver> => {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  const updatedDriver = await prisma.driver.update({
    where: { id },
    data: driverData,
  });

  return updatedDriver;
};

export const getDriverById = async (id: number): Promise<Driver> => {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  return driver;
};

export const getAllDrivers = async (): Promise<Driver[]> => {
  return await prisma.driver.findMany({
    include: { user: true },
  });
};

export const createLeaveRequest = async (leaveRequestData: LeaveRequestInput): Promise<any> => {
  const { driverId, startDate, endDate, reason } = leaveRequestData;

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      driverId,
      startDate,
      endDate,
      reason,
      status: RequestStatus.PENDING,
    },
  });

  return leaveRequest;
};

export const updateLeaveRequestStatus = async (id: number, status: RequestStatus): Promise<any> => {
  const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leaveRequest) {
    throw new NotFoundError('Leave request not found');
  }

  const updatedLeaveRequest = await prisma.leaveRequest.update({
    where: { id },
    data: { status },
  });

  return updatedLeaveRequest;
};

export const createDriverRating = async (ratingData: DriverRatingInput): Promise<any> => {
  const { driverId, userId, rating, comment } = ratingData;

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const driverRating = await prisma.driverRating.create({
    data: {
      driverId,
      userId,
      rating,
      comment,
    },
  });

  return driverRating;
};

export const getDriverRatings = async (driverId: number): Promise<any> => {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  const ratings = await prisma.driverRating.findMany({
    where: { driverId },
    include: { user: true },
  });

  return ratings;
};