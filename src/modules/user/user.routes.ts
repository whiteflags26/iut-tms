import express from 'express';
import { body } from 'express-validator';
import * as userController from './user.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Register validation
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('contactNumber').notEmpty().withMessage('Contact number is required'),
];

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, userController.register);
router.post('/login', loginValidation, userController.login);
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/', authenticate, authorize(Role.ADMIN, Role.TRANSPORT_OFFICER), userController.getAllUsers);
router.get('/search', authenticate, authorize(Role.ADMIN, Role.TRANSPORT_OFFICER), userController.searchUsers);
/**
 * Endpoint: /search
 * Method: GET
 * 
 * Description:
 * Searches, sorts, and filters users based on query parameters.
 * 
 * Query Parameters:
 * - `search`: Searches for users by name, email, designation, or contact number. (Example: `john`)
 * - `sortBy`: Sorts the results by a specific field (e.g., `name`, `email`, `createdAt`). (Example: `name`)
 * - `sortOrder`: Specifies the sort order (`asc` or `desc`). (Example: `asc`)
 * - `role`: Filters users by role (e.g., `USER`, `ADMIN`, `TRANSPORT_OFFICER`). (Example: `ADMIN`)
 * - `designation`: Filters users by designation (e.g., `Manager`, `Developer`). (Example: `Manager`)
 */


export default router;
