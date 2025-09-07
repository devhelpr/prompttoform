import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuestionGenerationAgent } from '../question-generation-agent';
import { callLLMAPI, getCurrentAPIConfig } from '../../llm-api';
import {
  PromptAnalysis,
  ConversationMessage,
} from '../../../types/agent.types';

// Mock the LLM API
vi.mock('../../llm-api', () => ({
  callLLMAPI: vi.fn(),
  getCurrentAPIConfig: vi.fn(),
}));

describe('QuestionGenerationAgent', () => {
  let agent: QuestionGenerationAgent;
  const mockAPIConfig = {
    name: 'Test API',
    baseUrl: 'https://api.test.com',
    apiKey: 'test-key',
    model: 'test-model',
    description: 'Test API Description',
    isChatCompletionCompatible: true,
    systemKey: 'test-system-key',
    supportsTemperature: true,
  };

  const mockAnalysis: PromptAnalysis = {
    isComplete: false,
    missingCategories: ['form_purpose', 'required_fields'],
    confidence: 0.6,
    reasoning: 'Missing key information',
    suggestedQuestions: [],
  };

  beforeEach(() => {
    agent = new QuestionGenerationAgent();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateQuestions', () => {
    it('should generate questions successfully', async () => {
      const mockResponse = JSON.stringify([
        {
          id: 'purpose_question',
          question: 'What is the main purpose of this form?',
          category: 'form_purpose',
          inputType: 'textarea',
          required: true,
          placeholder: 'Describe the purpose...',
          helpText: 'Explain what this form accomplishes',
        },
        {
          id: 'fields_question',
          question: 'What fields do you need?',
          category: 'required_fields',
          inputType: 'textarea',
          required: true,
          placeholder: 'List the fields...',
          helpText: 'Specify what information to collect',
        },
      ]);

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.generateQuestions(mockAnalysis);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'purpose_question',
        question: 'What is the main purpose of this form?',
        category: 'form_purpose',
        inputType: 'textarea',
        required: true,
        placeholder: 'Describe the purpose...',
        helpText: 'Explain what this form accomplishes',
      });

      expect(callLLMAPI).toHaveBeenCalledWith(
        expect.stringContaining('Analysis Results:'),
        expect.stringContaining('You are an expert form designer'),
        mockAPIConfig
      );
    });

    it('should handle API errors with fallback questions', async () => {
      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockRejectedValue(new Error('API Error'));

      const result = await agent.generateQuestions(mockAnalysis);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('form_purpose');
      expect(result[1].category).toBe('required_fields');
      expect(result[0].inputType).toBe('textarea');
      expect(result[0].required).toBe(true);
    });

    it('should handle missing API key', async () => {
      vi.mocked(getCurrentAPIConfig).mockReturnValue({
        ...mockAPIConfig,
        apiKey: '',
        systemKey: '',
      });

      const result = await agent.generateQuestions(mockAnalysis);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('form_purpose');
    });

    it('should parse responses with markdown code blocks', async () => {
      const mockResponse = `Here are the questions:
\`\`\`json
[
  {
    "id": "test_question",
    "question": "Test question?",
    "category": "general",
    "inputType": "text",
    "required": true
  }
]
\`\`\``;

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.generateQuestions(mockAnalysis);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Test question?');
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = 'This is not valid JSON';

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      // The agent should fall back to generating fallback questions instead of throwing
      const result = await agent.generateQuestions(mockAnalysis);
      expect(result).toHaveLength(2); // Should have fallback questions
      expect(result[0].category).toBe('form_purpose');
    });

    it('should validate and enhance questions', async () => {
      const mockResponse = JSON.stringify([
        {
          id: 'test_question',
          question: 'Test question?',
          category: 'general',
          inputType: 'invalid_type', // Invalid input type
          required: 'yes', // Invalid boolean
          // Missing placeholder and helpText
        },
      ]);

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.generateQuestions(mockAnalysis);

      expect(result[0].inputType).toBe('text'); // Default fallback
      expect(result[0].required).toBe(true); // Converted to boolean
      expect(result[0].placeholder).toBe('Enter your answer...'); // Generated
      expect(result[0].helpText).toBeTruthy(); // Generated
    });

    it('should handle non-array responses', async () => {
      const mockResponse = JSON.stringify({
        question: 'Single question',
        category: 'general',
      });

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      // The agent should fall back to generating fallback questions instead of throwing
      const result = await agent.generateQuestions(mockAnalysis);
      expect(result).toHaveLength(2); // Should have fallback questions
      expect(result[0].category).toBe('form_purpose');
    });
  });

  describe('buildConversationContext', () => {
    it('should handle empty conversation history', () => {
      const context = (agent as any).buildConversationContext([]);
      expect(context).toBe('No previous conversation history.');
    });

    it('should build context from recent messages', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          type: 'user',
          content: 'I need a form',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'agent',
          content: 'What kind of form?',
          timestamp: new Date(),
        },
        {
          id: '3',
          type: 'user',
          content: 'A contact form',
          timestamp: new Date(),
        },
      ];

      const context = (agent as any).buildConversationContext(messages);

      expect(context).toContain('User: I need a form');
      expect(context).toContain('Agent: What kind of form?');
      expect(context).toContain('User: A contact form');
    });

    it('should limit to recent messages', () => {
      const messages: ConversationMessage[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `msg_${i}`,
          type: i % 2 === 0 ? 'user' : 'agent',
          content: `Message ${i}`,
          timestamp: new Date(),
        })
      );

      const context = (agent as any).buildConversationContext(messages);

      // Should only include last 6 messages
      expect(context.split('\n')).toHaveLength(6);
      expect(context).toContain('Message 4'); // Last 6 messages
      expect(context).not.toContain('Message 0'); // Not in last 6
    });
  });

  describe('buildQuestionPrompt', () => {
    it('should build prompt with analysis and context', () => {
      const context = 'Previous conversation context';
      const prompt = (agent as any).buildQuestionPrompt(mockAnalysis, context);

      expect(prompt).toContain('Complete: false');
      expect(prompt).toContain(
        'Missing Categories: form_purpose, required_fields'
      );
      expect(prompt).toContain('Confidence: 0.6');
      expect(prompt).toContain('Reasoning: Missing key information');
      expect(prompt).toContain('Previous conversation context');
    });
  });

  describe('validateInputType', () => {
    it('should return valid input types', () => {
      expect((agent as any).validateInputType('text')).toBe('text');
      expect((agent as any).validateInputType('textarea')).toBe('textarea');
      expect((agent as any).validateInputType('select')).toBe('select');
      expect((agent as any).validateInputType('multiselect')).toBe(
        'multiselect'
      );
    });

    it('should default to text for invalid types', () => {
      expect((agent as any).validateInputType('invalid')).toBe('text');
      expect((agent as any).validateInputType(null)).toBe('text');
      expect((agent as any).validateInputType(undefined)).toBe('text');
    });
  });

  describe('generateFallbackQuestions', () => {
    it('should generate questions for form_purpose category', () => {
      const analysis: PromptAnalysis = {
        isComplete: false,
        missingCategories: ['form_purpose'],
        confidence: 0.5,
        reasoning: 'Test',
      };

      const questions = (agent as any).generateFallbackQuestions(analysis);

      expect(questions).toHaveLength(1);
      expect(questions[0].category).toBe('form_purpose');
      expect(questions[0].inputType).toBe('textarea');
      expect(questions[0].required).toBe(true);
    });

    it('should generate questions for required_fields category', () => {
      const analysis: PromptAnalysis = {
        isComplete: false,
        missingCategories: ['required_fields'],
        confidence: 0.5,
        reasoning: 'Test',
      };

      const questions = (agent as any).generateFallbackQuestions(analysis);

      expect(questions).toHaveLength(1);
      expect(questions[0].category).toBe('required_fields');
      expect(questions[0].inputType).toBe('textarea');
    });

    it('should generate questions for validation_rules category', () => {
      const analysis: PromptAnalysis = {
        isComplete: false,
        missingCategories: ['validation_rules'],
        confidence: 0.5,
        reasoning: 'Test',
      };

      const questions = (agent as any).generateFallbackQuestions(analysis);

      expect(questions).toHaveLength(1);
      expect(questions[0].category).toBe('validation_rules');
      expect(questions[0].required).toBe(false);
    });

    it('should generate general question when no specific categories', () => {
      const analysis: PromptAnalysis = {
        isComplete: false,
        missingCategories: ['unknown_category'],
        confidence: 0.5,
        reasoning: 'Test',
      };

      const questions = (agent as any).generateFallbackQuestions(analysis);

      expect(questions).toHaveLength(1);
      expect(questions[0].category).toBe('general');
      expect(questions[0].question).toContain('more details');
    });

    it('should generate multiple questions for multiple categories', () => {
      const analysis: PromptAnalysis = {
        isComplete: false,
        missingCategories: [
          'form_purpose',
          'required_fields',
          'validation_rules',
        ],
        confidence: 0.5,
        reasoning: 'Test',
      };

      const questions = (agent as any).generateFallbackQuestions(analysis);

      expect(questions).toHaveLength(3);
      expect(questions.map((q: any) => q.category)).toEqual([
        'form_purpose',
        'required_fields',
        'validation_rules',
      ]);
    });
  });

  describe('generatePlaceholder', () => {
    it('should generate appropriate placeholders for each input type', () => {
      const textQuestion = { inputType: 'text' as const };
      const textareaQuestion = { inputType: 'textarea' as const };
      const selectQuestion = { inputType: 'select' as const };
      const multiselectQuestion = { inputType: 'multiselect' as const };

      expect((agent as any).generatePlaceholder(textQuestion)).toBe(
        'Enter your answer...'
      );
      expect((agent as any).generatePlaceholder(textareaQuestion)).toBe(
        'Provide a detailed answer...'
      );
      expect((agent as any).generatePlaceholder(selectQuestion)).toBe(
        'Choose an option...'
      );
      expect((agent as any).generatePlaceholder(multiselectQuestion)).toBe(
        'Select one or more options...'
      );
    });
  });

  describe('generateHelpText', () => {
    it('should generate appropriate help text for each category', () => {
      const formPurposeQuestion = { category: 'form_purpose' };
      const requiredFieldsQuestion = { category: 'required_fields' };
      const validationRulesQuestion = { category: 'validation_rules' };
      const userFlowQuestion = { category: 'user_flow' };
      const generalQuestion = { category: 'general' };

      expect((agent as any).generateHelpText(formPurposeQuestion)).toContain(
        'accomplish'
      );
      expect((agent as any).generateHelpText(requiredFieldsQuestion)).toContain(
        'collect'
      );
      expect(
        (agent as any).generateHelpText(validationRulesQuestion)
      ).toContain('validation');
      expect((agent as any).generateHelpText(userFlowQuestion)).toContain(
        'navigate'
      );
      expect((agent as any).generateHelpText(generalQuestion)).toContain(
        'detail'
      );
    });
  });
});
