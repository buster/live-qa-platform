import { Request, Response, NextFunction } from 'express';
import QuestionService from '../services/QuestionService';

/**
 * Controller for question-related endpoints
 */
export default class QuestionController {
  private questionService: QuestionService;

  /**
   * Create a new QuestionController
   * @param questionService Service for question operations
   */
  constructor(questionService: QuestionService) {
    this.questionService = questionService;
  }

  /**
   * Create a new question
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, authorName, text, media } = req.body;
      
      const question = await this.questionService.createQuestion(
        sessionId,
        authorName,
        text,
        media
      );
      
      res.status(201).json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get questions by session ID
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async getQuestionsBySessionId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const questions = await this.questionService.getQuestionsBySessionId(sessionId);
      
      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a question as answered
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async markQuestionAsAnswered(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const question = await this.questionService.markQuestionAsAnswered(id);
      
      if (!question) {
        res.status(404).json({
          success: false,
          error: 'Question not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vote on a question
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async voteOnQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { voterName, voteType } = req.body;
      
      const question = await this.questionService.voteOnQuestion(
        id,
        voterName,
        voteType
      );
      
      if (!question) {
        res.status(404).json({
          success: false,
          error: 'Question not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }
}