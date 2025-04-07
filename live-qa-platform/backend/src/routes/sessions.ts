import { Router } from 'express';
import SessionController from '../controllers/SessionController';
import SessionService from '../services/SessionService';
import SessionRepository from '../repositories/SessionRepository';
import { validateCreateSession, validateSessionParams } from '../middleware/validator';
import { authenticatePresenter } from '../middleware/auth';

// Create router
const router = Router();

// Create dependencies
const sessionRepository = new SessionRepository();
const sessionService = new SessionService(sessionRepository);
const sessionController = new SessionController(sessionService);

// Create session
router.post(
  '/',
  validateCreateSession,
  sessionController.createSession.bind(sessionController)
);

// Get session by URL
router.get(
  '/:url',
  validateSessionParams,
  sessionController.getSessionByUrl.bind(sessionController)
);

// End session
router.delete(
  '/:id',
  authenticatePresenter(sessionService),
  sessionController.endSession.bind(sessionController)
);

export default router;