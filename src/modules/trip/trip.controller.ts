import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as tripService from './trip.service';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { TripStatus } from '@prisma/client';

export const createTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { routeId, vehicleId, driverId, scheduledDateTime, availableSeats } = req.body;

    const trip = await tripService.createTrip({
      routeId,
      vehicleId,
      driverId,
      scheduledDateTime: new Date(scheduledDateTime),
      availableSeats,
    });

    res.status(201).json({ message: 'Trip created successfully', trip });
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getTripById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const trip = await tripService.getTripById(Number(id));
    res.status(200).json(trip);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { routeId, vehicleId, driverId, scheduledDateTime, availableSeats, status } = req.body;

    const updatedTrip = await tripService.updateTrip(Number(id), {
      routeId,
      vehicleId,
      driverId,
      scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : undefined,
      availableSeats,
      status,
    });

    res.status(200).json({ message: 'Trip updated successfully', trip: updatedTrip });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const trip = await tripService.deleteTrip(Number(id));
    res.status(200).json({ message: 'Trip deleted successfully', trip });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const trips = await tripService.getAllTrips();
    res.status(200).json(trips);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { routeId, vehicleId, driverId, status, date, sortBy, sortOrder } = req.query;

    const trips = await tripService.searchTrips({
      routeId: routeId ? Number(routeId) : undefined,
      vehicleId: vehicleId ? Number(vehicleId) : undefined,
      driverId: driverId ? Number(driverId) : undefined,
      status: status as TripStatus | undefined,
      date: date ? new Date(date as string) : undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.status(200).json(trips);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};