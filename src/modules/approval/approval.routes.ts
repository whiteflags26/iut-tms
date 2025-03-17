import express from 'express';
import * as approvalController from './approval.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Routes for approval management
router.post('/:approvalId/process', authenticate, approvalController.processApproval);
router.get('/pending', authenticate, approvalController.getPendingApprovalsForUser);
router.get('/:id', authenticate, approvalController.getApprovalById);
router.post('/', authenticate, approvalController.createApproval);
router.delete('/:id', authenticate, authorize(Role.ADMIN), approvalController.deleteApproval);

export default router;