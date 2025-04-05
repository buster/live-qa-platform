import mongoose from 'mongoose';
import VoteRepository from '../../repositories/VoteRepository';
import Vote from '../../models/Vote';
import Database from '../../config/database';

// Mock the Vote model
jest.mock('../../models/Vote');

describe('VoteRepository', () => {
  let voteRepository: VoteRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    voteRepository = new VoteRepository();
  });

  describe('findByQuestionId', () => {
    it('should call find with the correct parameters', async () => {
      // Arrange
      const questionId = 'test-question-id';
      const findSpy = jest.spyOn(voteRepository, 'find');
      
      // Act
      await voteRepository.findByQuestionId(questionId);
      
      // Assert
      expect(findSpy).toHaveBeenCalledWith({ questionId });
    });
  });
});