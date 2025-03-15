import { Request, Response } from 'express';
import * as approvalService from './approval.service';
import { NotFoundError } from '../../utils/errors';

export const processApproval = async (req: Request, res: Response): Promise<void> => {
  try {
    const approvalId = parseInt(req.params.approvalId);
    const { status, comments } = req.body;

    // Validate status
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    // Update the approval status using the approval service
    await approvalService.processApproval(approvalId, status, comments);

    // Send response
    res.status(200).json({
      message: 'Approval processed successfully',
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

export const getPendingApprovalsForUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get pending approvals for the logged-in user based on their role
    const pendingApprovals = await approvalService.getPendingApprovalsForUser(
      req.user.id,
      req.user.role
    );

    res.status(200).json(pendingApprovals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getApprovalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const approvalId = parseInt(req.params.id);

    // Get approval by ID using the approval service
    const approval = await approvalService.getApprovalById(approvalId);

    res.status(200).json(approval);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

export const createApproval = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requisitionId, approverUserId, approverRole, comments } = req.body;

    // Create a new approval using the approval service
    const newApproval = await approvalService.createApproval({
      requisitionId,
      approverUserId,
      approverRole,
      comments,
    });

    res.status(201).json({
      message: 'Approval created successfully',
      approval: newApproval,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

export const deleteApproval = async (req: Request, res: Response): Promise<void> => {
  try {
    const approvalId = parseInt(req.params.id);

    // Delete the approval using the approval service
    const deletedApproval = await approvalService.deleteApproval(approvalId);

    res.status(200).json({
      message: 'Approval deleted successfully',
      approval: deletedApproval,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};