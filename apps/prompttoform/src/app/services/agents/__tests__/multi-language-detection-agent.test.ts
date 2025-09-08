import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiLanguageDetectionAgent } from '../multi-language-detection-agent';
import {
  MultiLanguageAnalysis,
  LanguageDetectionConfig,
} from '../../../types/multi-language-agent.types';

// Mock the LLM API
vi.mock('../../llm-api', () => ({
  generateResponse: vi.fn(),
}));

describe('MultiLanguageDetectionAgent', () => {
  let agent: MultiLanguageDetectionAgent;
  let mockConfig: LanguageDetectionConfig;

  beforeEach(() => {
    mockConfig = {
      confidenceThreshold: 0.7,
      enableFallback: true,
      maxLanguages: 5,
      supportedLanguageCodes: [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'zh',
        'ja',
        'ko',
        'ar',
      ],
    };
    agent = new MultiLanguageDetectionAgent(mockConfig);
    vi.clearAllMocks();
  });

  describe('detectMultiLanguageRequest', () => {
    it('should detect explicit multi-language requests', async () => {
      const prompt = 'Create a registration form in English and Spanish';

      // Mock LLM response
      const mockResponse = JSON.stringify({
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es'],
        confidence: 0.95,
        reasoning: 'User explicitly requested English and Spanish versions',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue(mockResponse);

      const result = await agent.detectMultiLanguageRequest(prompt);

      expect(result.isMultiLanguageRequested).toBe(true);
      expect(result.requestedLanguages).toEqual(['en', 'es']);
      expect(result.confidence).toBe(0.95);
      expect(result.languageDetails).toHaveLength(2);
      expect(result.languageDetails?.[0].nativeName).toBe('English');
      expect(result.languageDetails?.[1].nativeName).toBe('Español');
    });

    it('should detect implicit multi-language requests', async () => {
      const prompt = 'I need a form for international users';

      const mockResponse = JSON.stringify({
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es', 'fr'],
        confidence: 0.8,
        reasoning: 'International users typically need multiple languages',
        suggestedLanguages: ['en', 'es', 'fr'],
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
          { code: 'fr', name: 'French', nativeName: 'Français' },
        ],
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue(mockResponse);

      const result = await agent.detectMultiLanguageRequest(prompt);

      expect(result.isMultiLanguageRequested).toBe(true);
      expect(result.requestedLanguages).toEqual(['en', 'es', 'fr']);
      expect(result.suggestedLanguages).toEqual(['en', 'es', 'fr']);
    });

    it('should not detect multi-language for single language requests', async () => {
      const prompt = 'Create a simple contact form';

      const mockResponse = JSON.stringify({
        isMultiLanguageRequested: false,
        requestedLanguages: ['en'],
        confidence: 0.9,
        reasoning: 'No indication of multi-language requirements',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
        ],
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue(mockResponse);

      const result = await agent.detectMultiLanguageRequest(prompt);

      expect(result.isMultiLanguageRequested).toBe(false);
      expect(result.requestedLanguages).toEqual(['en']);
    });

    it('should handle language names in different scripts', async () => {
      const prompt = 'Create a form in English, 中文, and العربية';

      const mockResponse = JSON.stringify({
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'zh', 'ar'],
        confidence: 0.9,
        reasoning: 'User specified languages in their native scripts',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'zh', name: 'Chinese', nativeName: '中文' },
          { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
        ],
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue(mockResponse);

      const result = await agent.detectMultiLanguageRequest(prompt);

      expect(result.languageDetails?.[1].nativeName).toBe('中文');
      expect(result.languageDetails?.[2].nativeName).toBe('العربية');
    });

    it('should handle malformed LLM responses gracefully', async () => {
      const prompt = 'Create a form in multiple languages';

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue('invalid json');

      const result = await agent.detectMultiLanguageRequest(prompt);

      expect(result.isMultiLanguageRequested).toBe(false);
      expect(result.requestedLanguages).toEqual(['en']);
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('Error parsing LLM response');
    });

    it('should handle LLM API errors', async () => {
      const prompt = 'Create a form in multiple languages';

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockRejectedValue(new Error('API Error'));

      const result = await agent.detectMultiLanguageRequest(prompt);

      expect(result.isMultiLanguageRequested).toBe(false);
      expect(result.requestedLanguages).toEqual(['en']);
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('Error calling LLM API');
    });

    it('should respect maxLanguages configuration', async () => {
      const prompt =
        'Create a form in English, Spanish, French, German, Italian, Portuguese';

      const mockResponse = JSON.stringify({
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
        confidence: 0.9,
        reasoning: 'User requested 6 languages',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
          { code: 'fr', name: 'French', nativeName: 'Français' },
          { code: 'de', name: 'German', nativeName: 'Deutsch' },
          { code: 'it', name: 'Italian', nativeName: 'Italiano' },
          { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
        ],
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue(mockResponse);

      const result = await agent.detectMultiLanguageRequest(prompt);

      // Should be limited to maxLanguages (5)
      expect(result.requestedLanguages.length).toBeLessThanOrEqual(5);
      expect(result.languageDetails?.length).toBeLessThanOrEqual(5);
    });

    it('should filter unsupported language codes', async () => {
      const prompt = 'Create a form in English, Spanish, and Klingon';

      const mockResponse = JSON.stringify({
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es', 'tlh'], // tlh is Klingon (not supported)
        confidence: 0.8,
        reasoning: 'User requested English, Spanish, and Klingon',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
          { code: 'tlh', name: 'Klingon', nativeName: 'tlhIngan Hol' },
        ],
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue(mockResponse);

      const result = await agent.detectMultiLanguageRequest(prompt);

      expect(result.requestedLanguages).not.toContain('tlh');
      expect(result.requestedLanguages).toContain('en');
      expect(result.requestedLanguages).toContain('es');
    });
  });

  describe('validateLanguageCodes', () => {
    it('should validate correct language codes', () => {
      const validCodes = ['en', 'es', 'fr'];
      const result = agent.validateLanguageCodes(validCodes);
      expect(result).toEqual(validCodes);
    });

    it('should filter invalid language codes', () => {
      const mixedCodes = ['en', 'invalid', 'es', 'tlh', 'fr'];
      const result = agent.validateLanguageCodes(mixedCodes);
      expect(result).toEqual(['en', 'es', 'fr']);
    });

    it('should handle empty array', () => {
      const result = agent.validateLanguageCodes([]);
      expect(result).toEqual([]);
    });
  });

  describe('getLanguageDetails', () => {
    it('should return language details for valid codes', () => {
      const codes = ['en', 'es', 'fr'];
      const result = agent.getLanguageDetails(codes);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
      });
      expect(result[1]).toEqual({
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
      });
      expect(result[2]).toEqual({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
      });
    });

    it('should handle unknown language codes', () => {
      const codes = ['en', 'unknown', 'es'];
      const result = agent.getLanguageDetails(codes);

      expect(result).toHaveLength(3);
      expect(result[0].code).toBe('en');
      expect(result[1].code).toBe('unknown');
      expect(result[2].code).toBe('es');
    });
  });

  describe('parseAnalysisResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es'],
        confidence: 0.9,
        reasoning: 'Test reasoning',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      });

      const result = agent.parseAnalysisResponse(response);

      expect(result.isMultiLanguageRequested).toBe(true);
      expect(result.requestedLanguages).toEqual(['en', 'es']);
      expect(result.confidence).toBe(0.9);
      expect(result.languageDetails).toHaveLength(2);
    });

    it('should handle malformed JSON', () => {
      const response = 'invalid json';
      const result = agent.parseAnalysisResponse(response);

      expect(result.isMultiLanguageRequested).toBe(false);
      expect(result.requestedLanguages).toEqual(['en']);
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('Error parsing LLM response');
    });

    it('should handle missing required fields', () => {
      const response = JSON.stringify({
        isMultiLanguageRequested: true,
        // missing other required fields
      });

      const result = agent.parseAnalysisResponse(response);

      expect(result.isMultiLanguageRequested).toBe(true);
      expect(result.requestedLanguages).toEqual(['en']); // default fallback
      expect(result.confidence).toBe(0);
    });
  });
});
