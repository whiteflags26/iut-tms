import express from "express";
import { body } from "express-validator";
import * as vehicleController from "./vehicle.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

// Validation for creating a vehicle
const createVehicleValidation = [
  body("registrationNumber")
    .notEmpty()
    .withMessage("Registration number is required"),
  body("type").notEmpty().withMessage("Vehicle type is required"),
  body("capacity")
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),
  body("status")
    .optional()
    .isIn(["ACTIVE", "UNDER_MAINTENANCE", "INACTIVE"])
    .withMessage("Invalid status"),
];

// Validation for updating a vehicle
const updateVehicleValidation = [
  body("type")
    .optional()
    .notEmpty()
    .withMessage("Vehicle type cannot be empty"),
  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),
  body("status")
    .optional()
    .isIn(["ACTIVE", "UNDER_MAINTENANCE", "INACTIVE"])
    .withMessage("Invalid status"),
];

// Validation for changing vehicle status
const changeVehicleStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["ACTIVE", "UNDER_MAINTENANCE", "INACTIVE"])
    .withMessage("Invalid status"),
];

// Routes
router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  createVehicleValidation,
  vehicleController.createVehicle
);

router.put(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  updateVehicleValidation,
  vehicleController.updateVehicle
);

router.get(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  vehicleController.getAllVehicles
);

router.get(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  vehicleController.getVehicleById
);

router.get(
  "/search/query",
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  vehicleController.searchVehicles
);

router.put(
  "/:id/status",
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  changeVehicleStatusValidation,
  vehicleController.changeVehicleStatus
);

router.get(
  "/:id/history",
  authenticate,
  authorize(Role.ADMIN, Role.TRANSPORT_OFFICER),
  vehicleController.getVehicleHistory
);

export default router;
