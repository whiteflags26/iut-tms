import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient, User, Role, Department } from '@prisma/client';
import config from '../config/auth.config';

const prisma = new PrismaClient();

// Define User interface for req.user
export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: Department;
  designation: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface User extends UserPayload {}
  }
}

// Configure JWT strategy for Passport
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
};

// Initialize Passport with JWT strategy
export const initializePassport = (): void => {
  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            designation: true,
            department: true,
          },
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: UserPayload) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - Invalid or expired token' });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Authorization middleware
export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return; // Ensure the function exits after sending the response
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied: ${req.user.role} role is not authorized for this resource`,
      });
      return; // Ensure the function exits after sending the response
    }

    next(); // Proceed to the next middleware or route handler
  };
};


export const validateUserAccess = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return; // Ensure the function exits after sending the response
    }

    console.log(req.params);
    if (!roles.includes(req.user.role) && req.user.id !== Number(req.params.id)) {
      res.status(403).json({
        message: `Access denied: ${req.user.role} role is not authorized for this resource`,
      });
      return; // Ensure the function exits after sending the response
    }

    next(); // Proceed to the next middleware or route handler
  };
};