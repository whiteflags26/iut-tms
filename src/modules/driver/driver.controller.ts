import { Request, Response } from 'express';
import * as driverService from '../driver/driver.service';
import { validationResult } from 'express-validator';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import * as userService from '../user/user.service';
import { sendEmail } from '../../utils/mailer';  


export const createDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { userId, licenseNumber, status } = req.body;

    // Create driver
    const driver = await driverService.createDriver({ userId, licenseNumber, status });
    const user = await userService.getUserById(userId);

    sendEmail(user.email, "Welcome to Transport Management System", "You have successfully registered as a driver in Transport Management System. Your account is now active. You can now login to the system using your email and password. Thank you for registering with us.");

    // Send response
    res.status(201).json({
      message: 'Driver created successfully',
      driver,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      res.status(error instanceof NotFoundError ? 404 : 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { licenseNumber, status } = req.body;

    // Update driver
    const updatedDriver = await driverService.updateDriver(Number(id), { licenseNumber, status });

    // Send response
    res.status(200).json({
      message: 'Driver updated successfully',
      driver: updatedDriver,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getDriverById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch driver by ID
    const driver = await driverService.getDriverById(Number(id));

    // Send response
    res.status(200).json(driver);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all drivers
    const drivers = await driverService.getAllDrivers();

    // Send response
    res.status(200).json(drivers);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId, startDate, endDate, reason } = req.body;

    // Create leave request
    const leaveRequest = await driverService.createLeaveRequest({ driverId, startDate, endDate, reason });

    // Send response
    res.status(201).json({
      message: 'Leave request created successfully',
      leaveRequest,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateLeaveRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Update leave request status
    const updatedLeaveRequest = await driverService.updateLeaveRequestStatus(Number(id), status);

    // Send response
    res.status(200).json({
      message: 'Leave request status updated successfully',
      leaveRequest: updatedLeaveRequest,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const createDriverRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId, userId, rating, comment } = req.body;

    // Create driver rating
    const driverRating = await driverService.createDriverRating({ driverId, userId, rating, comment });

    // Send response
    res.status(201).json({
      message: 'Driver rating created successfully',
      driverRating,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getDriverRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;

    // Fetch driver ratings
    const ratings = await driverService.getDriverRatings(Number(driverId));

    // Send response
    res.status(200).json(ratings);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};