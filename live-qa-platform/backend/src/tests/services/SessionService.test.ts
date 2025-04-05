import SessionService from '../../services/SessionService';
import SessionRepository from '../../repositories/SessionRepository';

// Mock the SessionRepository
jest.mock('../../repositories/SessionRepository');

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockSessionRepository: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock SessionRepository
    mockSessionRepository = new SessionRepository() as jest.Mocked<SessionRepository>;
    
    // Create a new SessionService with the mock repository
    sessionService = new SessionService(mockSessionRepository);
  });

  describe('createSession', () => {
    it('should call createWithUniqueUrl on the repository', async () => {
      // Arrange
      const presenterName = 'Test Presenter';
      const mockSession = {
        id: 'test-id',
        url: 'test-url',
        presenterToken: 'test-token',
        active: true,
        createdAt: new Date(),
      };
      
      mockSessionRepository.createWithUniqueUrl.mockResolvedValue(mockSession as any);
      
      // Act
      const result = await sessionService.createSession(presenterName);
      
      // Assert
      expect(mockSessionRepository.createWithUniqueUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          presenterToken: expect.any(String),
        })
      );
      expect(result).toEqual(mockSession);
    });
  });

  describe('getSessionByUrl', () => {
    it('should call findByUrl on the repository with the correct parameters', async () => {
      // Arrange
      const url = 'test-url';
      const mockSession = {
        id: 'test-id',
        url,
        presenterToken: 'test-token',
        active: true,
        createdAt: new Date(),
      };
      
      mockSessionRepository.findByUrl.mockResolvedValue(mockSession as any);
      
      // Act
      const result = await sessionService.getSessionByUrl(url);
      
      // Assert
      expect(mockSessionRepository.findByUrl).toHaveBeenCalledWith(url);
      expect(result).toEqual(mockSession);
    });

    it('should return null when the session is not found', async () => {
      // Arrange
      const url = 'non-existent-url';
      
      mockSessionRepository.findByUrl.mockResolvedValue(null);
      
      // Act
      const result = await sessionService.getSessionByUrl(url);
      
      // Assert
      expect(mockSessionRepository.findByUrl).toHaveBeenCalledWith(url);
      expect(result).toBeNull();
    });
  });

  describe('endSession', () => {
    it('should call endSession on the repository with the correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const mockSession = {
        id: sessionId,
        url: 'test-url',
        presenterToken: 'test-token',
        active: false,
        createdAt: new Date(),
      };
      
      mockSessionRepository.endSession.mockResolvedValue(mockSession as any);
      
      // Act
      const result = await sessionService.endSession(sessionId);
      
      // Assert
      expect(mockSessionRepository.endSession).toHaveBeenCalledWith(sessionId);
      expect(result).toEqual(mockSession);
    });
  });

  describe('validatePresenterToken', () => {
    it('should return true when the token is valid', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const token = 'test-token';
      const mockSession = {
        id: sessionId,
        url: 'test-url',
        presenterToken: token,
        active: true,
        createdAt: new Date(),
      };
      
      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      
      // Act
      const result = await sessionService.validatePresenterToken(sessionId, token);
      
      // Assert
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(true);
    });

    it('should return false when the token is invalid', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const token = 'invalid-token';
      const mockSession = {
        id: sessionId,
        url: 'test-url',
        presenterToken: 'test-token',
        active: true,
        createdAt: new Date(),
      };
      
      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      
      // Act
      const result = await sessionService.validatePresenterToken(sessionId, token);
      
      // Assert
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(false);
    });

    it('should return false when the session is not found', async () => {
      // Arrange
      const sessionId = 'non-existent-session-id';
      const token = 'test-token';
      
      mockSessionRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await sessionService.validatePresenterToken(sessionId, token);
      
      // Assert
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(false);
    });
  });
});