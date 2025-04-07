import QuestionRepository from '../repositories/QuestionRepository';
import VoteRepository from '../repositories/VoteRepository';
import { IQuestion } from '../models/Question';

/**
 * Service for managing questions and votes
 */
export default class QuestionService {
  private questionRepository: QuestionRepository;
  private voteRepository: VoteRepository;

  /**
   * Create a new QuestionService
   * @param questionRepository Repository for question operations
   * @param voteRepository Repository for vote operations
   */
  constructor(
    questionRepository: QuestionRepository,
    voteRepository: VoteRepository
  ) {
    this.questionRepository = questionRepository;
    this.voteRepository = voteRepository;
  }

  /**
   * Create a new question
   * @param sessionId Session ID
   * @param authorName Author name
   * @param text Question text
   * @param media Optional media attachments
   * @returns Created question
   */
  async createQuestion(
    sessionId: string,
    authorName: string,
    text: string,
    media?: any[]
  ): Promise<IQuestion> {
    // Create a new question
    const question = await this.questionRepository.create({
      sessionId,
      authorName,
      text,
      isAnswered: false,
      votes: { up: 0, down: 0 },
      media,
    });

    return question;
  }

  /**
   * Get questions by session ID
   * @param sessionId Session ID
   * @returns Array of questions
   */
  async getQuestionsBySessionId(sessionId: string): Promise<IQuestion[]> {
    return this.questionRepository.findBySessionId(sessionId);
  }

  /**
   * Mark a question as answered
   * @param questionId Question ID
   * @returns Updated question or null
   */
  async markQuestionAsAnswered(questionId: string): Promise<IQuestion | null> {
    return this.questionRepository.markAsAnswered(questionId);
  }

  /**
   * Vote on a question
   * @param questionId Question ID
   * @param voterName Voter name
   * @param type Vote type (up/down)
   * @returns Updated question or null
   */
  async voteOnQuestion(
    questionId: string,
    voterName: string,
    type: 'up' | 'down'
  ): Promise<IQuestion | null> {
    // Toggle the vote
    await this.voteRepository.toggleVote(questionId, voterName, type);

    // Count the votes
    const upVotes = await this.voteRepository.countUpVotes(questionId);
    const downVotes = await this.voteRepository.countDownVotes(questionId);

    // Update the question with the new vote counts
    return this.questionRepository.updateVotes(questionId, upVotes, downVotes);
  }
}