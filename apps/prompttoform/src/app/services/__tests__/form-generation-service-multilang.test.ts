import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormGenerationService } from '../form-generation.service';
import { UISchema } from '../../types/ui-schema';

// Mock the LLM API
vi.mock('../llm-api', () => ({
  getCurrentAPIConfig: vi.fn(() => ({
    name: 'Test API',
    apiKey: 'test-key',
    systemKey: 'test-system-key',
  })),
  generateResponse: vi.fn(),
}));

vi.mock('../llm', () => ({
  generateUIFromPrompt: vi.fn(),
}));

vi.mock('./indexeddb', () => ({
  FormSessionService: {
    createSession: vi.fn().mockResolvedValue('test-session-id'),
  },
}));

describe('FormGenerationService - Multi-Language Integration', () => {
  let formGenerationService: FormGenerationService;
  let mockUISchema: UISchema;

  beforeEach(async () => {
    mockUISchema = {
      type: 'object',
      properties: {
        app: { type: 'object' },
        pages: { type: 'array' },
      },
    } as UISchema;

    formGenerationService = new FormGenerationService(mockUISchema, true);

    // Mock generateResponse for multi-language detection and translation
    const { generateResponse } = await import('../llm-api');
    vi.mocked(generateResponse).mockImplementation((prompt: string) => {
      if (
        prompt.includes('multi-language') ||
        prompt.includes('English and Spanish')
      ) {
        return Promise.resolve(
          JSON.stringify({
            isMultiLanguageRequested: true,
            requestedLanguages: ['en', 'es'],
            confidence: 0.95,
            reasoning: 'Multi-language request detected',
            languageDetails: [
              { code: 'en', name: 'English', nativeName: 'English' },
              { code: 'es', name: 'Spanish', nativeName: 'Español' },
            ],
          })
        );
      } else if (prompt.includes('English and French')) {
        return Promise.resolve(
          JSON.stringify({
            isMultiLanguageRequested: true,
            requestedLanguages: ['en', 'fr'],
            confidence: 0.9,
            reasoning: 'Multi-language request detected',
            languageDetails: [
              { code: 'en', name: 'English', nativeName: 'English' },
              { code: 'fr', name: 'French', nativeName: 'Français' },
            ],
          })
        );
      } else if (
        prompt.includes('Translate the following form') &&
        prompt.includes('Spanish')
      ) {
        // Mock translation response
        return Promise.resolve(
          JSON.stringify({
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
          })
        );
      } else {
        return Promise.resolve(
          JSON.stringify({
            isMultiLanguageRequested: false,
            requestedLanguages: ['en'],
            confidence: 0.9,
            reasoning: 'Single language request',
            languageDetails: [
              { code: 'en', name: 'English', nativeName: 'English' },
            ],
          })
        );
      }
    });
  });

  it('should detect multi-language requests and generate translations', async () => {
    const multiLanguagePrompt =
      'Create a registration form in English and Spanish for international users';

    const mockFormJson = {
      app: {
        title: 'Registration Form',
      },
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
    };

    const mockTranslationResult = {
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
        },
      },
    };

    // Mock the LLM responses
    const { generateUIFromPrompt } = await import('../llm');
    vi.mocked(generateUIFromPrompt).mockResolvedValue(
      JSON.stringify(mockFormJson)
    );

    // Mock the multi-language detection agent
    const multiLangAgent = formGenerationService['multiLangAgent'];
    vi.spyOn(multiLangAgent, 'detectMultiLanguageRequest').mockResolvedValue({
      isMultiLanguageRequested: true,
      requestedLanguages: ['en', 'es'],
      confidence: 0.95,
      reasoning: 'Multi-language request detected',
      languageDetails: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
      ],
    });

    // Mock the translation generation agent
    const translationAgent = formGenerationService['translationAgent'];
    vi.spyOn(translationAgent, 'generateTranslations').mockResolvedValue(
      mockTranslationResult
    );

    const result = await formGenerationService.generateForm(
      multiLanguagePrompt
    );

    expect(result.success).toBe(true);
    expect(result.parsedJson).toBeDefined();

    // Check that the form includes multi-language properties
    expect(result.parsedJson?.translations).toBeDefined();
    expect(result.parsedJson?.supportedLanguages).toEqual(['en', 'es']);
    expect(result.parsedJson?.defaultLanguage).toBe('en');
    expect(result.parsedJson?.languageDetails).toEqual([
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ]);

    // Verify that the translation agent was called
    expect(translationAgent.generateTranslations).toHaveBeenCalledWith({
      formJson: mockFormJson,
      targetLanguages: ['en', 'es'],
      sourceLanguage: 'en',
      languageDetails: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
      ],
    });
  });

  it('should handle single-language requests without translation', async () => {
    const singleLanguagePrompt = 'Create a simple contact form';

    const mockFormJson = {
      app: {
        title: 'Contact Form',
      },
      pages: [],
    };

    // Mock the LLM response
    const { generateUIFromPrompt } = await import('../llm');
    vi.mocked(generateUIFromPrompt).mockResolvedValue(
      JSON.stringify(mockFormJson)
    );

    // Mock the multi-language detection agent to return single language
    const multiLangAgent = formGenerationService['multiLangAgent'];
    vi.spyOn(multiLangAgent, 'detectMultiLanguageRequest').mockResolvedValue({
      isMultiLanguageRequested: false,
      requestedLanguages: ['en'],
      confidence: 0.9,
      reasoning: 'Single language request',
      languageDetails: [{ code: 'en', name: 'English', nativeName: 'English' }],
    });

    const result = await formGenerationService.generateForm(
      singleLanguagePrompt
    );

    expect(result.success).toBe(true);
    expect(result.parsedJson).toBeDefined();

    // Check that the form does NOT include multi-language properties
    expect(result.parsedJson?.translations).toBeUndefined();
    expect(result.parsedJson?.supportedLanguages).toBeUndefined();
    expect(result.parsedJson?.defaultLanguage).toBeUndefined();
    expect(result.parsedJson?.languageDetails).toBeUndefined();
  });

  it('should handle translation generation failures gracefully', async () => {
    const multiLanguagePrompt = 'Create a form in English and French';

    const mockFormJson = {
      app: {
        title: 'Test Form',
      },
      pages: [],
    };

    // Mock the LLM response
    const { generateUIFromPrompt } = await import('../llm');
    vi.mocked(generateUIFromPrompt).mockResolvedValue(
      JSON.stringify(mockFormJson)
    );

    // Mock the multi-language detection agent
    const multiLangAgent = formGenerationService['multiLangAgent'];
    vi.spyOn(multiLangAgent, 'detectMultiLanguageRequest').mockResolvedValue({
      isMultiLanguageRequested: true,
      requestedLanguages: ['en', 'fr'],
      confidence: 0.9,
      reasoning: 'Multi-language request detected',
      languageDetails: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
      ],
    });

    // Mock the translation generation agent to fail
    const translationAgent = formGenerationService['translationAgent'];
    vi.spyOn(translationAgent, 'generateTranslations').mockResolvedValue({
      success: false,
      errors: ['Translation failed'],
    });

    const result = await formGenerationService.generateForm(
      multiLanguagePrompt
    );

    expect(result.success).toBe(true);
    expect(result.parsedJson).toBeDefined();

    // Should return the original form without translations
    expect(result.parsedJson?.translations).toBeUndefined();
    expect(result.parsedJson?.supportedLanguages).toBeUndefined();
  });

  it('should handle multi-language detection failures gracefully', async () => {
    const prompt = 'Create a form';

    const mockFormJson = {
      app: {
        title: 'Test Form',
      },
      pages: [],
    };

    // Mock the LLM response
    const { generateUIFromPrompt } = await import('../llm');
    vi.mocked(generateUIFromPrompt).mockResolvedValue(
      JSON.stringify(mockFormJson)
    );

    // Mock the multi-language detection agent to throw an error
    const multiLangAgent = formGenerationService['multiLangAgent'];
    vi.spyOn(multiLangAgent, 'detectMultiLanguageRequest').mockRejectedValue(
      new Error('Detection failed')
    );

    const result = await formGenerationService.generateForm(prompt);

    expect(result.success).toBe(true);
    expect(result.parsedJson).toBeDefined();

    // Should return the original form without translations
    expect(result.parsedJson?.translations).toBeUndefined();
    expect(result.parsedJson?.supportedLanguages).toBeUndefined();
  });
});
