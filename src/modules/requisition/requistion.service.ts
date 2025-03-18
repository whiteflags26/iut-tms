import { PrismaClient, Requisition, RequestStatus, Role, Department } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';
import * as approvalService from '../approval/approval.service';

const prisma = new PrismaClient();

interface RequisitionInput {
  userId: number;
  purpose: string;
  placesToVisit: string;
  placeToPickup: string;
  numberOfPassengers: number;
  dateTimeRequired: Date;
  contactPersonNumber: string;
}

interface RequisitionUpdateInput {
  purpose?: string;
  placesToVisit?: string;
  placeToPickup?: string;
  numberOfPassengers?: number;
  dateTimeRequired?: Date;
  contactPersonNumber?: string;
  status?: RequestStatus;
  vehicleId?: number | null;
  driverId?: number | null;
}

export const createRequisition = async (data: RequisitionInput): Promise<Requisition> => {
  const requisition = await prisma.requisition.create({
    data: {
      userId: data.userId,
      purpose: data.purpose,
      placesToVisit: data.placesToVisit,
      placeToPickup: data.placeToPickup, 
      numberOfPassengers: data.numberOfPassengers,
      dateTimeRequired: data.dateTimeRequired,
      contactPersonNumber: data.contactPersonNumber,
      status: RequestStatus.PENDING,
    },
  });

  await approvalService.createApproval({
      requisitionId: requisition.id,
      approverUserId: requisition.userId,
      approverRole: Role.HOD,
      comments: 'Approval for HOD',
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

export const getAllRequisitions = async (
  userRole: Role,
  userDepartment?: Department
): Promise<Requisition[]> => {
  const where: any = {};

  // If the user is HOD, filter requisitions by department
  if (userRole === Role.HOD && userDepartment) {
    where.user = {
      department: userDepartment,
    };
  }
 console.log(userDepartment);
 console.log(userRole);
  
  return await prisma.requisition.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          role: true,
          department: true, 
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
    data: {
      purpose: data.purpose,
      placesToVisit: data.placesToVisit,
      placeToPickup: data.placeToPickup,
      numberOfPassengers: data.numberOfPassengers,
      dateTimeRequired: data.dateTimeRequired,
      contactPersonNumber: data.contactPersonNumber,
      status: data.status,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
    },
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

export const searchRequisitions = async (
  options: {
    userId?: number;
    purpose?: string;
    placesToVisit?: string;
    placeToPickup?: string;
    numberOfPassengers?: number;
    minPassengers?: number;
    maxPassengers?: number;
    dateTimeRequired?: Date;
    startDate?: Date;
    endDate?: Date;
    contactPersonNumber?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  userRole: Role,
  userDepartment?: Department
): Promise<Requisition[]> => {
  const {
    userId,
    purpose,
    placesToVisit,
    placeToPickup,
    numberOfPassengers,
    minPassengers,
    maxPassengers,
    dateTimeRequired,
    startDate,
    endDate,
    contactPersonNumber,
    sortBy,
    sortOrder,
  } = options;

  const where: any = {};

  // If the user is HOD, filter requisitions by department
  if (userRole === Role.HOD && userDepartment) {
    where.user = {
      department: userDepartment,
    };
  }

  // Filter by userId
  if (userId) {
    where.userId = userId;
  }

  // Filter by purpose (case-insensitive search)
  if (purpose) {
    where.purpose = {
      contains: purpose,
      mode: 'insensitive',
    };
  }

  // Filter by placesToVisit (case-insensitive search)
  if (placesToVisit) {
    where.placesToVisit = {
      contains: placesToVisit,
      mode: 'insensitive',
    };
  }

  // Filter by placeToPickup (case-insensitive search)
  if (placeToPickup) {
    where.placeToPickup = {
      contains: placeToPickup,
      mode: 'insensitive',
    };
  }

  // Filter by numberOfPassengers (exact match)
  if (numberOfPassengers) {
    where.numberOfPassengers = numberOfPassengers;
  }

  // Filter by passenger range (minPassengers and maxPassengers)
  if (minPassengers !== undefined || maxPassengers !== undefined) {
    where.numberOfPassengers = {};
    if (minPassengers !== undefined) {
      where.numberOfPassengers.gte = minPassengers;
    }
    if (maxPassengers !== undefined) {
      where.numberOfPassengers.lte = maxPassengers;
    }
  }

  // Filter by dateTimeRequired (exact match)
  if (dateTimeRequired) {
    where.dateTimeRequired = dateTimeRequired;
  }

  // Filter by date range (startDate and endDate)
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

  // Filter by contactPersonNumber (case-insensitive search)
  if (contactPersonNumber) {
    where.contactPersonNumber = {
      contains: contactPersonNumber,
      mode: 'insensitive',
    };
  }

  const orderBy: any = {};
  if (sortBy && sortOrder) {
    orderBy[sortBy] = sortOrder;
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
          department: true, // Include department in the response
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
    orderBy,
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

