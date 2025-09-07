import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PromptAnalysisAgent } from '../prompt-analysis-agent';
import { callLLMAPI, getCurrentAPIConfig } from '../../llm-api';

// Mock the LLM API
vi.mock('../../llm-api', () => ({
  callLLMAPI: vi.fn(),
  getCurrentAPIConfig: vi.fn(),
}));

describe('PromptAnalysisAgent', () => {
  let agent: PromptAnalysisAgent;
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

  beforeEach(() => {
    agent = new PromptAnalysisAgent();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzePrompt', () => {
    it('should analyze a complete prompt successfully', async () => {
      const mockResponse = JSON.stringify({
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning:
          'The prompt contains all necessary information for form generation.',
        suggestedQuestions: [],
      });

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.analyzePrompt(
        'Create a contact form with name, email, and message fields'
      );

      expect(result).toEqual({
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning:
          'The prompt contains all necessary information for form generation.',
        suggestedQuestions: [],
      });

      expect(callLLMAPI).toHaveBeenCalledWith(
        'Create a contact form with name, email, and message fields',
        expect.stringContaining('You are an expert form analyst'),
        mockAPIConfig
      );
    });

    it('should analyze an incomplete prompt and identify missing categories', async () => {
      const mockResponse = JSON.stringify({
        isComplete: false,
        missingCategories: ['form_purpose', 'validation_rules'],
        confidence: 0.6,
        reasoning:
          'The prompt lacks specific purpose and validation requirements.',
        suggestedQuestions: [
          'What is the main purpose of this form?',
          'What validation rules are needed?',
        ],
      });

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.analyzePrompt('I need a form');

      expect(result).toEqual({
        isComplete: false,
        missingCategories: ['form_purpose', 'validation_rules'],
        confidence: 0.6,
        reasoning:
          'The prompt lacks specific purpose and validation requirements.',
        suggestedQuestions: [
          'What is the main purpose of this form?',
          'What validation rules are needed?',
        ],
      });
    });

    it('should handle API errors gracefully with fallback analysis', async () => {
      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockRejectedValue(new Error('API Error'));

      const result = await agent.analyzePrompt('Test prompt');

      expect(result).toEqual({
        isComplete: false,
        missingCategories: ['form_purpose', 'required_fields'],
        confidence: 0.1,
        reasoning:
          'Unable to analyze prompt due to API error. Proceeding with basic analysis.',
        suggestedQuestions: [
          'What is the main purpose of this form?',
          'What specific information do you need to collect?',
        ],
      });
    });

    it('should handle missing API key', async () => {
      vi.mocked(getCurrentAPIConfig).mockReturnValue({
        ...mockAPIConfig,
        apiKey: '',
        systemKey: '',
      });

      const result = await agent.analyzePrompt('Test prompt');

      expect(result).toEqual({
        isComplete: false,
        missingCategories: ['form_purpose', 'required_fields'],
        confidence: 0.1,
        reasoning:
          'Unable to analyze prompt due to API error. Proceeding with basic analysis.',
        suggestedQuestions: [
          'What is the main purpose of this form?',
          'What specific information do you need to collect?',
        ],
      });
    });

    it('should parse responses with markdown code blocks', async () => {
      const mockResponse = `Here's the analysis:
\`\`\`json
{
  "isComplete": true,
  "missingCategories": [],
  "confidence": 0.8,
  "reasoning": "Complete prompt",
  "suggestedQuestions": []
}
\`\`\``;

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.analyzePrompt('Complete prompt');

      expect(result.isComplete).toBe(true);
      expect(result.confidence).toBe(0.8);
    });

    it('should handle malformed JSON with fallback parsing', async () => {
      const mockResponse =
        'This is not valid JSON but mentions complete and purpose';

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.analyzePrompt('Test prompt');

      expect(result.isComplete).toBe(true); // Contains "complete"
      expect(result.missingCategories).toContain('form_purpose'); // Contains "purpose"
      expect(result.confidence).toBe(0.7);
    });

    it('should validate and clamp confidence values', async () => {
      const mockResponse = JSON.stringify({
        isComplete: true,
        missingCategories: [],
        confidence: 1.5, // Invalid: > 1
        reasoning: 'Test reasoning',
        suggestedQuestions: [],
      });

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.analyzePrompt('Test prompt');

      expect(result.confidence).toBe(1); // Clamped to 1
    });

    it('should handle negative confidence values', async () => {
      const mockResponse = JSON.stringify({
        isComplete: true,
        missingCategories: [],
        confidence: -0.5, // Invalid: < 0
        reasoning: 'Test reasoning',
        suggestedQuestions: [],
      });

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.analyzePrompt('Test prompt');

      expect(result.confidence).toBe(0); // Clamped to 0
    });

    it('should provide default values for missing fields', async () => {
      const mockResponse = JSON.stringify({
        isComplete: true,
        // Missing other fields
      });

      vi.mocked(getCurrentAPIConfig).mockReturnValue(mockAPIConfig);
      vi.mocked(callLLMAPI).mockResolvedValue(mockResponse);

      const result = await agent.analyzePrompt('Test prompt');

      expect(result.missingCategories).toEqual([]);
      expect(result.confidence).toBe(0.5);
      expect(result.reasoning).toBe('No reasoning provided');
      expect(result.suggestedQuestions).toEqual([]);
    });
  });

  describe('fallback analysis', () => {
    it('should detect complete prompts in fallback mode', () => {
      const response =
        'This prompt is complete and has all required information';
      const result = (agent as any).fallbackAnalysis(response);

      expect(result.isComplete).toBe(true);
      expect(result.confidence).toBe(0.7);
    });

    it('should detect incomplete prompts in fallback mode', () => {
      const response = 'This prompt is not complete and needs more information';
      const result = (agent as any).fallbackAnalysis(response);

      expect(result.isComplete).toBe(false);
      expect(result.confidence).toBe(0.3);
    });

    it('should identify missing categories in fallback mode', () => {
      const response =
        'This prompt mentions purpose and fields but lacks validation rules';
      const result = (agent as any).fallbackAnalysis(response);

      expect(result.missingCategories).toContain('form_purpose');
      expect(result.missingCategories).toContain('required_fields');
      expect(result.missingCategories).toContain('validation_rules');
    });
  });

  describe('validation', () => {
    it('should throw error for invalid isComplete type', () => {
      const invalidAnalysis = {
        isComplete: 'true', // Should be boolean
        missingCategories: [],
        confidence: 0.5,
        reasoning: 'Test',
      };

      expect(() => {
        (agent as any).validateAnalysis(invalidAnalysis);
      }).toThrow('Invalid analysis: isComplete must be boolean');
    });

    it('should throw error for invalid missingCategories type', () => {
      const invalidAnalysis = {
        isComplete: true,
        missingCategories: 'not an array', // Should be array
        confidence: 0.5,
        reasoning: 'Test',
      };

      expect(() => {
        (agent as any).validateAnalysis(invalidAnalysis);
      }).toThrow('Invalid analysis: missingCategories must be array');
    });

    it('should throw error for invalid confidence range', () => {
      const invalidAnalysis = {
        isComplete: true,
        missingCategories: [],
        confidence: 2, // Should be 0-1
        reasoning: 'Test',
      };

      expect(() => {
        (agent as any).validateAnalysis(invalidAnalysis);
      }).toThrow('Invalid analysis: confidence must be number between 0 and 1');
    });

    it('should throw error for invalid reasoning type', () => {
      const invalidAnalysis = {
        isComplete: true,
        missingCategories: [],
        confidence: 0.5,
        reasoning: 123, // Should be string
      };

      expect(() => {
        (agent as any).validateAnalysis(invalidAnalysis);
      }).toThrow('Invalid analysis: reasoning must be string');
    });
  });
});
