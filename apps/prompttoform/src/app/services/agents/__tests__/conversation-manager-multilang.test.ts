import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationManager } from '../conversation-manager';
import {
  MultiLanguageAnalysis,
  TranslationResult,
} from '../../../types/multi-language-agent.types';
import { PromptAnalysisAgent } from '../prompt-analysis-agent';
import { QuestionGenerationAgent } from '../question-generation-agent';
import { MultiLanguageDetectionAgent } from '../multi-language-detection-agent';
import { TranslationGenerationAgent } from '../translation-generation-agent';

// Mock the agents
vi.mock('../prompt-analysis-agent', () => ({
  PromptAnalysisAgent: vi.fn().mockImplementation(() => ({
    analyzePrompt: vi.fn().mockResolvedValue({
      isFormRequest: true,
      confidence: 0.9,
      reasoning: 'Test analysis',
    }),
  })),
}));

vi.mock('../question-generation-agent', () => ({
  QuestionGenerationAgent: vi.fn().mockImplementation(() => ({
    generateQuestions: vi.fn(),
  })),
}));

vi.mock('../multi-language-detection-agent', () => ({
  MultiLanguageDetectionAgent: vi.fn().mockImplementation(() => ({
    detectMultiLanguageRequest: vi.fn(),
  })),
}));

vi.mock('../translation-generation-agent', () => ({
  TranslationGenerationAgent: vi.fn().mockImplementation(() => ({
    generateTranslations: vi.fn(),
  })),
}));

