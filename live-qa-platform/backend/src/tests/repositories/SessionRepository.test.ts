import mongoose from 'mongoose';
import SessionRepository from '../../repositories/SessionRepository';
import Session from '../../models/Session';
import Database from '../../config/database';

// Mock the Session model
jest.mock('../../models/Session');

describe('SessionRepository', () => {
  let sessionRepository: SessionRepository;

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
    sessionRepository = new SessionRepository();
  });

  describe('findByUrl', () => {
    it('should call findOne with the correct parameters', async () => {
      // Arrange
      const url = 'test-url';
      const findOneSpy = jest.spyOn(sessionRepository, 'findOne');
      
      // Act
      await sessionRepository.findByUrl(url);
      
      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({ url });
    });
  });

  describe('createWithUniqueUrl', () => {
    it('should generate a unique URL if not provided', async () => {
      // Arrange
      const sessionData = {
        presenterToken: 'test-token',
      };
      const createSpy = jest.spyOn(sessionRepository, 'create');
      
      // Act
      await sessionRepository.createWithUniqueUrl(sessionData);
      
      // Assert
      expect(createSpy).toHaveBeenCalled();
      const createArgs = createSpy.mock.calls[0][0];
      expect(createArgs).toHaveProperty('url');
      expect(createArgs.url).toBeTruthy();
    });

    it('should use the provided URL if available', async () => {
      // Arrange
      const sessionData = {
        url: 'custom-url',
        presenterToken: 'test-token',
      };
      const createSpy = jest.spyOn(sessionRepository, 'create');
      
      // Act
      await sessionRepository.createWithUniqueUrl(sessionData);
      
      // Assert
      expect(createSpy).toHaveBeenCalledWith(sessionData);
    });
  });

  describe('endSession', () => {
    it('should call updateById with the correct parameters', async () => {
      // Arrange
      const sessionId = 'test-id';
      const updateByIdSpy = jest.spyOn(sessionRepository, 'updateById');
      
      // Act
      await sessionRepository.endSession(sessionId);
      
      // Assert
      expect(updateByIdSpy).toHaveBeenCalledWith(sessionId, { active: false });
    });
  });
});