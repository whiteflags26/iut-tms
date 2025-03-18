import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config/auth.config';

const prisma = new PrismaClient();

interface UserInput {
  name: string;
  email: string;
  password: string;
  designation: string;
  contactNumber: string;
  role?: Role;
}

interface UserUpdateInput {
  name?: string;
  designation?: string;
  contactNumber?: string;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  designation: string;
  contactNumber: string;
  role: Role;
  eWalletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export const createUser = async (userData: UserInput): Promise<User> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(
    userData.password, 
    config.bcrypt.saltRounds
  );

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      passwordHash,
      designation: userData.designation,
      contactNumber: userData.contactNumber,
      role: userData.role || 'USER',
    },
  });

  return user;
};

export const authenticateUser = async (email: string, password: string): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

export const getUserById = async (id: number): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      contactNumber: true,
      role: true,
      eWalletBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const updateUser = async (id: number, userData: UserUpdateInput): Promise<SafeUser> => {
  const user = await prisma.user.update({
    where: { id },
    data: userData,
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      contactNumber: true,
      role: true,
      eWalletBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const getAllUsers = async (): Promise<SafeUser[]> => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      contactNumber: true,
      role: true,
      eWalletBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const generateToken = (id: number): string => {
  return jwt.sign({ id }, config.jwt.secret as jwt.Secret, {
    expiresIn: '5h', // Ensure this is a valid string or number
  });
};

interface SearchOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: Role;
  designation?: string;
}

export const searchUsers = async (options: SearchOptions): Promise<SafeUser[]> => {
  const { search, sortBy, sortOrder, role, designation } = options;

  const users = await prisma.user.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { designation: { contains: search, mode: 'insensitive' } },
                { contactNumber: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        role ? { role } : {},
        designation ? { designation } : {},
      ],
    },
    orderBy: sortBy
      ? {
          [sortBy]: sortOrder || 'asc',
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      contactNumber: true,
      role: true,
      eWalletBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return users;
};

export const changeUserPassword = async (
  userId: number, 
  newPassword: string
): Promise<void> => {
  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
  
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
    select: { name: true },
  });
  
  // Return void since we don't need to expose password-related fields
};

const isValidEnum = (value: string): value is Role => {
  return Object.values(Role).includes(value as Role);
};

export const changeUserRole = async (id: number, userRole: Role): Promise<SafeUser> => {
  if(!isValidEnum(userRole)) {
    throw new Error('Invalid role');
  }
  const user = await prisma.user.update({
    where: { id },
    data: { role: userRole },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      contactNumber: true,
      role: true,
      eWalletBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};