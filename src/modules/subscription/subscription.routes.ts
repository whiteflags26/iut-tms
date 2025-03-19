import express from 'express';
import { body } from 'express-validator';
import * as subscriptionController from './subscription.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

const createSubscriptionValidation = [
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('routeId').isInt().withMessage('Route ID must be an integer'),
  body('startDate').isISO8601().withMessage('Invalid date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid date format'),
  body('monthlyCharge').isFloat({ min: 0 }).withMessage('Monthly charge must be a positive number'),
];

const updateSubscriptionValidation = [
  body('routeId').optional().isInt().withMessage('Route ID must be an integer'),
  body('startDate').optional().isISO8601().withMessage('Invalid date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid date format'),
  body('monthlyCharge').optional().isFloat({ min: 0 }).withMessage('Monthly charge must be a positive number'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
];

router.post(
  '/',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  createSubscriptionValidation,
  subscriptionController.createSubscription
);

router.get(
  '/',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  subscriptionController.getAllSubscriptions
);

router.get(
  '/:id',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  subscriptionController.getSubscriptionById
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  updateSubscriptionValidation,
  subscriptionController.updateSubscription
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  subscriptionController.deleteSubscription
);

router.get(
  '/search/query',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  subscriptionController.searchSubscriptions
);

export default router;