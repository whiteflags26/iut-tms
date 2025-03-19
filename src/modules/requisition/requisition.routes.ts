import express from 'express';
import { body } from 'express-validator';
import * as requisitionController from './requisition.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Request validation
const requisitionValidation = [
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('placesToVisit').notEmpty().withMessage('Places to visit is required'),
  body('placeToPickup').notEmpty().withMessage('Place to pickup is required'), 
  body('numberOfPassengers')
    .isInt({ min: 1 })
    .withMessage('Number of passengers must be a positive integer'),
  body('dateTimeRequired')
    .isISO8601()
    .withMessage('Valid date and time is required'),
  body('contactPersonNumber')
    .notEmpty()
    .withMessage('Contact person number is required'),
];

// Update validation
const updateValidation = [
  body('purpose').optional().notEmpty().withMessage('Purpose cannot be empty'),
  body('placesToVisit').optional().notEmpty().withMessage('Places to visit cannot be empty'),
  body('placeToPickup').optional().notEmpty().withMessage('Place to pickup cannot be empty'), // New field
  body('numberOfPassengers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of passengers must be a positive integer'),
  body('dateTimeRequired')
    .optional()
    .isISO8601()
    .withMessage('Valid date and time is required'),
  body('contactPersonNumber')
    .optional()
    .notEmpty()
    .withMessage('Contact person number cannot be empty'),
];

// Assign vehicle and driver validation
const assignValidation = [
  body('vehicleId').isInt().withMessage('Vehicle ID must be an integer'),
  body('driverId').isInt().withMessage('Driver ID must be an integer'),
];

// Routes
router.post('/', authenticate, requisitionValidation, requisitionController.createRequisition);
router.get('/my-requisitions', authenticate, requisitionController.getMyRequisitions);
router.get('/all', authenticate, authorize(Role.ADMIN, Role.TRANSPORT_OFFICER, Role.HOD), requisitionController.getAllRequisitions);
router.get('/:id', authenticate, requisitionController.getRequisitionById);
router.put('/:id', authenticate, updateValidation, requisitionController.updateRequisition);
router.delete('/:id', authenticate, requisitionController.deleteRequisition);
router.post('/:id/assign', authenticate, authorize(Role.ADMIN, Role.TRANSPORT_OFFICER), assignValidation, requisitionController.assignVehicleAndDriver);
router.get('/search/query', authenticate, authorize(Role.ADMIN, Role.TRANSPORT_OFFICER, Role.HOD), requisitionController.searchRequisitions);

export default router;