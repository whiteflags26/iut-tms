import { Request, Response } from 'express';
import * as userService from './user.service';
import { validationResult } from 'express-validator';
import { sendEmail } from '../../utils/mailer';  
import { Role } from '@prisma/client';
import { send } from 'node:process';

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
    sendEmail(email, "Welcome to Transport Management System", "You have successfully registered to Transport Management System. Your account is now active. You can now login to the system using your email and password. Thank you for registering with us.");

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
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

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
    const user = await userService.getUserById(Number(req.params.id));
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

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

    // Fetch user profile
    const user = await userService.getUserById(Number(req.params.id));
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update user profile
    const updatedUser = await userService.updateUser(Number(req.params.id), {
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

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, sortBy, sortOrder, role, designation } = req.query;

    // Convert query parameters to appropriate types
    const searchQuery = search as string | undefined;
    const sortByQuery = sortBy as string | undefined;
    const sortOrderQuery = sortOrder as 'asc' | 'desc' | undefined;
    const roleQuery = role as Role | undefined;
    const designationQuery = designation as string | undefined;

    // Fetch users with search, sort, and filter
    const users = await userService.searchUsers({
      search: searchQuery,
      sortBy: sortByQuery,
      sortOrder: sortOrderQuery,
      role: roleQuery,
      designation: designationQuery,
    });

    // Send response
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    // Ensure req.user exists (already checked by authenticate middleware)
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    // Check if user exists
    if ((req.user.role === "ADMIN" || req.user.role === "TRANSPORT_OFFICER") && Number(req.params.id) !== req.user.id) {
      const user = await userService.getUserById(Number(req.params.id));
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
    }
    const { password } = req.body;

    // Update user password
    await userService.changeUserPassword(Number(req.params.id), password);

    sendEmail(req.user.email, "Password Updated", "Your password has been updated successfully.");

    // Send response
    res.status(200).json({
      message: 'Password updated successfully -- add username to response',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
//edit
export const changeRole = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure req.user exists (already checked by authenticate middleware)
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Check if user exists
    const user = await userService.getUserById(Number(req.params.id));
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    

    const { role } = req.body;

    // Update user role
    const userData = await userService.changeUserRole(Number(req.params.id), role as Role);

    sendEmail(user.email, "Role Updated", `You have been updated successfully to ${role}.`);

    // Send response
    res.status(200).json({
      message: 'Role updated successfully',
      user: userData,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};