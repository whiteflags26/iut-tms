import express from 'express';
import { body } from 'express-validator';
import * as tripController from './trip.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

const createTripValidation = [
  body('routeId').isInt().withMessage('Route ID must be an integer'),
  body('vehicleId').isInt().withMessage('Vehicle ID must be an integer'),
  body('driverId').isInt().withMessage('Driver ID must be an integer'),
  body('scheduledDateTime').isISO8601().withMessage('Invalid date format'),
  body('availableSeats').isInt({ min: 1 }).withMessage('Available seats must be a positive integer'),
];

const updateTripValidation = [
  body('routeId').optional().isInt().withMessage('Route ID must be an integer'),
  body('vehicleId').optional().isInt().withMessage('Vehicle ID must be an integer'),
  body('driverId').optional().isInt().withMessage('Driver ID must be an integer'),
  body('scheduledDateTime').optional().isISO8601().withMessage('Invalid date format'),
  body('availableSeats').optional().isInt({ min: 1 }).withMessage('Available seats must be a positive integer'),
  body('status').optional().isIn(['BOOKED', 'CANCELED']).withMessage('Invalid status'),
];

router.post(
  '/',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  createTripValidation,
  tripController.createTrip
);

router.get(
  '/',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  tripController.getAllTrips
);

router.get(
  '/:id',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  tripController.getTripById
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  updateTripValidation,
  tripController.updateTrip
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  tripController.deleteTrip
);

router.get(
  '/search/query',
  authenticate,
  authorize(Role.TRANSPORT_OFFICER, Role.ADMIN),
  tripController.searchTrips
);

export default router;