import mongoose from 'mongoose';
import QuestionRepository from '../../repositories/QuestionRepository';
import Question from '../../models/Question';
import Database from '../../config/database';

// Mock the Question model
jest.mock('../../models/Question');

describe('QuestionRepository', () => {
  let questionRepository: QuestionRepository;

  beforeAll(async () => {
    // Connect to a test database
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
    await Database.getInstance().connect();
  });

  afterAll(async () => {
    // Disconnect from the test database
    await Database.getInstance().disconnect();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    questionRepository = new QuestionRepository();
  });

  describe('findBySessionId', () => {
    it('should call find with the correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const findSpy = jest.spyOn(questionRepository, 'find');
      
      // Act
      await questionRepository.findBySessionId(sessionId);
      
      // Assert
      expect(findSpy).toHaveBeenCalledWith({ sessionId });
    });
  });

  describe('findUnansweredBySessionId', () => {
    it('should call find with the correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const findSpy = jest.spyOn(questionRepository, 'find');
      
      // Act
      await questionRepository.findUnansweredBySessionId(sessionId);
      
      // Assert
      expect(findSpy).toHaveBeenCalledWith({ sessionId, isAnswered: false });
    });
  });

  describe('markAsAnswered', () => {
    it('should call updateById with the correct parameters', async () => {
      // Arrange
      const questionId = 'test-question-id';
      const updateByIdSpy = jest.spyOn(questionRepository, 'updateById');
      
      // Act
      await questionRepository.markAsAnswered(questionId);
      
      // Assert
      expect(updateByIdSpy).toHaveBeenCalledWith(questionId, { isAnswered: true });
    });
  });

  describe('updateVotes', () => {
    it('should call findByIdAndUpdate with the correct parameters', async () => {
      // Arrange
      const questionId = 'test-question-id';
      const upVotes = 5;
      const downVotes = 2;
      
      // Mock the findByIdAndUpdate method
      const findByIdAndUpdateMock = jest.fn().mockResolvedValue({});
      Question.findByIdAndUpdate = findByIdAndUpdateMock;
      
      // Act
      await questionRepository.updateVotes(questionId, upVotes, downVotes);
      
      // Assert
      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        questionId,
        { $set: { 'votes.up': upVotes, 'votes.down': downVotes } },
        { new: true }
      );
    });
  });

  describe('incrementUpVotes', () => {
    it('should call findByIdAndUpdate with the correct parameters', async () => {
      // Arrange
      const questionId = 'test-question-id';
      
      // Mock the findByIdAndUpdate method
      const findByIdAndUpdateMock = jest.fn().mockResolvedValue({});
      Question.findByIdAndUpdate = findByIdAndUpdateMock;
      
      // Act
      await questionRepository.incrementUpVotes(questionId);
      
      // Assert
      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        questionId,
        { $inc: { 'votes.up': 1 } },
        { new: true }
      );
    });
  });

  describe('incrementDownVotes', () => {
    it('should call findByIdAndUpdate with the correct parameters', async () => {
      // Arrange
      const questionId = 'test-question-id';
      
      // Mock the findByIdAndUpdate method
      const findByIdAndUpdateMock = jest.fn().mockResolvedValue({});
      Question.findByIdAndUpdate = findByIdAndUpdateMock;
      
      // Act
      await questionRepository.incrementDownVotes(questionId);
      
      // Assert
      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        questionId,
        { $inc: { 'votes.down': 1 } },
        { new: true }
      );
    });
  });
});