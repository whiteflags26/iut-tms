import { PrismaClient, Trip, TripStatus, Vehicle, Driver } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';

const prisma = new PrismaClient();

interface TripInput {
  routeId: number;
  vehicleId: number;
  driverId: number;
  scheduledDateTime: Date;
  availableSeats: number;
}

interface TripUpdateInput {
  routeId?: number;
  vehicleId?: number;
  driverId?: number;
  scheduledDateTime?: Date;
  availableSeats?: number;
  status?: TripStatus;
}

export const createTrip = async (data: TripInput): Promise<Trip> => {
  // Check if vehicle and driver are available
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle || vehicle.status !== 'ACTIVE') {
    throw new BadRequestError('Vehicle not available');
  }

  const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
  if (!driver || driver.status !== 'ACTIVE') {
    throw new BadRequestError('Driver not available');
  }

  // Create the trip
  const trip = await prisma.trip.create({
    data: {
      routeId: data.routeId,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      scheduledDateTime: data.scheduledDateTime,
      availableSeats: data.availableSeats,
    },
  });

  return trip;
};

export const getTripById = async (id: number): Promise<Trip> => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      route: true,
      vehicle: true,
      driver: {
        include: {
          user: true,
        },
      },
      tickets: true,
    },
  });

  if (!trip) {
    throw new NotFoundError('Trip not found');
  }

  return trip;
};

export const updateTrip = async (id: number, data: TripUpdateInput): Promise<Trip> => {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    throw new NotFoundError('Trip not found');
  }

  return await prisma.trip.update({
    where: { id },
    data: {
      routeId: data.routeId,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      scheduledDateTime: data.scheduledDateTime,
      availableSeats: data.availableSeats,
    },
  });
};

export const deleteTrip = async (id: number): Promise<Trip> => {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    throw new NotFoundError('Trip not found');
  }

  return await prisma.trip.delete({ where: { id } });
};

export const getAllTrips = async (): Promise<Trip[]> => {
  return await prisma.trip.findMany({
    include: {
      route: true,
      vehicle: true,
      driver: {
        include: {
          user: true,
        },
      },
      tickets: true,
    },
  });
};

export const searchTrips = async (options: {
  routeId?: number;
  vehicleId?: number;
  driverId?: number;
  status?: TripStatus;
  date?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<Trip[]> => {
  const { routeId, vehicleId, driverId, status, date, sortBy, sortOrder } = options;

  const where: any = {};

  if (routeId) {
    where.routeId = routeId;
  }

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  if (driverId) {
    where.driverId = driverId;
  }

  if (status) {
    where.status = status;
  }

  if (date) {
    where.scheduledDateTime = {
      gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
      lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0),
    };
  }

  const orderBy: any = {};
  if (sortBy && sortOrder) {
    orderBy[sortBy] = sortOrder;
  }

  return await prisma.trip.findMany({
    where,
    include: {
      route: true,
      vehicle: true,
      driver: {
        include: {
          user: true,
        },
      },
      tickets: true,
    },
    orderBy,
  });
};