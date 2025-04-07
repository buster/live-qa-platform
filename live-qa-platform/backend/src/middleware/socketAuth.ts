import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import SessionService from '../services/SessionService';
import SessionRepository from '../repositories/SessionRepository';

/**
 * Middleware for authenticating WebSocket connections
 * @param socket Socket instance
 * @param next Next function
 */
export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;

    // If no token is provided, allow connection (for participants)
    if (!token) {
      return next();
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        sessionId: string;
        presenterToken: string;
      };

      // Validate presenter token
      const sessionRepository = new SessionRepository();
      const sessionService = new SessionService(sessionRepository);
      const isValid = await sessionService.validatePresenterToken(
        decoded.sessionId,
        decoded.presenterToken
      );

      if (!isValid) {
        return next(new Error('Invalid presenter token'));
      }

      // Add session info to socket
      (socket as any).session = {
        id: decoded.sessionId,
        presenterToken: decoded.presenterToken,
        isPresenter: true,
      };

      return next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    return next(error as Error);
  }
};

/**
 * Check if socket is authenticated as presenter
 * @param socket Socket instance
 * @returns True if socket is authenticated as presenter, false otherwise
 */
export const isPresenter = (socket: Socket): boolean => {
  return !!(socket as any).session?.isPresenter;
};

/**
 * Get session ID from socket
 * @param socket Socket instance
 * @returns Session ID or null
 */
export const getSessionId = (socket: Socket): string | null => {
  return (socket as any).session?.id || null;
};