import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as requisitionService from './requistion.service';
import { RequestStatus } from '@prisma/client';

export const createRequisition = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { 
      purpose, 
      placesToVisit,
      placeToPickup, 
      numberOfPassengers, 
      dateTimeRequired, 
      contactPersonNumber 
    } = req.body;

    // Create requisition
    const requisition = await requisitionService.createRequisition({
      userId: req.user.id,
      purpose,
      placesToVisit,
      placeToPickup,
      numberOfPassengers: parseInt(numberOfPassengers),
      dateTimeRequired: new Date(dateTimeRequired),
      contactPersonNumber,
    });

    // Send response
    res.status(201).json({
      message: 'Requisition created successfully',
      requisition,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRequisitionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const requisition = await requisitionService.getRequisitionById(id);
    
    // Check if the user has permission to view this requisition
    // Only the owner, ADMIN, or TRANSPORT_OFFICER can view requisitions
    if (
      requisition.userId !== req.user.id && 
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'TRANSPORT_OFFICER' &&
      req.user.role !== 'HOD' &&
      req.user.role !== 'TRANSPORT_COMMITTEE_CHAIRMAN' &&
      req.user.role !== 'VC'
    ) {
      res.status(403).json({ message: 'Forbidden - You do not have permission to view this requisition' });
      return;
    }

    res.status(200).json(requisition);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getMyRequisitions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const requisitions = await requisitionService.getRequisitionsByUserId(req.user.id);
    res.status(200).json(requisitions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllRequisitions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated and has permission
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Only ADMIN or TRANSPORT_OFFICER can view all requisitions
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TRANSPORT_OFFICER') {
      res.status(403).json({ message: 'Forbidden - You do not have permission to view all requisitions' });
      return;
    }

    const requisitions = await requisitionService.getAllRequisitions();
    res.status(200).json(requisitions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRequisition = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get the requisition
    const requisition = await requisitionService.getRequisitionById(id);
    
    // Check if the user has permission to update this requisition
    // Only the owner can update their own requisition, and only if it's still pending
    if (
      requisition.userId !== req.user.id && 
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'TRANSPORT_OFFICER'
    ) {
      res.status(403).json({ message: 'Forbidden - You do not have permission to update this requisition' });
      return;
    }

    // Regular users can only update pending requisitions
    if (requisition.userId === req.user.id && requisition.status !== RequestStatus.PENDING) {
      res.status(400).json({ message: 'Cannot update a requisition that is not pending' });
      return;
    }

    const { 
      purpose, 
      placesToVisit, 
      placeToPickup,
      numberOfPassengers, 
      dateTimeRequired, 
      contactPersonNumber 
    } = req.body;

    // Update requisition
    const updatedRequisition = await requisitionService.updateRequisition(id, {
      purpose,
      placesToVisit,
      placeToPickup,
      numberOfPassengers: numberOfPassengers ? parseInt(numberOfPassengers) : undefined,
      dateTimeRequired: dateTimeRequired ? new Date(dateTimeRequired) : undefined,
      contactPersonNumber,
    });

    // Send response
    res.status(200).json({
      message: 'Requisition updated successfully',
      requisition: updatedRequisition,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRequisition = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get the requisition
    const requisition = await requisitionService.getRequisitionById(id);
    
    // Check if the user has permission to delete this requisition
    // Only the owner or ADMIN can delete a requisition
    if (requisition.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden - You do not have permission to delete this requisition' });
      return;
    }

    // Regular users can only delete pending requisitions
    if (requisition.userId === req.user.id && requisition.status !== RequestStatus.PENDING) {
      res.status(400).json({ message: 'Cannot delete a requisition that is not pending' });
      return;
    }

    await requisitionService.deleteRequisition(id);

    // Send response
    res.status(200).json({
      message: 'Requisition deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const searchRequisitions = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      purpose,
      placesToVisit,
      placeToPickup,
      numberOfPassengers,
      minPassengers,
      maxPassengers,
      dateTimeRequired,
      startDate,
      endDate,
      contactPersonNumber,
      sortBy,
      sortOrder,
    } = req.query;

    // Convert query parameters to appropriate types
    const userIdQuery = userId ? parseInt(userId as string) : undefined;
    const purposeQuery = purpose as string | undefined;
    const placesToVisitQuery = placesToVisit as string | undefined;
    const placeToPickupQuery = placeToPickup as string | undefined;
    const numberOfPassengersQuery = numberOfPassengers ? parseInt(numberOfPassengers as string) : undefined;
    const minPassengersQuery = minPassengers ? parseInt(minPassengers as string) : undefined;
    const maxPassengersQuery = maxPassengers ? parseInt(maxPassengers as string) : undefined;
    const dateTimeRequiredQuery = dateTimeRequired ? new Date(dateTimeRequired as string) : undefined;
    const startDateQuery = startDate ? new Date(startDate as string) : undefined;
    const endDateQuery = endDate ? new Date(endDate as string) : undefined;
    const contactPersonNumberQuery = contactPersonNumber as string | undefined;
    const sortByQuery = sortBy as string | undefined;
    const sortOrderQuery = sortOrder as 'asc' | 'desc' | undefined;

    const requisitions = await requisitionService.searchRequisitions({
      userId: userIdQuery,
      purpose: purposeQuery,
      placesToVisit: placesToVisitQuery,
      placeToPickup: placeToPickupQuery,
      numberOfPassengers: numberOfPassengersQuery,
      minPassengers: minPassengersQuery,
      maxPassengers: maxPassengersQuery,
      dateTimeRequired: dateTimeRequiredQuery,
      startDate: startDateQuery,
      endDate: endDateQuery,
      contactPersonNumber: contactPersonNumberQuery,
      sortBy: sortByQuery,
      sortOrder: sortOrderQuery,
    });

    res.status(200).json(requisitions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignVehicleAndDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const requisitionId = parseInt(req.params.id);
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Only TRANSPORT_OFFICER or ADMIN can assign vehicle and driver
    if (req.user.role !== 'TRANSPORT_OFFICER' && req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden - You do not have permission to assign vehicle and driver' });
      return;
    }

    const { vehicleId, driverId } = req.body;

    // Validate request body
    if (!vehicleId || !driverId) {
      res.status(400).json({ message: 'Vehicle ID and Driver ID are required' });
      return;
    }

    // Assign vehicle and driver
    const updatedRequisition = await requisitionService.assignVehicleAndDriver(
      requisitionId,
      parseInt(vehicleId),
      parseInt(driverId)
    );

    // Send response
    res.status(200).json({
      message: 'Vehicle and driver assigned successfully',
      requisition: updatedRequisition,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};