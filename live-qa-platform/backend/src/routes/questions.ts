import { Router } from 'express';
import QuestionController from '../controllers/QuestionController';
import QuestionService from '../services/QuestionService';
import QuestionRepository from '../repositories/QuestionRepository';
import VoteRepository from '../repositories/VoteRepository';
import { authenticatePresenter } from '../middleware/auth';
import SessionService from '../services/SessionService';
import SessionRepository from '../repositories/SessionRepository';

// Create router
const router = Router();

// Create dependencies
const questionRepository = new QuestionRepository();
const voteRepository = new VoteRepository();
const questionService = new QuestionService(questionRepository, voteRepository);
const sessionRepository = new SessionRepository();
const sessionService = new SessionService(sessionRepository);
const questionController = new QuestionController(questionService);

// Create question
router.post(
  '/',
  questionController.createQuestion.bind(questionController)
);

// Get questions by session ID
router.get(
  '/session/:sessionId',
  questionController.getQuestionsBySessionId.bind(questionController)
);

// Mark question as answered
router.patch(
  '/:id/answer',
  authenticatePresenter(sessionService),
  questionController.markQuestionAsAnswered.bind(questionController)
);

// Vote on question
router.post(
  '/:id/vote',
  questionController.voteOnQuestion.bind(questionController)
);

export default router;