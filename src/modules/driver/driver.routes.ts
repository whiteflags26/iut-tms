import express from 'express';
import { body } from 'express-validator';
import * as driverController from './driver.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Validation for creating a driver
const createDriverValidation = [
  body('userId').isInt().withMessage('User ID must be a valid integer'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('status').optional().isIn(['ACTIVE', 'ON_LEAVE', 'INACTIVE']).withMessage('Invalid status'),
];

// Validation for creating a leave request
const createLeaveRequestValidation = [
  body('driverId').isInt().withMessage('Driver ID must be a valid integer'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

// Validation for creating a driver rating
const createDriverRatingValidation = [
  body('driverId').isInt().withMessage('Driver ID must be a valid integer'),
  body('userId').isInt().withMessage('User ID must be a valid integer'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('Comment must be a string'),
];

// Routes
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  createDriverValidation,
  driverController.createDriver,
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  createDriverValidation,
  driverController.updateDriver,
);

router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  driverController.getAllDrivers,
);

router.get(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  driverController.getDriverById,
);

router.post(
  '/leave-requests',
  authenticate,
  authorize(Role.DRIVER),
  createLeaveRequestValidation,
  driverController.createLeaveRequest,
);

router.put(
  '/leave-requests/:id',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  driverController.updateLeaveRequestStatus,
);

router.post(
  '/ratings',
  authenticate,
  createDriverRatingValidation,
  driverController.createDriverRating,
);

router.get(
  '/:driverId/ratings',
  authenticate,
  driverController.getDriverRatings,
);

export default router;