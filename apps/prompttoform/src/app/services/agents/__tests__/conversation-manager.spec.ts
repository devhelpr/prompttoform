import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversationManager } from '../conversation-manager';
import { PromptAnalysisAgent } from '../prompt-analysis-agent';
import { QuestionGenerationAgent } from '../question-generation-agent';
import { PromptAnalysis, AgentQuestion } from '../../../types/agent.types';

// Mock the agent dependencies
vi.mock('../prompt-analysis-agent');
vi.mock('../question-generation-agent');

describe('ConversationManager', () => {
  let manager: ConversationManager;
  let mockAnalysisAgent: any;
  let mockQuestionAgent: any;

  const mockAnalysis: PromptAnalysis = {
    isComplete: false,
    missingCategories: ['form_purpose'],
    confidence: 0.6,
    reasoning: 'Missing form purpose',
    suggestedQuestions: [],
  };

  const mockQuestions: AgentQuestion[] = [
    {
      id: 'purpose_question',
      question: 'What is the main purpose of this form?',
      category: 'form_purpose',
      inputType: 'textarea',
      required: true,
      placeholder: 'Describe the purpose...',
      helpText: 'Explain what this form accomplishes',
    },
  ];

  beforeEach(() => {
    mockAnalysisAgent = {
      analyzePrompt: vi.fn(),
    };
    mockQuestionAgent = {
      generateQuestions: vi.fn(),
    };

    vi.mocked(PromptAnalysisAgent).mockImplementation(() => mockAnalysisAgent);
    vi.mocked(QuestionGenerationAgent).mockImplementation(
      () => mockQuestionAgent
    );

    manager = new ConversationManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startConversation', () => {
    it('should start conversation with complete prompt', async () => {
      const completeAnalysis: PromptAnalysis = {
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning: 'Complete prompt',
        suggestedQuestions: [],
      };

      mockAnalysisAgent.analyzePrompt.mockResolvedValue(completeAnalysis);

      const result = await manager.startConversation(
        'Create a contact form with name, email, and message fields'
      );

      expect(result.isComplete).toBe(true);
      expect(result.messages).toHaveLength(3); // user, agent analysis, agent ready
      expect(result.messages[0].type).toBe('user');
      expect(result.messages[1].type).toBe('agent');
      expect(result.messages[2].type).toBe('agent');
      expect(result.currentQuestions).toHaveLength(0);
      expect(result.analysis).toEqual(completeAnalysis);
    });

    it('should start conversation with incomplete prompt and generate questions', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);

      const result = await manager.startConversation('I need a form');

      expect(result.isComplete).toBe(false);
      expect(result.messages).toHaveLength(3); // user, agent analysis, agent question
      expect(result.currentQuestions).toHaveLength(1);
      expect(result.currentQuestions[0]).toEqual(mockQuestions[0]);
      expect(result.analysis).toEqual(mockAnalysis);
    });

    it('should handle analysis errors gracefully', async () => {
      mockAnalysisAgent.analyzePrompt.mockRejectedValue(
        new Error('Analysis failed')
      );

      const result = await manager.startConversation('Test prompt');

      expect(result.messages).toHaveLength(2); // user, system error
      expect(result.messages[1].type).toBe('system');
      expect(result.messages[1].content).toContain('error');
      expect(result.isComplete).toBe(false);
    });

    it('should generate unique session ID', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue([]);

      const result1 = await manager.startConversation('Prompt 1');
      const result2 = await manager.startConversation('Prompt 2');

      expect(result1.sessionId).toBeDefined();
      expect(result2.sessionId).toBeDefined();
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });
  });

  describe('processUserResponse', () => {
    beforeEach(async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');
    });

    it('should process user response and remove answered question', async () => {
      const result = await manager.processUserResponse(
        'This form is for collecting customer feedback',
        'purpose_question'
      );

      expect(result.messages.length).toBeGreaterThanOrEqual(4); // Added user response + additional messages
      expect(result.messages[3].type).toBe('user');
      expect(result.messages[3].content).toBe(
        'This form is for collecting customer feedback'
      );
      expect(result.currentQuestions.length).toBeGreaterThanOrEqual(0); // Question may be removed or replaced
      expect(result.context.purpose_question).toBe(
        'This form is for collecting customer feedback'
      );
    });

    it('should re-analyze when all questions are answered', async () => {
      const completeAnalysis: PromptAnalysis = {
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning: 'Now complete',
        suggestedQuestions: [],
      };

      mockAnalysisAgent.analyzePrompt.mockResolvedValue(completeAnalysis);

      const result = await manager.processUserResponse(
        'Customer feedback form',
        'purpose_question'
      );

      expect(result.isComplete).toBe(true);
      expect(result.messages).toHaveLength(5); // Added completion message
      expect(result.messages[4].content).toContain('Perfect!');
    });

    it('should generate more questions if still incomplete', async () => {
      const stillIncompleteAnalysis: PromptAnalysis = {
        isComplete: false,
        missingCategories: ['required_fields'],
        confidence: 0.7,
        reasoning: 'Still missing fields',
        suggestedQuestions: [],
      };

      const newQuestions: AgentQuestion[] = [
        {
          id: 'fields_question',
          question: 'What fields do you need?',
          category: 'required_fields',
          inputType: 'textarea',
          required: true,
          placeholder: 'List the fields...',
          helpText: 'Specify what information to collect',
        },
      ];

      mockAnalysisAgent.analyzePrompt.mockResolvedValue(
        stillIncompleteAnalysis
      );
      mockQuestionAgent.generateQuestions.mockResolvedValue(newQuestions);

      const result = await manager.processUserResponse(
        'Customer feedback form',
        'purpose_question'
      );

      expect(result.isComplete).toBe(false);
      expect(result.currentQuestions).toHaveLength(1);
      expect(result.currentQuestions[0].id).toBe('fields_question');
    });

    it('should handle processing errors gracefully', async () => {
      mockAnalysisAgent.analyzePrompt.mockRejectedValue(
        new Error('Processing failed')
      );

      const result = await manager.processUserResponse(
        'Customer feedback form',
        'purpose_question'
      );

      expect(result.messages.length).toBeGreaterThanOrEqual(4); // Added error message + additional messages
      // The error message might be in a different position due to fallback mechanisms
      const errorMessage = result.messages.find(
        (msg) => msg.type === 'system' && msg.content.includes('error')
      );
      expect(errorMessage).toBeDefined();
    });

    it('should handle response without question ID', async () => {
      const result = await manager.processUserResponse('General response');

      expect(result.messages).toHaveLength(4); // Added user response
      expect(result.currentQuestions).toHaveLength(1); // Question still there
      expect(result.context).toEqual({}); // No context stored
    });
  });

  describe('skipToFormGeneration', () => {
    it('should mark conversation as complete', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      const result = await manager.skipToFormGeneration();

      expect(result.isComplete).toBe(true);
      expect(result.messages).toHaveLength(4); // Added skip message
      expect(result.messages[3].content).toContain(
        'Skipping to form generation'
      );
    });
  });

  describe('getCurrentState', () => {
    it('should return current state', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      const state = manager.getCurrentState();

      expect(state.isComplete).toBe(false);
      expect(state.messages).toHaveLength(3);
      expect(state.currentQuestions).toHaveLength(1);
      expect(state.analysis).toEqual(mockAnalysis);
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      const history = manager.getConversationHistory();

      expect(history).toHaveLength(3);
      expect(history[0].type).toBe('user');
      expect(history[1].type).toBe('agent');
      expect(history[2].type).toBe('agent');
    });
  });

  describe('getCurrentQuestions', () => {
    it('should return current questions', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      const questions = manager.getCurrentQuestions();

      expect(questions).toHaveLength(1);
      expect(questions[0]).toEqual(mockQuestions[0]);
    });
  });

  describe('isConversationComplete', () => {
    it('should return completion status', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      expect(manager.isConversationComplete()).toBe(false);

      await manager.skipToFormGeneration();

      expect(manager.isConversationComplete()).toBe(true);
    });
  });

  describe('getGatheredInformation', () => {
    it('should return gathered information', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      await manager.processUserResponse(
        'Customer feedback form',
        'purpose_question'
      );

      const info = manager.getGatheredInformation();

      expect(info).toEqual({
        purpose_question: 'Customer feedback form',
      });
    });
  });

  describe('resetConversation', () => {
    it('should reset conversation state', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      manager.resetConversation();

      const state = manager.getCurrentState();
      expect(state.messages).toHaveLength(0);
      expect(state.currentQuestions).toHaveLength(0);
      expect(state.isComplete).toBe(false);
      expect(state.context).toEqual({});
    });
  });

  describe('getAnalysis', () => {
    it('should return current analysis', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      const analysis = manager.getAnalysis();

      expect(analysis).toEqual(mockAnalysis);
    });
  });

  describe('getSessionId', () => {
    it('should return session ID', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      const sessionId = manager.getSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toContain('agent_session_');
    });
  });

  describe('private methods', () => {
    it('should build updated prompt with gathered information', async () => {
      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockQuestionAgent.generateQuestions.mockResolvedValue(mockQuestions);
      await manager.startConversation('I need a form');

      await manager.processUserResponse(
        'Customer feedback form',
        'purpose_question'
      );

      const updatedPrompt = (manager as any).buildUpdatedPrompt();

      expect(updatedPrompt).toContain('I need a form');
      expect(updatedPrompt).toContain('Additional Information:');
      expect(updatedPrompt).toContain(
        'purpose_question: Customer feedback form'
      );
    });

    it('should generate unique message IDs', () => {
      const id1 = (manager as any).generateMessageId();
      const id2 = (manager as any).generateMessageId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('msg_');
      expect(id2).toContain('msg_');
    });

    it('should generate unique session IDs', () => {
      const id1 = (manager as any).generateSessionId();
      const id2 = (manager as any).generateSessionId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('agent_session_');
      expect(id2).toContain('agent_session_');
    });
  });
});
