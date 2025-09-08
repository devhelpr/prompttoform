import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranslationGenerationAgent } from '../translation-generation-agent';
import {
  TranslationRequest,
  TranslationResult,
  TranslationConfig,
} from '../../../types/multi-language-agent.types';

// Mock the LLM API
vi.mock('../../llm-api', () => ({
  generateResponse: vi.fn(),
}));

describe('TranslationGenerationAgent', () => {
  let agent: TranslationGenerationAgent;
  let mockConfig: TranslationConfig;
  let mockFormJson: any;

  beforeEach(() => {
    mockConfig = {
      enableLLMTranslation: true,
      fallbackToEnglish: true,
      preserveFormatting: true,
      maxRetries: 3,
      timeoutMs: 30000,
    };
    agent = new TranslationGenerationAgent(mockConfig);

    mockFormJson = {
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
                  helperText: 'This will be used for identification',
                },
                validation: {
                  required: true,
                  errorMessages: {
                    required: 'First name is required',
                  },
                },
              },
              {
                id: 'country',
                type: 'select',
                label: 'Country',
                props: {
                  options: [
                    { label: 'United States', value: 'US' },
                    { label: 'Canada', value: 'CA' },
                  ],
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Thank You!',
          message: 'Your form has been submitted successfully.',
        },
      },
    };

    vi.clearAllMocks();
  });

  describe('generateTranslations', () => {
    it('should generate translations for multiple languages', async () => {
      const request: TranslationRequest = {
        formJson: mockFormJson,
        targetLanguages: ['es', 'fr'],
        sourceLanguage: 'en',
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
          { code: 'fr', name: 'French', nativeName: 'Français' },
        ],
      };

      const mockSpanishResponse = JSON.stringify({
        app: {
          title: 'Formulario de Registro',
        },
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
                  helperText: 'Esto se usará para identificación',
                },
                validation: {
                  errorMessages: {
                    required: 'El nombre es requerido',
                  },
                },
              },
              {
                id: 'country',
                label: 'País',
                props: {
                  options: [
                    { label: 'Estados Unidos', value: 'US' },
                    { label: 'Canadá', value: 'CA' },
                  ],
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: '¡Gracias!',
          message: 'Su formulario ha sido enviado exitosamente.',
        },
        ui: {
          nextButton: 'Siguiente',
          previousButton: 'Anterior',
          submitButton: 'Enviar',
        },
        errorMessages: {
          required: '{fieldLabel} es requerido',
          minLength: '{fieldLabel} debe tener al menos {minLength} caracteres',
        },
      });

      const mockFrenchResponse = JSON.stringify({
        app: {
          title: "Formulaire d'Inscription",
        },
        pages: [
          {
            id: 'page1',
            title: 'Informations Personnelles',
            components: [
              {
                id: 'firstName',
                label: 'Prénom',
                props: {
                  placeholder: 'Entrez votre prénom',
                  helperText: "Ceci sera utilisé pour l'identification",
                },
                validation: {
                  errorMessages: {
                    required: 'Le prénom est requis',
                  },
                },
              },
              {
                id: 'country',
                label: 'Pays',
                props: {
                  options: [
                    { label: 'États-Unis', value: 'US' },
                    { label: 'Canada', value: 'CA' },
                  ],
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Merci!',
          message: 'Votre formulaire a été soumis avec succès.',
        },
        ui: {
          nextButton: 'Suivant',
          previousButton: 'Précédent',
          submitButton: 'Soumettre',
        },
        errorMessages: {
          required: '{fieldLabel} est requis',
          minLength:
            '{fieldLabel} doit contenir au moins {minLength} caractères',
        },
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse)
        .mockResolvedValueOnce(mockSpanishResponse)
        .mockResolvedValueOnce(mockFrenchResponse);

      const result = await agent.generateTranslations(request);

      expect(result.success).toBe(true);
      expect(result.translations).toBeDefined();
      expect(result.translations?.es).toBeDefined();
      expect(result.translations?.fr).toBeDefined();
      expect(result.translations?.es.app.title).toBe('Formulario de Registro');
      expect(result.translations?.fr.app.title).toBe(
        "Formulaire d'Inscription"
      );
      expect(result.errors).toBeUndefined();
    });

    it('should handle translation errors gracefully', async () => {
      const request: TranslationRequest = {
        formJson: mockFormJson,
        targetLanguages: ['es', 'fr'],
        sourceLanguage: 'en',
      };

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse)
        .mockResolvedValueOnce(
          JSON.stringify({ app: { title: 'Spanish Title' } })
        )
        .mockRejectedValueOnce(new Error('Translation failed'));

      const result = await agent.generateTranslations(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0]).toContain('fr');
    });

    it('should handle malformed translation responses', async () => {
      const request: TranslationRequest = {
        formJson: mockFormJson,
        targetLanguages: ['es'],
        sourceLanguage: 'en',
      };

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockResolvedValue('invalid json');

      const result = await agent.generateTranslations(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain(
        'Error parsing translation response'
      );
    });

    it('should respect maxRetries configuration', async () => {
      const request: TranslationRequest = {
        formJson: mockFormJson,
        targetLanguages: ['es'],
        sourceLanguage: 'en',
      };

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockRejectedValue(new Error('API Error'));

      const result = await agent.generateTranslations(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      // Should have attempted maxRetries (3) times
      expect(generateResponse).toHaveBeenCalledTimes(3);
    });

    it('should handle empty target languages', async () => {
      const request: TranslationRequest = {
        formJson: mockFormJson,
        targetLanguages: [],
        sourceLanguage: 'en',
      };

      const result = await agent.generateTranslations(request);

      expect(result.success).toBe(true);
      expect(result.translations).toEqual({});
      expect(result.errors).toBeUndefined();
    });

    it('should include processing time in result', async () => {
      const request: TranslationRequest = {
        formJson: mockFormJson,
        targetLanguages: ['es'],
        sourceLanguage: 'en',
      };

      const mockResponse = JSON.stringify({
        app: { title: 'Spanish Title' },
        ui: { nextButton: 'Siguiente' },
        errorMessages: { required: 'Requerido' },
      });

      const { generateResponse } = await import('../../llm-api');
      vi.mocked(generateResponse).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return mockResponse;
      });

      const result = await agent.generateTranslations(request);

      expect(result.success).toBe(true);
      expect(result.processingTime).toBeDefined();
      expect(typeof result.processingTime).toBe('number');
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('buildComprehensiveLanguagePrompt', () => {
    it('should build prompt with language details', () => {
      const languageDetails = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
      ];

      const prompt = agent.buildComprehensiveLanguagePrompt(
        mockFormJson,
        'es',
        'en',
        languageDetails
      );

      expect(prompt).toContain('English');
      expect(prompt).toContain('Español');
      expect(prompt).toContain('Spanish');
      expect(prompt).toContain('Registration Form');
    });

    it('should build prompt without language details', () => {
      const prompt = agent.buildComprehensiveLanguagePrompt(
        mockFormJson,
        'es',
        'en'
      );

      expect(prompt).toContain('en');
      expect(prompt).toContain('es');
      expect(prompt).toContain('Registration Form');
    });

    it('should include all form elements in prompt', () => {
      const prompt = agent.buildComprehensiveLanguagePrompt(
        mockFormJson,
        'es',
        'en'
      );

      expect(prompt).toContain('First Name');
      expect(prompt).toContain('Enter your first name');
      expect(prompt).toContain('This will be used for identification');
      expect(prompt).toContain('United States');
      expect(prompt).toContain('Thank You!');
    });
  });

  describe('validateTranslationResponse', () => {
    it('should validate complete translation response', () => {
      const response = {
        app: { title: 'Spanish Title' },
        pages: [
          {
            id: 'page1',
            title: 'Spanish Page Title',
            components: [
              {
                id: 'firstName',
                label: 'Spanish Label',
              },
            ],
          },
        ],
        ui: { nextButton: 'Siguiente' },
        errorMessages: { required: 'Requerido' },
      };

      const result = agent.validateTranslationResponse(response);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect missing required fields', () => {
      const response = {
        app: 'invalid', // Should be an object
        pages: 'invalid', // Should be an array
        ui: 'invalid', // Should be an object
        errorMessages: 'invalid', // Should be an object
      };

      const result = agent.validateTranslationResponse(response);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined response', () => {
      const result = agent.validateTranslationResponse(null);

      expect(result.isValid).toBe(false);
      expect(result.errors?.[0]).toContain('Response is null or undefined');
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry failed operations', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValue('Success');

      const result = await agent.retryWithBackoff(mockFn, 3, 100);

      expect(result).toBe('Success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(agent.retryWithBackoff(mockFn, 2, 10)).rejects.toThrow(
        'Always fails'
      );
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
