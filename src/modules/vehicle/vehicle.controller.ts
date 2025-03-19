import { Request, Response } from "express";
import { validationResult } from "express-validator";
import * as vehicleService from "./vehicle.service";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import { VehicleStatus } from "@prisma/client";

export const createVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { registrationNumber, type, capacity, status } = req.body;

    // Create vehicle
    const vehicle = await vehicleService.createVehicle({
      registrationNumber,
      type,
      capacity: parseInt(capacity),
      status,
    });

    // Send response
    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const updateVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, capacity, status } = req.body;

    // Update vehicle
    const updatedVehicle = await vehicleService.updateVehicle(Number(id), {
      type,
      capacity: capacity ? parseInt(capacity) : undefined,
      status,
    });

    // Send response
    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getVehicleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch vehicle by ID
    const vehicle = await vehicleService.getVehicleById(Number(id));

    // Send response
    res.status(200).json(vehicle);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getAllVehicles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all vehicles
    const vehicles = await vehicleService.getAllVehicles();

    // Send response
    res.status(200).json(vehicles);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchVehicles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, type, capacity, date, sortBy, sortOrder } = req.query;

    // Parse query parameters
    const statusQuery = status as VehicleStatus | undefined;
    const typeQuery = type as string | undefined;
    const capacityQuery = capacity ? parseInt(capacity as string) : undefined;
    const dateQuery = date ? new Date(date as string) : undefined;
    const sortByQuery = sortBy as string | undefined;
    const sortOrderQuery = sortOrder as "asc" | "desc" | undefined;

    // Fetch filtered and sorted vehicles
    const vehicles = await vehicleService.searchVehicles({
      status: statusQuery,
      type: typeQuery,
      capacity: capacityQuery,
      date: dateQuery,
      sortBy: sortByQuery,
      sortOrder: sortOrderQuery,
    });

    // Send response
    res.status(200).json(vehicles);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changeVehicleStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !Object.values(VehicleStatus).includes(status as VehicleStatus)
    ) {
      res.status(400).json({ message: "Valid status is required" });
      return;
    }

    // Change vehicle status
    const updatedVehicle = await vehicleService.changeVehicleStatus(
      Number(id),
      status as VehicleStatus
    );

    // Send response
    res.status(200).json({
      message: "Vehicle status updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      res
        .status(error instanceof NotFoundError ? 404 : 400)
        .json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getVehicleHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch vehicle history
    const history = await vehicleService.getVehicleHistory(Number(id));

    // Send response
    res.status(200).json(history);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
