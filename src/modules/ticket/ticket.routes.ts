import express from 'express';
import { body } from 'express-validator';
import * as ticketController from './ticket.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

const createTicketValidation = [
  body('tripId').isInt().withMessage('Trip ID must be an integer'),
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('fare').isFloat({ min: 0 }).withMessage('Fare must be a positive number'),
];

const updateTicketValidation = [
  body('tripId').optional().isInt().withMessage('Trip ID must be an integer'),
  body('userId').optional().isInt().withMessage('User ID must be an integer'),
  body('fare').optional().isFloat({ min: 0 }).withMessage('Fare must be a positive number'),
  body('status').optional().isIn(['CONFIRMED', 'CANCELED']).withMessage('Invalid status'),
];

router.post(
  '/',
  authenticate,
  authorize(Role.USER, Role.ADMIN),
  createTicketValidation,
  ticketController.createTicket
);

router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  ticketController.getAllTickets
);

router.get(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  ticketController.getTicketById
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  updateTicketValidation,
  ticketController.updateTicket
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  ticketController.deleteTicket
);

router.get(
  '/search/query',
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  ticketController.searchTickets
);

export default router;