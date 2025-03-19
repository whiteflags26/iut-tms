import { PrismaClient, Subscription, SubscriptionStatus, User, Route } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';

const prisma = new PrismaClient();

interface SubscriptionInput {
  userId: number;
  routeId: number;
  startDate: Date;
  endDate?: Date;
  monthlyCharge: number;
}

interface SubscriptionUpdateInput {
  routeId?: number;
  startDate?: Date;
  endDate?: Date;
  monthlyCharge?: number;
  status?: SubscriptionStatus;
}

export const createSubscription = async (data: SubscriptionInput): Promise<Subscription> => {
  // Check if user and route exist
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const route = await prisma.route.findUnique({ where: { id: data.routeId } });
  if (!route) {
    throw new NotFoundError('Route not found');
  }

  // Create the subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId: data.userId,
      routeId: data.routeId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyCharge: data.monthlyCharge,
    },
  });

  return subscription;
};

export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: true,
      route: true,
    },
  });

  if (!subscription) {
    throw new NotFoundError('Subscription not found');
  }

  return subscription;
};

export const updateSubscription = async (id: number, data: SubscriptionUpdateInput): Promise<Subscription> => {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new NotFoundError('Subscription not found');
  }

  return await prisma.subscription.update({
    where: { id },
    data: {
      routeId: data.routeId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyCharge: data.monthlyCharge,
      status: data.status,
    },
  });
};

export const deleteSubscription = async (id: number): Promise<Subscription> => {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new NotFoundError('Subscription not found');
  }

  return await prisma.subscription.delete({ where: { id } });
};

export const getAllSubscriptions = async (): Promise<Subscription[]> => {
  return await prisma.subscription.findMany({
    include: {
      user: true,
      route: true,
    },
  });
};

export const searchSubscriptions = async (options: {
  userId?: number;
  routeId?: number;
  status?: SubscriptionStatus;
  date?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<Subscription[]> => {
  const { userId, routeId, status, date, sortBy, sortOrder } = options;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }

  if (routeId) {
    where.routeId = routeId;
  }

  if (status) {
    where.status = status;
  }

  if (date) {
    where.startDate = {
      lte: date,
    };
    where.endDate = {
      gte: date,
    };
  }

  const orderBy: any = {};
  if (sortBy && sortOrder) {
    orderBy[sortBy] = sortOrder;
  }

  return await prisma.subscription.findMany({
    where,
    include: {
      user: true,
      route: true,
    },
    orderBy,
  });
};