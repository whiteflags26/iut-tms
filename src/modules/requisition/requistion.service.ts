import { PrismaClient, Requisition, RequestStatus, Role } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

const prisma = new PrismaClient();

interface RequisitionInput {
  userId: number;
  purpose: string;
  placesToVisit: string;
  numberOfPassengers: number;
  dateTimeRequired: Date;
  contactPersonNumber: string;
}

interface RequisitionUpdateInput {
  purpose?: string;
  placesToVisit?: string;
  numberOfPassengers?: number;
  dateTimeRequired?: Date;
  contactPersonNumber?: string;
  status?: RequestStatus;
  vehicleId?: number | null;
  driverId?: number | null;
}

export const createRequisition = async (data: RequisitionInput): Promise<Requisition> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Create the requisition
  const requisition = await prisma.requisition.create({
    data: {
      userId: data.userId,
      purpose: data.purpose,
      placesToVisit: data.placesToVisit,
      numberOfPassengers: data.numberOfPassengers,
      dateTimeRequired: data.dateTimeRequired,
      contactPersonNumber: data.contactPersonNumber,
      status: RequestStatus.PENDING,
    },
  });

  // Create initial approval for HOD
  await prisma.approval.create({
    data: {
      requisitionId: requisition.id,
      approverUserId: data.userId, // Replace with actual HOD's ID in a real scenario
      approverRole: Role.HOD,
      approvalStatus: RequestStatus.PENDING,
    },
  });

  return requisition;
};

export const getRequisitionById = async (id: number): Promise<Requisition> => {
  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          contactNumber: true,
        },
      },
      approvals: {
        include: {
          approverUser: {
            select: {
              id: true,
              name: true,
              email: true,
              designation: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      vehicle: true,
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              contactNumber: true,
            },
          },
        },
      },
    },
  });

  if (!requisition) {
    throw new NotFoundError('Requisition not found');
  }

  return requisition;
};

export const getRequisitionsByUserId = async (userId: number): Promise<Requisition[]> => {
  return await prisma.requisition.findMany({
    where: { userId },
    include: {
      approvals: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      vehicle: true,
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              contactNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getAllRequisitions = async (): Promise<Requisition[]> => {
  return await prisma.requisition.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          role: true,
        },
      },
      approvals: {
        include: {
          approverUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      vehicle: true,
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              contactNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const updateRequisition = async (
  id: number,
  data: RequisitionUpdateInput
): Promise<Requisition> => {
  const requisition = await prisma.requisition.findUnique({
    where: { id },
  });

  if (!requisition) {
    throw new NotFoundError('Requisition not found');
  }

  return await prisma.requisition.update({
    where: { id },
    data,
    include: {
      approvals: true,
      vehicle: true,
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              contactNumber: true,
            },
          },
        },
      },
    },
  });
};

export const deleteRequisition = async (id: number): Promise<Requisition> => {
  const requisition = await prisma.requisition.findUnique({
    where: { id },
  });

  if (!requisition) {
    throw new NotFoundError('Requisition not found');
  }

  // First delete all approvals related to this requisition
  await prisma.approval.deleteMany({
    where: { requisitionId: id },
  });

  // Then delete the requisition
  return await prisma.requisition.delete({
    where: { id },
  });
};

export const searchRequisitions = async (options: {
  status?: RequestStatus;
  startDate?: Date;
  endDate?: Date;
  userId?: number;
}): Promise<Requisition[]> => {
  const { status, startDate, endDate, userId } = options;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.dateTimeRequired = {
      gte: startDate,
      lte: endDate,
    };
  } else if (startDate) {
    where.dateTimeRequired = {
      gte: startDate,
    };
  } else if (endDate) {
    where.dateTimeRequired = {
      lte: endDate,
    };
  }

  if (userId) {
    where.userId = userId;
  }

  return await prisma.requisition.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
        },
      },
      approvals: {
        include: {
          approverUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
      vehicle: true,
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              contactNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};


export const assignVehicleAndDriver = async (
  requisitionId: number,
  vehicleId: number,
  driverId: number
): Promise<Requisition> => {
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
  });

  if (!requisition) {
    throw new NotFoundError('Requisition not found');
  }

  if (requisition.status !== RequestStatus.APPROVED) {
    throw new Error('Cannot assign vehicle and driver to unapproved requisition');
  }

  // Check if vehicle exists and is available
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle || vehicle.status !== 'ACTIVE') {
    throw new Error('Vehicle not available');
  }

  // Check if driver exists and is available
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver || driver.status !== 'ACTIVE') {
    throw new Error('Driver not available');
  }

  // Update the requisition with vehicle and driver
  return await prisma.requisition.update({
    where: { id: requisitionId },
    data: {
      vehicleId,
      driverId,
    },
    include: {
      user: true,
      vehicle: true,
      driver: {
        include: {
          user: true,
        },
      },
    },
  });
};

