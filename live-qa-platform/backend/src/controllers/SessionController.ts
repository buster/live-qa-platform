import { Request, Response, NextFunction } from 'express';
import SessionService from '../services/SessionService';

/**
 * Controller for session-related endpoints
 */
export default class SessionController {
  private sessionService: SessionService;

  /**
   * Create a new SessionController
   * @param sessionService Service for session operations
   */
  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  /**
   * Create a new session
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { presenterName } = req.body;
      const session = await this.sessionService.createSession(presenterName);
      
      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a session by URL
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async getSessionByUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.params;
      const session = await this.sessionService.getSessionByUrl(url);
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * End a session
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await this.sessionService.endSession(id);
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
}