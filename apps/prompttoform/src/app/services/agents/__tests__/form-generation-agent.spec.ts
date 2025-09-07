import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormGenerationAgent } from '../form-generation-agent';
import { FormGenerationService } from '../../form-generation.service';
import { UISchema } from '../../../types/ui-schema';
import {
  ConversationState,
  FormGenerationContext,
} from '../../../types/agent.types';

// Mock the FormGenerationService
vi.mock('../../form-generation.service');

describe('FormGenerationAgent', () => {
  let agent: FormGenerationAgent;
  let mockFormGenerationService: any;
  // Use a minimal mock that satisfies the UISchema interface
  const mockUISchema = {} as UISchema;

  const mockFormResult = {
    success: true,
    parsedJson: {
      app: {
        title: 'Test Form',
        pages: [
          {
            id: 'page1',
            title: 'Test Page',
            route: '/test',
            layout: 'vertical',
            components: [],
            isEndPage: true,
          },
        ],
      },
    },
    formattedJson: '{"app":{"title":"Test Form","pages":[]}}',
    rawJson: '{"app":{"title":"Test Form","pages":[]}}',
    sessionId: 'test-session-id',
  };

  beforeEach(() => {
    mockFormGenerationService = {
      generateForm: vi.fn(),
      updateForm: vi.fn(),
      validateFormSchema: vi.fn(),
    };

    vi.mocked(FormGenerationService).mockImplementation(
      () => mockFormGenerationService
    );

    agent = new FormGenerationAgent(mockUISchema, true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateFormFromConversation', () => {
    const mockConversationState: ConversationState = {
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'I need a contact form',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'agent',
          content: 'What fields do you need?',
          timestamp: new Date(),
        },
        {
          id: '3',
          type: 'user',
          content: 'Name, email, and message',
          timestamp: new Date(),
        },
      ],
      currentQuestions: [],
      context: {
        purpose_question: 'Contact form for customer inquiries',
        fields_question: 'Name, email, and message fields',
      },
      isComplete: true,
      analysis: {
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning: 'Complete information provided',
        suggestedQuestions: [],
      },
      sessionId: 'test-session',
    };

    it('should generate form from conversation successfully', async () => {
      mockFormGenerationService.generateForm.mockResolvedValue(mockFormResult);

      const result = await agent.generateFormFromConversation(
        mockConversationState
      );

      expect(result.success).toBe(true);
      expect(result.conversationContext).toBeDefined();
      expect(result.conversationContext?.originalPrompt).toBe(
        'I need a contact form'
      );
      expect(result.conversationContext?.conversationHistory).toEqual(
        mockConversationState.messages
      );
      expect(result.conversationContext?.gatheredInformation).toEqual(
        mockConversationState.context
      );
      expect(result.conversationContext?.analysis).toEqual(
        mockConversationState.analysis
      );

      expect(mockFormGenerationService.generateForm).toHaveBeenCalledWith(
        expect.stringContaining('I need a contact form')
      );
    });

    it('should build enhanced prompt with gathered information', async () => {
      mockFormGenerationService.generateForm.mockResolvedValue(mockFormResult);

      await agent.generateFormFromConversation(mockConversationState);

      const enhancedPrompt =
        mockFormGenerationService.generateForm.mock.calls[0][0];

      expect(enhancedPrompt).toContain('I need a contact form');
      expect(enhancedPrompt).toContain(
        'Additional Requirements and Information:'
      );
      expect(enhancedPrompt).toContain(
        'Purpose Question: Contact form for customer inquiries'
      );
      expect(enhancedPrompt).toContain(
        'Fields Question: Name, email, and message fields'
      );
    });

    it('should handle incomplete analysis in prompt', async () => {
      const incompleteState: ConversationState = {
        ...mockConversationState,
        analysis: {
          isComplete: false,
          missingCategories: ['validation_rules'],
          confidence: 0.6,
          reasoning: 'Missing validation rules',
          suggestedQuestions: [],
        },
      };

      mockFormGenerationService.generateForm.mockResolvedValue(mockFormResult);

      await agent.generateFormFromConversation(incompleteState);

      const enhancedPrompt =
        mockFormGenerationService.generateForm.mock.calls[0][0];

      expect(enhancedPrompt).toContain(
        'Note: Some information may be incomplete'
      );
      expect(enhancedPrompt).toContain('make reasonable assumptions');
    });

    it('should handle generation errors', async () => {
      mockFormGenerationService.generateForm.mockRejectedValue(
        new Error('Generation failed')
      );

      const result = await agent.generateFormFromConversation(
        mockConversationState
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Failed to generate form from conversation'
      );
      expect(result.error).toContain('Generation failed');
    });

    it('should handle unknown errors', async () => {
      mockFormGenerationService.generateForm.mockRejectedValue('Unknown error');

      const result = await agent.generateFormFromConversation(
        mockConversationState
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
    });
  });

  describe('generateFormFromContext', () => {
    const mockContext: FormGenerationContext = {
      originalPrompt: 'Create a registration form',
      conversationHistory: [
        {
          id: '1',
          type: 'user',
          content: 'Create a registration form',
          timestamp: new Date(),
        },
      ],
      gatheredInformation: {
        fields: 'Name, email, password, confirm password',
        validation: 'Email format validation, password confirmation',
      },
      analysis: {
        isComplete: true,
        missingCategories: [],
        confidence: 0.8,
        reasoning: 'Complete information',
        suggestedQuestions: [],
      },
    };

    it('should generate form from context successfully', async () => {
      mockFormGenerationService.generateForm.mockResolvedValue(mockFormResult);

      const result = await agent.generateFormFromContext(mockContext);

      expect(result.success).toBe(true);
      expect(result.conversationContext).toEqual(mockContext);

      expect(mockFormGenerationService.generateForm).toHaveBeenCalledWith(
        expect.stringContaining('Create a registration form')
      );
    });

    it('should build prompt with context information', async () => {
      mockFormGenerationService.generateForm.mockResolvedValue(mockFormResult);

      await agent.generateFormFromContext(mockContext);

      const prompt = mockFormGenerationService.generateForm.mock.calls[0][0];

      expect(prompt).toContain('Create a registration form');
      expect(prompt).toContain('Additional Requirements:');
      expect(prompt).toContain(
        'Fields: Name, email, password, confirm password'
      );
      expect(prompt).toContain(
        'Validation: Email format validation, password confirmation'
      );
    });

    it('should handle incomplete analysis in context', async () => {
      const incompleteContext: FormGenerationContext = {
        ...mockContext,
        analysis: {
          isComplete: false,
          missingCategories: ['user_flow'],
          confidence: 0.5,
          reasoning: 'Missing user flow information',
          suggestedQuestions: [],
        },
      };

      mockFormGenerationService.generateForm.mockResolvedValue(mockFormResult);

      await agent.generateFormFromContext(incompleteContext);

      const prompt = mockFormGenerationService.generateForm.mock.calls[0][0];

      expect(prompt).toContain('Note: Some information may be incomplete');
    });

    it('should handle empty gathered information', async () => {
      const emptyContext: FormGenerationContext = {
        ...mockContext,
        gatheredInformation: {},
      };

      mockFormGenerationService.generateForm.mockResolvedValue(mockFormResult);

      await agent.generateFormFromContext(emptyContext);

      const prompt = mockFormGenerationService.generateForm.mock.calls[0][0];

      expect(prompt).toBe('Create a registration form');
    });

    it('should handle generation errors', async () => {
      mockFormGenerationService.generateForm.mockRejectedValue(
        new Error('Context generation failed')
      );

      const result = await agent.generateFormFromContext(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate form from context');
    });
  });

  describe('updateForm', () => {
    it('should delegate to form generation service', async () => {
      const updateResult = {
        success: true,
        updatedJson: '{"updated": "form"}',
        sessionId: 'test-session',
      };

      mockFormGenerationService.updateForm.mockResolvedValue(updateResult);

      const result = await agent.updateForm(
        'current form',
        'update prompt',
        'session-id'
      );

      expect(result).toEqual(updateResult);
      expect(mockFormGenerationService.updateForm).toHaveBeenCalledWith(
        'current form',
        'update prompt',
        'session-id'
      );
    });
  });

  // Note: validateFormSchema method removed as it's private in FormGenerationService

  describe('private methods', () => {
    const mockConversationState: ConversationState = {
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'Original prompt',
          timestamp: new Date(),
        },
      ],
      currentQuestions: [],
      context: {
        field1: 'value1',
        field2: 'value2',
      },
      isComplete: true,
      sessionId: 'test-session',
    };

    it('should get original prompt from conversation', () => {
      const originalPrompt = (agent as any).getOriginalPrompt(
        mockConversationState
      );

      expect(originalPrompt).toBe('Original prompt');
    });

    it('should handle missing original prompt', () => {
      const emptyState: ConversationState = {
        ...mockConversationState,
        messages: [],
      };

      const originalPrompt = (agent as any).getOriginalPrompt(emptyState);

      expect(originalPrompt).toBe('');
    });

    it('should format gathered information', () => {
      const formatted = (agent as any).formatGatheredInformation(
        mockConversationState.context
      );

      expect(formatted).toContain('Field1: value1');
      expect(formatted).toContain('Field2: value2');
    });

    it('should handle empty gathered information', () => {
      const formatted = (agent as any).formatGatheredInformation({});

      expect(formatted).toBe('');
    });

    it('should format keys properly', () => {
      const context = {
        snake_case_key: 'value1',
        camelCaseKey: 'value2',
        'kebab-case-key': 'value3',
      };

      const formatted = (agent as any).formatGatheredInformation(context);

      expect(formatted).toContain('Snake Case Key: value1');
      expect(formatted).toContain('CamelCaseKey: value2');
      expect(formatted).toContain('Kebab-Case-Key: value3');
    });
  });
});
