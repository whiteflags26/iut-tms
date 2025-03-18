import { PrismaClient, Approval, RequestStatus, Role } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

const prisma = new PrismaClient();

interface ApprovalInput {
  requisitionId: number;
  approverUserId: number;
  approverRole: Role;
  comments?: string;
}

export const getApprovalById = async (id: number): Promise<Approval> => {
  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      requisition: true,
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
  });

  if (!approval) {
    throw new NotFoundError('Approval not found');
  }

  return approval;
};

export const createApproval = async (data: ApprovalInput): Promise<Approval> => {
  // Check if requisition exists
  const requisition = await prisma.requisition.findUnique({
    where: { id: data.requisitionId },
  });

  if (!requisition) {
    throw new NotFoundError('Requisition not found');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: data.approverUserId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Create approval
  return await prisma.approval.create({
    data: {
      requisitionId: data.requisitionId,
      approverUserId: data.approverUserId,
      approverRole: data.approverRole,
      comments: data.comments,
      approvalStatus: RequestStatus.PENDING,
    },
  });
};

export const updateApprovalStatus = async (
  id: number,
  status: RequestStatus,
  comments?: string
): Promise<Approval> => {
  const approval = await prisma.approval.findUnique({
    where: { id },
  });

  if (!approval) {
    throw new NotFoundError('Approval not found');
  }

  // Update approval
  return await prisma.approval.update({
    where: { id },
    data: {
      approvalStatus: status,
      comments: comments || undefined,
      approvalDate: new Date(),
    },
  });
};

export const getApprovalsByRequisitionId = async (requisitionId: number): Promise<Approval[]> => {
  return await prisma.approval.findMany({
    where: { requisitionId },
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
  });
};

export const getPendingApprovalsByUserRole = async (
  userId: number,
  role: Role
): Promise<Approval[]> => {
  return await prisma.approval.findMany({
    where: {
      approverUserId: userId,
      approverRole: role,
      approvalStatus: RequestStatus.PENDING,
    },
    include: {
      requisition: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              designation: true,
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

export const deleteApproval = async (id: number): Promise<Approval> => {
  const approval = await prisma.approval.findUnique({
    where: { id },
  });

  if (!approval) {
    throw new NotFoundError('Approval not found');
  }

  return await prisma.approval.delete({
    where: { id },
  });
};

export const processApproval = async (
  approvalId: number,
  status: RequestStatus,
  userRole: Role,
  comments?: string
): Promise<void> => {
  // Get the approval
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: { requisition: true },
  });

  if (!approval) {
    throw new NotFoundError('Approval not found');
  }

  if(userRole !== Role.ADMIN && userRole !== approval.approverRole) {
    throw new Error('User is not authorized to process this approval');
  }

  // Update the approval status
  await prisma.approval.update({
    where: { id: approvalId },
    data: {
      approvalStatus: status,
      comments: comments || undefined,
      approvalDate: new Date(),
    },
  });

  const requisitionId = approval.requisitionId;

  // If rejected, update requisition status to REJECTED
  if (status === RequestStatus.REJECTED) {
    await prisma.requisition.update({
      where: { id: requisitionId },
      data: { status: RequestStatus.REJECTED },
    });
    return;
  }

  // If approved, determine the next step in the workflow
  const currentApproverRole = approval.approverRole;

  if (currentApproverRole === Role.HOD) {
    // Create approval for Transport Officer
    await prisma.approval.create({
      data: {
        requisitionId,
        approverUserId: 1, // Replace with actual Transport Officer ID in real scenario
        approverRole: Role.TRANSPORT_OFFICER,
        approvalStatus: RequestStatus.PENDING,
      },
    });
  } else if (currentApproverRole === Role.TRANSPORT_OFFICER) {
    // Final approval, update requisition status to APPROVED
    await prisma.requisition.update({
      where: { id: requisitionId },
      data: { status: RequestStatus.APPROVED },
    });
  }
};

export const getPendingApprovalsForUser = async (
  userId: number,
  userRole: Role
): Promise<any[]> => {
  return await prisma.approval.findMany({
    where: {
      approverUserId: userId,
      approverRole: userRole,
      approvalStatus: RequestStatus.PENDING,
    },
    include: {
      requisition: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              designation: true,
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