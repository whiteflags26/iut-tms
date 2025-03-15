import { PrismaClient, Vehicle, VehicleStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';

const prisma = new PrismaClient();

interface VehicleInput {
  registrationNumber: string;
  type: string;
  capacity: number;
  status?: VehicleStatus;
}

interface VehicleUpdateInput {
  type?: string;
  capacity?: number;
  status?: VehicleStatus;
}

export const createVehicle = async (vehicleData: VehicleInput): Promise<Vehicle> => {
  // Check if vehicle with the same registration number already exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { registrationNumber: vehicleData.registrationNumber },
  });

  if (existingVehicle) {
    throw new BadRequestError('Vehicle with this registration number already exists');
  }

  // Create the vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: vehicleData.registrationNumber,
      type: vehicleData.type,
      capacity: vehicleData.capacity,
      status: vehicleData.status || VehicleStatus.ACTIVE,
    },
  });

  return vehicle;
};

export const updateVehicle = async (id: number, vehicleData: VehicleUpdateInput): Promise<Vehicle> => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: vehicleData,
  });

  return updatedVehicle;
};

export const getVehicleById = async (id: number): Promise<Vehicle> => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: true,
      requisitions: true,
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  return vehicle;
};

export const getAllVehicles = async (): Promise<Vehicle[]> => {
  return await prisma.vehicle.findMany({
    include: {
      _count: {
        select: {
          trips: true,
          requisitions: true,
        },
      },
    },
  });
};

export const searchVehicles = async (options: {
    status?: VehicleStatus;
    type?: string;
    capacity?: number;
    date?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Vehicle[]> => {
    const { status, type, capacity, date, sortBy, sortOrder } = options;
  
    // Build the WHERE clause for filtering
    const where: any = {};
  
    if (status) {
      where.status = status;
    }
  
    if (type) {
      where.type = type;
    }
  
    if (capacity) {
      where.capacity = { gte: capacity };
    }
  
    // Include trips and requisitions if a date is provided
    const include: any = {};
    if (date) {
      include.trips = {
        where: {
          scheduledDateTime: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0),
          },
        },
      };
      include.requisitions = {
        where: {
          dateTimeRequired: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0),
          },
        },
      };
    }
  
    // Build the ORDER BY clause for sorting
    const orderBy: any = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy] = sortOrder;
    }
  
    // Fetch vehicles with filtering and sorting
    const vehicles = await prisma.vehicle.findMany({
      where,
      include,
      orderBy,
    });
  
    // Filter out vehicles that have trips or requisitions for the requested date
    if (date) {
      return vehicles.filter(
        (vehicle) => vehicle.trips.length === 0 && vehicle.requisitions.length === 0
      );
    }
  
    return vehicles;
  };

export const changeVehicleStatus = async (id: number, status: VehicleStatus): Promise<Vehicle> => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // If changing to UNDER_MAINTENANCE or INACTIVE, check if the vehicle is scheduled for trips or requisitions
  if (status === VehicleStatus.UNDER_MAINTENANCE || status === VehicleStatus.INACTIVE) {
    const hasUpcomingTrips = await prisma.trip.findFirst({
      where: {
        vehicleId: id,
        scheduledDateTime: {
          gte: new Date(),
        },
      },
    });

    const hasUpcomingRequisitions = await prisma.requisition.findFirst({
      where: {
        vehicleId: id,
        dateTimeRequired: {
          gte: new Date(),
        },
      },
    });

    if (hasUpcomingTrips || hasUpcomingRequisitions) {
      throw new BadRequestError('Cannot change status: Vehicle has upcoming trips or requisitions');
    }
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: { status },
  });

  return updatedVehicle;
};

export const getVehicleHistory = async (id: number): Promise<any> => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Get past trips and requisitions for the vehicle
  const pastTrips = await prisma.trip.findMany({
    where: {
      vehicleId: id,
      scheduledDateTime: {
        lt: new Date(),
      },
    },
    include: {
      route: true,
      driver: {
        include: {
          user: {
            select: {
              name: true,
              contactNumber: true,
            },
          },
        },
      },
      tickets: {
        include: {
          user: {
            select: {
              name: true,
              designation: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledDateTime: 'desc',
    },
  });

  const pastRequisitions = await prisma.requisition.findMany({
    where: {
      vehicleId: id,
      dateTimeRequired: {
        lt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          name: true,
          designation: true,
        },
      },
      driver: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      dateTimeRequired: 'desc',
    },
  });

  // Get upcoming trips and requisitions
  const upcomingTrips = await prisma.trip.findMany({
    where: {
      vehicleId: id,
      scheduledDateTime: {
        gte: new Date(),
      },
    },
    include: {
      route: true,
      driver: {
        include: {
          user: {
            select: {
              name: true,
              contactNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledDateTime: 'asc',
    },
  });

  const upcomingRequisitions = await prisma.requisition.findMany({
    where: {
      vehicleId: id,
      dateTimeRequired: {
        gte: new Date(),
      },
    },
    include: {
      user: {
        select: {
          name: true,
          designation: true,
        },
      },
      driver: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      dateTimeRequired: 'asc',
    },
  });

  return {
    vehicleDetails: vehicle,
    history: {
      pastTrips,
      pastRequisitions,
    },
    upcoming: {
      upcomingTrips,
      upcomingRequisitions,
    },
  };
};