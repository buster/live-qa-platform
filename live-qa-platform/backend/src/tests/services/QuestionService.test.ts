import QuestionService from '../../services/QuestionService';
import QuestionRepository from '../../repositories/QuestionRepository';
import VoteRepository from '../../repositories/VoteRepository';

// Mock the repositories
jest.mock('../../repositories/QuestionRepository');
jest.mock('../../repositories/VoteRepository');

describe('QuestionService', () => {
  let questionService: QuestionService;
  let mockQuestionRepository: jest.Mocked<QuestionRepository>;
  let mockVoteRepository: jest.Mocked<VoteRepository>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create mock repositories
    mockQuestionRepository = new QuestionRepository() as jest.Mocked<QuestionRepository>;
    mockVoteRepository = new VoteRepository() as jest.Mocked<VoteRepository>;
    
    // Create a new QuestionService with the mock repositories
    questionService = new QuestionService(mockQuestionRepository, mockVoteRepository);
  });

  describe('createQuestion', () => {
    it('should call create on the repository with the correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const authorName = 'Test Author';
      const text = 'Test question?';
      const mockQuestion = {
        id: 'test-id',
        sessionId,
        authorName,
        text,
        isAnswered: false,
        votes: { up: 0, down: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockQuestionRepository.create.mockResolvedValue(mockQuestion as any);
      
      // Act
      const result = await questionService.createQuestion(sessionId, authorName, text);
      
      // Assert
      expect(mockQuestionRepository.create).toHaveBeenCalledWith({
        sessionId,
        authorName,
        text,
        isAnswered: false,
        votes: { up: 0, down: 0 },
      });
      expect(result).toEqual(mockQuestion);
    });
  });

  describe('getQuestionsBySessionId', () => {
    it('should call findBySessionId on the repository with the correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const mockQuestions = [
        {
          id: 'test-id-1',
          sessionId,
          authorName: 'Test Author 1',
          text: 'Test question 1?',
          isAnswered: false,
          votes: { up: 0, down: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'test-id-2',
          sessionId,
          authorName: 'Test Author 2',
          text: 'Test question 2?',
          isAnswered: true,
          votes: { up: 2, down: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      mockQuestionRepository.findBySessionId.mockResolvedValue(mockQuestions as any);
      
      // Act
      const result = await questionService.getQuestionsBySessionId(sessionId);
      
      // Assert
      expect(mockQuestionRepository.findBySessionId).toHaveBeenCalledWith(sessionId);
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('markQuestionAsAnswered', () => {
    it('should call markAsAnswered on the repository with the correct parameters', async () => {
      // Arrange
      const questionId = 'test-question-id';
      const mockQuestion = {
        id: questionId,
        sessionId: 'test-session-id',
        authorName: 'Test Author',
        text: 'Test question?',
        isAnswered: true,
        votes: { up: 0, down: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockQuestionRepository.markAsAnswered.mockResolvedValue(mockQuestion as any);
      
      // Act
      const result = await questionService.markQuestionAsAnswered(questionId);
      
      // Assert
      expect(mockQuestionRepository.markAsAnswered).toHaveBeenCalledWith(questionId);
      expect(result).toEqual(mockQuestion);
    });
  });

  describe('voteOnQuestion', () => {
    it('should call the appropriate repository methods and return the updated question', async () => {
      // Arrange
      const questionId = 'test-question-id';
      const voterName = 'Test Voter';
      const voteType = 'up';
      
      const mockVote = {
        id: 'test-vote-id',
        questionId,
        voterName,
        type: voteType,
        createdAt: new Date(),
      };
      
      const mockQuestion = {
        id: questionId,
        sessionId: 'test-session-id',
        authorName: 'Test Author',
        text: 'Test question?',
        isAnswered: false,
        votes: { up: 1, down: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockVoteRepository.toggleVote.mockResolvedValue(mockVote as any);
      mockVoteRepository.countUpVotes.mockResolvedValue(1);
      mockVoteRepository.countDownVotes.mockResolvedValue(0);
      mockQuestionRepository.updateVotes.mockResolvedValue(mockQuestion as any);
      
      // Act
      const result = await questionService.voteOnQuestion(questionId, voterName, voteType);
      
      // Assert
      expect(mockVoteRepository.toggleVote).toHaveBeenCalledWith(questionId, voterName, voteType);
      expect(mockVoteRepository.countUpVotes).toHaveBeenCalledWith(questionId);
      expect(mockVoteRepository.countDownVotes).toHaveBeenCalledWith(questionId);
      expect(mockQuestionRepository.updateVotes).toHaveBeenCalledWith(questionId, 1, 0);
      expect(result).toEqual(mockQuestion);
    });
  });
});
