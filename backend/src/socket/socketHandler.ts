import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export function initializeSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('JWT_SECRET not configured'));
      }

      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
        role: string;
        facilityId?: string;
      };

      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info('Socket connected', { userId: user.userId, email: user.email });

    // Join facility room for real-time updates
    if (user.facilityId) {
      socket.join(`facility:${user.facilityId}`);
    }

    // Join user-specific room
    socket.join(`user:${user.userId}`);

    // Handle triage updates
    socket.on('triage:subscribe', (triageId: string) => {
      socket.join(`triage:${triageId}`);
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId: user.userId });
    });
  });

  logger.info('Socket.IO initialized');
}

