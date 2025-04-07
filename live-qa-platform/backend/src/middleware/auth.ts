import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import SessionService from '../services/SessionService';

/**
 * Middleware to authenticate presenter using JWT
 * @param sessionService Service for session operations
 * @returns Express middleware function
 */
export const authenticatePresenter = (sessionService: SessionService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if authorization header exists
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'No token provided',
        });
        return;
      }
      
      // Check if token format is valid
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token format',
        });
        return;
      }
      
      const token = parts[1];
      
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
          sessionId: string;
          presenterToken: string;
        };
      } catch (error) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token',
        });
        return;
      }
      
      // Validate presenter token
      const isValid = await sessionService.validatePresenterToken(
        decoded.sessionId,
        decoded.presenterToken
      );
      
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid presenter token',
        });
        return;
      }
      
      // Add session info to request
      (req as any).session = {
        id: decoded.sessionId,
        presenterToken: decoded.presenterToken,
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Generate a JWT token for presenter
 * @param sessionId Session ID
 * @param presenterToken Presenter token
 * @returns JWT token
 */
export const generatePresenterToken = (
  sessionId: string,
  presenterToken: string
): string => {
  return jwt.sign(
    { sessionId, presenterToken },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );
};