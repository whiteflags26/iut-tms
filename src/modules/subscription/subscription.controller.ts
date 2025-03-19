import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as subscriptionService from './subscription.service';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { SubscriptionStatus } from '@prisma/client';

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { userId, routeId, startDate, endDate, monthlyCharge } = req.body;

    const subscription = await subscriptionService.createSubscription({
      userId,
      routeId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      monthlyCharge,
    });

    res.status(201).json({ message: 'Subscription created successfully', subscription });
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getSubscriptionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(Number(id));
    res.status(200).json(subscription);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { routeId, startDate, endDate, monthlyCharge, status } = req.body;

    const updatedSubscription = await subscriptionService.updateSubscription(Number(id), {
      routeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      monthlyCharge,
      status,
    });

    res.status(200).json({ message: 'Subscription updated successfully', subscription: updatedSubscription });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.deleteSubscription(Number(id));
    res.status(200).json({ message: 'Subscription deleted successfully', subscription });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions();
    res.status(200).json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, routeId, status, date, sortBy, sortOrder } = req.query;

    const subscriptions = await subscriptionService.searchSubscriptions({
      userId: userId ? Number(userId) : undefined,
      routeId: routeId ? Number(routeId) : undefined,
      status: status as SubscriptionStatus | undefined,
      date: date ? new Date(date as string) : undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.status(200).json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};