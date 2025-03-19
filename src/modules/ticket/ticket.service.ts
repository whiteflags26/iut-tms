import { PrismaClient, Ticket, TicketStatus, User, Trip } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';

const prisma = new PrismaClient();

interface TicketInput {
  tripId: number;
  userId: number;
  fare: number;
}

interface TicketUpdateInput {
  tripId?: number;
  userId?: number;
  fare?: number;
  status?: TicketStatus;
}

export const createTicket = async (data: TicketInput): Promise<Ticket> => {
  // Check if trip and user exist
  const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
  if (!trip) {
    throw new NotFoundError('Trip not found');
  }

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if there are available seats
  if (trip.availableSeats <= 0) {
    throw new BadRequestError('No available seats for this trip');
  }

  // Deduct fare from user's eWalletBalance
  if (user.eWalletBalance < data.fare) {
    throw new BadRequestError('Insufficient eWallet balance');
  }

  // Deduct fare from user's eWalletBalance
  await prisma.user.update({
    where: { id: data.userId },
    data: { eWalletBalance: user.eWalletBalance - data.fare },
  });

  // Create the ticket
  const ticket = await prisma.ticket.create({
    data: {
      tripId: data.tripId,
      userId: data.userId,
      fare: data.fare,
      status: 'CONFIRMED',
    },
  });

  // Update available seats in the trip
  await prisma.trip.update({
    where: { id: data.tripId },
    data: { availableSeats: trip.availableSeats - 1 },
  });

  return ticket;
};

export const getTicketById = async (id: number): Promise<Ticket> => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      trip: {
        include: {
          route: true,
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      },
      user: true,
    },
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  return ticket;
};

export const updateTicket = async (id: number, data: TicketUpdateInput): Promise<Ticket> => {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  return await prisma.ticket.update({
    where: { id },
    data: {
      tripId: data.tripId,
      userId: data.userId,
      fare: data.fare,
      status: data.status,
    },
  });
};

export const deleteTicket = async (id: number): Promise<Ticket> => {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  // Refund fare to user's eWalletBalance if the ticket is canceled
  if (ticket.status === 'CONFIRMED') {
    const user = await prisma.user.findUnique({ where: { id: ticket.userId } });
    if (user) {
      await prisma.user.update({
        where: { id: ticket.userId },
        data: { eWalletBalance: user.eWalletBalance + ticket.fare },
      });
    }

    // Increment available seats in the trip
    const trip = await prisma.trip.findUnique({ where: { id: ticket.tripId } });
    if (trip) {
      await prisma.trip.update({
        where: { id: ticket.tripId },
        data: { availableSeats: trip.availableSeats + 1 },
      });
    }
  }

  return await prisma.ticket.delete({ where: { id } });
};

export const getAllTickets = async (): Promise<Ticket[]> => {
  return await prisma.ticket.findMany({
    include: {
      trip: {
        include: {
          route: true,
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      },
      user: true,
    },
  });
};

export const searchTickets = async (options: {
  tripId?: number;
  userId?: number;
  status?: TicketStatus;
  date?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<Ticket[]> => {
  const { tripId, userId, status, date, sortBy, sortOrder } = options;

  const where: any = {};

  if (tripId) {
    where.tripId = tripId;
  }

  if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (date) {
    where.bookingDateTime = {
      gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
      lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0),
    };
  }

  const orderBy: any = {};
  if (sortBy && sortOrder) {
    orderBy[sortBy] = sortOrder;
  }

  return await prisma.ticket.findMany({
    where,
    include: {
      trip: {
        include: {
          route: true,
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      },
      user: true,
    },
    orderBy,
  });
};