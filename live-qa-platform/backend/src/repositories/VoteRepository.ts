import BaseRepository from './BaseRepository';
import Vote, { IVote } from '../models/Vote';

/**
 * Repository for Vote operations
 */
export default class VoteRepository extends BaseRepository<IVote> {
  constructor() {
    super(Vote);
  }

  /**
   * Find votes by question ID
   * @param questionId Question ID
   * @returns Array of votes
   */
  async findByQuestionId(questionId: string): Promise<IVote[]> {
    return this.find({ questionId });
  }

  /**
   * Find vote by question ID and voter name
   * @param questionId Question ID
   * @param voterName Voter name
   * @returns Found vote or null
   */
  async findByQuestionIdAndVoterName(questionId: string, voterName: string): Promise<IVote | null> {
    return this.findOne({ questionId, voterName });
  }

  /**
   * Count up votes for a question
   * @param questionId Question ID
   * @returns Count of up votes
   */
  async countUpVotes(questionId: string): Promise<number> {
    return this.count({ questionId, type: 'up' });
  }

  /**
   * Count down votes for a question
   * @param questionId Question ID
   * @returns Count of down votes
   */
  async countDownVotes(questionId: string): Promise<number> {
    return this.count({ questionId, type: 'down' });
  }

  /**
   * Toggle vote type (up/down) for a question by a voter
   * @param questionId Question ID
   * @param voterName Voter name
   * @param type New vote type
   * @returns Updated vote or null
   */
  async toggleVote(questionId: string, voterName: string, type: 'up' | 'down'): Promise<IVote | null> {
    const existingVote = await this.findByQuestionIdAndVoterName(questionId, voterName);
    
    if (existingVote) {
      // If the vote type is the same, remove the vote
      if (existingVote.type === type) {
        // Use the Document's id getter method
        await this.deleteById(existingVote.id);
        return null;
      }
      
      // Otherwise, update the vote type
      // Use the Document's id getter method
      return this.updateById(existingVote.id, { type });
    }
    
    // If no vote exists, create a new one
    return this.create({ questionId, voterName, type });
  }
}