describe('ConversationManager - Multi-Language Integration', () => {
  let conversationManager: ConversationManager;
  let mockAnalysisAgent: any;
  let mockQuestionAgent: any;
  let mockMultiLangAgent: any;
  let mockTranslationAgent: any;

  beforeEach(() => {
    // Create mock instances
    mockAnalysisAgent = {
      analyzePrompt: vi.fn().mockResolvedValue({
        isFormRequest: true,
        confidence: 0.9,
        reasoning: 'Test analysis',
      }),
    };

    mockQuestionAgent = {
      generateQuestions: vi.fn().mockResolvedValue([]),
    };

    mockMultiLangAgent = {
      detectMultiLanguageRequest: vi.fn().mockResolvedValue({
        isMultiLanguageRequested: false,
        requestedLanguages: ['en'],
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
        ],
        confidence: 0.9,
        reasoning: 'Single language detected',
      }),
    };

    mockTranslationAgent = {
      generateTranslations: vi.fn().mockResolvedValue({
        success: true,
        translations: {},
      }),
    };

    // Create conversation manager with mocked agents
    conversationManager = new ConversationManager();

    // Replace the agents with our mocks
    conversationManager['analysisAgent'] = mockAnalysisAgent as any;
    conversationManager['questionAgent'] = mockQuestionAgent as any;
    conversationManager['multiLangAgent'] = mockMultiLangAgent as any;
    conversationManager['translationAgent'] = mockTranslationAgent as any;

    vi.clearAllMocks();
  });

  describe('startConversation with multi-language detection', () => {
    it('should detect multi-language request and set up translation', async () => {
      const prompt = 'Create a registration form in English and Spanish';

      const mockAnalysis = {
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning: 'Complete prompt with clear requirements',
        suggestedQuestions: [],
      };

      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es'],
        confidence: 0.95,
        reasoning: 'User explicitly requested English and Spanish',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      };

      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockMultiLangAgent.detectMultiLanguageRequest.mockResolvedValue(
        mockMultiLangAnalysis
      );

      const result = await conversationManager.startConversation(prompt);

      expect(
        mockMultiLangAgent.detectMultiLanguageRequest
      ).toHaveBeenCalledWith(prompt);
      expect(result.multiLanguageAnalysis).toEqual(mockMultiLangAnalysis);
      expect(result.isComplete).toBe(true);
    });

    it('should handle single language requests', async () => {
      const prompt = 'Create a simple contact form';

      const mockAnalysis = {
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning: 'Complete prompt',
        suggestedQuestions: [],
      };

      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: false,
        requestedLanguages: ['en'],
        confidence: 0.9,
        reasoning: 'No multi-language requirements detected',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
        ],
      };

      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockMultiLangAgent.detectMultiLanguageRequest.mockResolvedValue(
        mockMultiLangAnalysis
      );

      const result = await conversationManager.startConversation(prompt);

      expect(result.multiLanguageAnalysis?.isMultiLanguageRequested).toBe(
        false
      );
      expect(result.multiLanguageAnalysis?.requestedLanguages).toEqual(['en']);
    });

    it('should handle multi-language detection errors gracefully', async () => {
      const prompt = 'Create a form in multiple languages';

      const mockAnalysis = {
        isComplete: true,
        missingCategories: [],
        confidence: 0.9,
        reasoning: 'Complete prompt',
        suggestedQuestions: [],
      };

      mockAnalysisAgent.analyzePrompt.mockResolvedValue(mockAnalysis);
      mockMultiLangAgent.detectMultiLanguageRequest.mockRejectedValue(
        new Error('Detection failed')
      );

      const result = await conversationManager.startConversation(prompt);

      expect(result.multiLanguageAnalysis).toBeUndefined();
      expect(result.isComplete).toBe(true);
    });
  });

  describe('generateFormWithTranslations', () => {
    it('should generate form with translations for multi-language requests', async () => {
      const mockFormJson = {
        app: {
          title: 'Registration Form',
          pages: [
            {
              id: 'page1',
              title: 'Personal Information',
              components: [
                {
                  id: 'firstName',
                  type: 'input',
                  label: 'First Name',
                  props: {
                    placeholder: 'Enter your first name',
                  },
                },
              ],
            },
          ],
        },
      };

      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es'],
        confidence: 0.95,
        reasoning: 'Multi-language requested',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      };

      const mockTranslationResult: TranslationResult = {
        success: true,
        translations: {
          es: {
            app: { title: 'Formulario de Registro' },
            pages: [
              {
                id: 'page1',
                title: 'Información Personal',
                components: [
                  {
                    id: 'firstName',
                    label: 'Nombre',
                    props: {
                      placeholder: 'Ingrese su nombre',
                    },
                  },
                ],
              },
            ],
            ui: {
              nextButton: 'Siguiente',
              submitButton: 'Enviar',
            },
            errorMessages: {
              required: '{fieldLabel} es requerido',
            },
          },
        },
      };

      // Set up the conversation manager state
      conversationManager['state'].multiLanguageAnalysis =
        mockMultiLangAnalysis;
      mockTranslationAgent.generateTranslations.mockResolvedValue(
        mockTranslationResult
      );

      const result = await conversationManager.generateFormWithTranslations(
        mockFormJson
      );

      expect(mockTranslationAgent.generateTranslations).toHaveBeenCalledWith({
        formJson: mockFormJson,
        targetLanguages: ['en', 'es'],
        sourceLanguage: 'en',
        languageDetails: mockMultiLangAnalysis.languageDetails,
      });

      expect(result.translations).toEqual(mockTranslationResult.translations);
      expect(result.defaultLanguage).toBe('en');
      expect(result.supportedLanguages).toEqual(['en', 'es']);
      expect(result.languageDetails).toEqual(
        mockMultiLangAnalysis.languageDetails
      );
    });

    it('should return original form for single language requests', async () => {
      const mockFormJson = {
        app: {
          title: 'Contact Form',
          pages: [],
        },
      };

      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: false,
        requestedLanguages: ['en'],
        confidence: 0.9,
        reasoning: 'Single language request',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
        ],
      };

      conversationManager['state'].multiLanguageAnalysis =
        mockMultiLangAnalysis;

      const result = await conversationManager.generateFormWithTranslations(
        mockFormJson
      );

      expect(mockTranslationAgent.generateTranslations).not.toHaveBeenCalled();
      expect(result).toEqual(mockFormJson);
    });

    it('should handle translation failures gracefully', async () => {
      const mockFormJson = {
        app: {
          title: 'Registration Form',
          pages: [],
        },
      };

      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es'],
        confidence: 0.95,
        reasoning: 'Multi-language requested',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      };

      const mockTranslationResult: TranslationResult = {
        success: false,
        errors: ['Translation failed for Spanish'],
      };

      conversationManager['state'].multiLanguageAnalysis =
        mockMultiLangAnalysis;
      mockTranslationAgent.generateTranslations.mockResolvedValue(
        mockTranslationResult
      );

      const result = await conversationManager.generateFormWithTranslations(
        mockFormJson
      );

      expect(result).toEqual(mockFormJson); // Should return original form
    });

    it('should handle missing multi-language analysis', async () => {
      const mockFormJson = {
        app: {
          title: 'Contact Form',
          pages: [],
        },
      };

      // No multi-language analysis set
      conversationManager['state'].multiLanguageAnalysis = undefined;

      const result = await conversationManager.generateFormWithTranslations(
        mockFormJson
      );

      expect(mockTranslationAgent.generateTranslations).not.toHaveBeenCalled();
      expect(result).toEqual(mockFormJson);
    });
  });

  describe('getMultiLanguageState', () => {
    it('should return current multi-language state', () => {
      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es'],
        confidence: 0.95,
        reasoning: 'Multi-language requested',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      };

      conversationManager['state'].multiLanguageAnalysis =
        mockMultiLangAnalysis;
      conversationManager['state'].currentLanguage = 'en';
      conversationManager['state'].availableLanguages = ['en', 'es'];
      conversationManager['state'].languageDetails =
        mockMultiLangAnalysis.languageDetails;

      const result = conversationManager.getMultiLanguageState();

      expect(result.multiLanguageAnalysis).toEqual(mockMultiLangAnalysis);
      expect(result.currentLanguage).toBe('en');
      expect(result.availableLanguages).toEqual(['en', 'es']);
      expect(result.languageDetails).toEqual(
        mockMultiLangAnalysis.languageDetails
      );
    });

    it('should return default state when no multi-language analysis', () => {
      const result = conversationManager.getMultiLanguageState();

      expect(result.multiLanguageAnalysis).toBeUndefined();
      expect(result.currentLanguage).toBe('en');
      expect(result.availableLanguages).toEqual(['en']);
      expect(result.languageDetails).toBeUndefined();
    });
  });

  describe('setCurrentLanguage', () => {
    it('should update current language', () => {
      // Set up available languages first
      conversationManager['state'].availableLanguages = ['en', 'es'];

      conversationManager.setCurrentLanguage('es');

      expect(conversationManager['state'].currentLanguage).toBe('es');
    });

    it('should validate language code', () => {
      conversationManager.setCurrentLanguage('invalid');

      expect(conversationManager['state'].currentLanguage).toBe('en'); // Should fallback to default
    });
  });

  describe('isMultiLanguageEnabled', () => {
    it('should return true when multi-language is requested', () => {
      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: true,
        requestedLanguages: ['en', 'es'],
        confidence: 0.95,
        reasoning: 'Multi-language requested',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      };

      conversationManager['state'].multiLanguageAnalysis =
        mockMultiLangAnalysis;

      expect(conversationManager.isMultiLanguageEnabled()).toBe(true);
    });

    it('should return false when multi-language is not requested', () => {
      const mockMultiLangAnalysis: MultiLanguageAnalysis = {
        isMultiLanguageRequested: false,
        requestedLanguages: ['en'],
        confidence: 0.9,
        reasoning: 'Single language request',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
        ],
      };

      conversationManager['state'].multiLanguageAnalysis =
        mockMultiLangAnalysis;

      expect(conversationManager.isMultiLanguageEnabled()).toBe(false);
    });

    it('should return false when no multi-language analysis', () => {
      expect(conversationManager.isMultiLanguageEnabled()).toBe(false);
    });
  });
});
