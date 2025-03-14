import { Request, Response } from 'express';
import * as userService from './user.service';
import { validationResult } from 'express-validator';
import { Role } from '@prisma/client';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password, designation, contactNumber, role } = req.body;

    // Create user
    const user = await userService.createUser({
      name,
      email,
      password,
      designation,
      contactNumber,
      role: role as Role,
    });

    // Generate token
    const token = userService.generateToken(user.id);

    // Send response
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
      },
      token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Authenticate user
    const user = await userService.authenticateUser(email, password);

    // Generate token
    const token = userService.generateToken(user.id);

    // Send response
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
      },
      token,
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure req.user exists (already checked by authenticate middleware)
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Fetch user profile
    const user = await userService.getUserById(req.user.id);

    // Send response
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure req.user exists (already checked by authenticate middleware)
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { name, contactNumber, designation } = req.body;

    // Update user profile
    const updatedUser = await userService.updateUser(req.user.id, {
      name,
      contactNumber,
      designation,
    });

    // Send response
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all users
    const users = await userService.getAllUsers();

    // Send response
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};