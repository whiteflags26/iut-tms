import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as ticketService from './ticket.service';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { TicketStatus } from '@prisma/client';

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { tripId, userId, fare } = req.body;

    const ticket = await ticketService.createTicket({
      tripId,
      userId,
      fare,
    });

    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ message: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await ticketService.getTicketById(Number(id));
    res.status(200).json(ticket);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tripId, userId, fare, status } = req.body;

    const updatedTicket = await ticketService.updateTicket(Number(id), {
      tripId,
      userId,
      fare,
      status,
    });

    res.status(200).json({ message: 'Ticket updated successfully', ticket: updatedTicket });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await ticketService.deleteTicket(Number(id));
    res.status(200).json({ message: 'Ticket deleted successfully', ticket });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await ticketService.getAllTickets();
    res.status(200).json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tripId, userId, status, date, sortBy, sortOrder } = req.query;

    const tickets = await ticketService.searchTickets({
      tripId: tripId ? Number(tripId) : undefined,
      userId: userId ? Number(userId) : undefined,
      status: status as TicketStatus | undefined,
      date: date ? new Date(date as string) : undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.status(200).json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};