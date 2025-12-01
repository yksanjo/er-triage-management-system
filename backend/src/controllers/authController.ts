import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role, facilityId } = req.body;

      if (!email || !password || !name || !role) {
        throw new AppError('Missing required fields', 400);
      }

      // Check if user exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('User already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, name, role, facility_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, email, name, role, facility_id, created_at`,
        [email, hashedPassword, name, role, facilityId || null]
      );

      const user = result.rows[0];

      // Generate token
      const token = this.generateToken(user.id, user.email, user.role, user.facility_id);

      logger.info('User registered', { userId: user.id, email, role });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            facilityId: user.facility_id,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Find user
      const result = await query(
        'SELECT id, email, password_hash, name, role, facility_id, is_active FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid credentials', 401);
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new AppError('Account is inactive', 403);
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate token
      const token = this.generateToken(user.id, user.email, user.role, user.facility_id);

      logger.info('User logged in', { userId: user.id, email });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            facilityId: user.facility_id,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('Token is required', 400);
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
        role: string;
        facilityId?: string;
      };

      // Verify user still exists
      const result = await query(
        'SELECT id, email, role, facility_id, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        throw new AppError('User not found or inactive', 401);
      }

      const user = result.rows[0];
      const newToken = this.generateToken(user.id, user.email, user.role, user.facility_id);

      res.json({
        success: true,
        data: { token: newToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting here if needed
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  private generateToken(userId: string, email: string, role: string, facilityId?: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(
      {
        userId,
        email,
        role,
        facilityId,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      }
    );
  }
}

