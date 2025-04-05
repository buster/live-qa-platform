import BaseRepository from './BaseRepository';
import Question, { IQuestion } from '../models/Question';

/**
 * Repository for Question operations
 */
export default class QuestionRepository extends BaseRepository<IQuestion> {
  constructor() {
    super(Question);
  }

  /**
   * Find questions by session ID
   * @param sessionId Session ID
   * @returns Array of questions
   */
  async findBySessionId(sessionId: string): Promise<IQuestion[]> {
    return this.find({ sessionId });
  }

  /**
   * Find unanswered questions by session ID
   * @param sessionId Session ID
   * @returns Array of unanswered questions
   */
  async findUnansweredBySessionId(sessionId: string): Promise<IQuestion[]> {
    return this.find({ sessionId, isAnswered: false });
  }

  /**
   * Mark a question as answered
   * @param id Question ID
   * @returns Updated question or null
   */
  async markAsAnswered(id: string): Promise<IQuestion | null> {
    return this.updateById(id, { isAnswered: true });
  }

  /**
   * Update question votes
   * @param id Question ID
   * @param upVotes Number of up votes
   * @param downVotes Number of down votes
   * @returns Updated question or null
   */
  async updateVotes(id: string, upVotes: number, downVotes: number): Promise<IQuestion | null> {
    return Question.findByIdAndUpdate(
      id,
      { $set: { 'votes.up': upVotes, 'votes.down': downVotes } },
      { new: true }
    );
  }

  /**
   * Increment up votes for a question
   * @param id Question ID
   * @returns Updated question or null
   */
  async incrementUpVotes(id: string): Promise<IQuestion | null> {
    return Question.findByIdAndUpdate(
      id,
      { $inc: { 'votes.up': 1 } },
      { new: true }
    );
  }

  /**
   * Increment down votes for a question
   * @param id Question ID
   * @returns Updated question or null
   */
  async incrementDownVotes(id: string): Promise<IQuestion | null> {
    return Question.findByIdAndUpdate(
      id,
      { $inc: { 'votes.down': 1 } },
      { new: true }
    );
  }

  /**
   * Decrement up votes for a question
   * @param id Question ID
   * @returns Updated question or null
   */
  async decrementUpVotes(id: string): Promise<IQuestion | null> {
    return Question.findByIdAndUpdate(
      id,
      { $inc: { 'votes.up': -1 } },
      { new: true }
    );
  }

  /**
   * Decrement down votes for a question
   * @param id Question ID
   * @returns Updated question or null
   */
  async decrementDownVotes(id: string): Promise<IQuestion | null> {
    return Question.findByIdAndUpdate(
      id,
      { $inc: { 'votes.down': -1 } },
      { new: true }
    );
  }
}