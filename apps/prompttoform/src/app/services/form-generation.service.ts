import { UISchema } from '../types/ui-schema';
import { UIJson } from '../types/form-generator.types';
import { generateUIFromPrompt, updateFormWithPatch } from './llm';
import { getCurrentAPIConfig } from './llm-api';
import {
  parseJsonSafely,
  formatJsonForDisplay,
  getRawJsonForStorage,
} from '../utils/json-utils';
import { FormSessionService } from './indexeddb';
import { MultiLanguageDetectionAgent } from './agents/multi-language-detection-agent';
import { TranslationGenerationAgent } from './agents/translation-generation-agent';

export interface FormGenerationResult {
  success: boolean;
  parsedJson?: UIJson;
  formattedJson?: string;
  rawJson?: string;
  error?: string;
  sessionId?: string;
}

export interface FormUpdateResult {
  success: boolean;
  updatedJson?: string;
  error?: string;
}

export class FormGenerationService {
  private uiSchema: UISchema;
  private skipValidation: boolean;
  private multiLangAgent: MultiLanguageDetectionAgent;
  private translationAgent: TranslationGenerationAgent;

  constructor(uiSchema: UISchema, skipValidation = true) {
    this.uiSchema = uiSchema;
    this.skipValidation = skipValidation;

    // Initialize multi-language agents
    this.multiLangAgent = new MultiLanguageDetectionAgent({
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
        'hi',
        'ru',
        'nl',
        'sv',
        'da',
        'no',
        'fi',
        'pl',
        'tr',
        'he',
        'th',
        'vi',
        'id',
        'ms',
        'tl',
        'uk',
        'cs',
        'hu',
        'ro',
        'bg',
        'hr',
        'sk',
        'sl',
        'et',
        'lv',
        'lt',
        'el',
        'is',
        'mt',
        'cy',
        'ga',
        'eu',
        'ca',
        'gl',
      ],
    });
    this.translationAgent = new TranslationGenerationAgent({
      enableLLMTranslation: true,
      fallbackToEnglish: true,
      preserveFormatting: true,
      maxRetries: 3,
      timeoutMs: 30000,
    });
  }

  /**
   * Generate a form from a prompt
   */
  async generateForm(prompt: string): Promise<FormGenerationResult> {
    if (!prompt.trim()) {
      return {
        success: false,
        error: 'Please enter a prompt',
      };
    }

    // Log the prompt being used for form generation
    console.log('FormGenerationService.generateForm called with prompt:', {
      promptLength: prompt.length,
      promptPreview:
        prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
      hasAdditionalInfo: prompt.includes(
        'Additional Requirements and Information:'
      ),
      hasMultiLanguage:
        prompt.toLowerCase().includes('english') &&
        (prompt.toLowerCase().includes('spanish') ||
          prompt.toLowerCase().includes('french') ||
          prompt.toLowerCase().includes('german')),
    });

    try {
      // Check if API key is set
      const apiConfig = getCurrentAPIConfig();
      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        return {
          success: false,
          error: `No API key set for ${apiConfig.name}. Please configure it in the Settings.`,
        };
      }

      // Call the UI generation API
      const response = await generateUIFromPrompt(prompt, this.uiSchema);

      // Try to parse the response as JSON
      let parsedResponse = parseJsonSafely(response);
      if (!parsedResponse) {
        return {
          success: false,
          error: 'Failed to parse the generated JSON. Please try again.',
        };
      }

      // Detect multi-language requirements and generate translations
      try {
        console.log('Starting multi-language detection for prompt...');
        const multiLangAnalysis =
          await this.multiLangAgent.detectMultiLanguageRequest(prompt);

        console.log('Multi-language analysis result:', multiLangAnalysis);

        if (
          multiLangAnalysis.isMultiLanguageRequested &&
          multiLangAnalysis.requestedLanguages.length > 1
        ) {
          console.log('Multi-language request detected:', multiLangAnalysis);

          const translationResult =
            await this.translationAgent.generateTranslations({
              formJson: parsedResponse,
              targetLanguages: multiLangAnalysis.requestedLanguages,
              sourceLanguage: 'en',
              languageDetails: multiLangAnalysis.languageDetails,
            });

          if (translationResult.success && translationResult.translations) {
            // Enhance the form with multi-language support
            parsedResponse = {
              ...parsedResponse,
              translations: translationResult.translations,
              defaultLanguage: 'en',
              supportedLanguages: [
                'en',
                ...multiLangAnalysis.requestedLanguages.filter(
                  (lang) => lang !== 'en'
                ),
              ],
              languageDetails: multiLangAnalysis.languageDetails,
            };
            console.log(
              'Translations generated successfully:',
              translationResult.translations
            );
          } else {
            console.warn(
              'Translation generation failed:',
              translationResult.errors
            );
            // Continue with single-language form
          }
        }
      } catch (error) {
        console.error('Error in multi-language processing:', error);
        // Continue with single-language form if multi-language processing fails
      }

      // Validate the response if validation is enabled
      if (!this.skipValidation) {
        const validationResult = this.validateFormSchema(parsedResponse);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validationResult.error}`,
          };
        }
      }

      // Format JSON for display and storage
      const formattedJson = formatJsonForDisplay(parsedResponse);
      const rawJson = getRawJsonForStorage(parsedResponse);

      // Store session in IndexedDB
      let sessionId: string | undefined;
      try {
        sessionId = await FormSessionService.createSession(prompt, rawJson);
        console.log('Session stored with ID:', sessionId);
      } catch (error) {
        console.error('Failed to store session in IndexedDB:', error);
        // Don't fail the generation if storage fails
      }

      return {
        success: true,
        parsedJson: parsedResponse,
        formattedJson,
        rawJson,
        sessionId,
      };
    } catch (error) {
      console.error('Error generating form:', error);
      return {
        success: false,
        error: 'An error occurred while generating the UI/Form.',
      };
    }
  }

  /**
   * Update an existing form with a patch
   */
  async updateForm(
    currentJson: string,
    updatePrompt: string,
    sessionId?: string
  ): Promise<FormUpdateResult> {
    if (!updatePrompt.trim() || !currentJson) {
      return {
        success: false,
        error:
          'Please enter an update prompt and make sure a form is generated',
      };
    }

    try {
      console.log('updateForm - currentJson length:', currentJson?.length);
      console.log(
        'updateForm - currentJson preview:',
        currentJson?.substring(0, 100)
      );

      // First, try to parse the current JSON to ensure it's valid
      const parsedCurrentForm = parseJsonSafely(currentJson);
      if (!parsedCurrentForm) {
        console.error('updateForm - Failed to parse current JSON');
        return {
          success: false,
          error: 'Failed to parse current form JSON',
        };
      }

      console.log('updateForm - Successfully parsed current JSON');

      // Get the raw JSON (without formatting) for the update API
      const rawJsonForUpdate = getRawJsonForStorage(parsedCurrentForm);
      const patch = await updateFormWithPatch(rawJsonForUpdate, updatePrompt);

      // Parse the patch operations
      let patchOperations = JSON.parse(patch);
      if (!Array.isArray(patchOperations)) {
        patchOperations = [patchOperations];
      }

      // Apply the patch operations
      console.log('Applying patch operations:', patchOperations);
      const updatedForm = this.applyPatchOperations(
        parsedCurrentForm,
        patchOperations
      );

      console.log('Updated form structure:', {
        hasApp: !!updatedForm.app,
        hasPages: !!updatedForm.app?.pages,
        pagesLength: updatedForm.app?.pages?.length,
      });

      // Format the updated form
      const formattedJson = formatJsonForDisplay(updatedForm);
      console.log('Formatted JSON length:', formattedJson.length);

      // Test if the formatted JSON is valid
      try {
        JSON.parse(formattedJson);
        console.log('✅ Formatted JSON is valid');
      } catch (parseError) {
        console.error('❌ Formatted JSON is invalid:', parseError);
        console.log('Formatted JSON preview:', formattedJson.substring(0, 200));
      }

      const rawJsonForStorage = getRawJsonForStorage(updatedForm);
      console.log('Raw JSON for storage length:', rawJsonForStorage.length);

      // Test if the raw JSON is valid
      try {
        JSON.parse(rawJsonForStorage);
        console.log('✅ Raw JSON for storage is valid');
      } catch (parseError) {
        console.error('❌ Raw JSON for storage is invalid:', parseError);
        console.log('Raw JSON preview:', rawJsonForStorage.substring(0, 200));
      }

      // Store update in IndexedDB if we have a session
      if (sessionId) {
        try {
          console.log('Storing update in IndexedDB:', {
            sessionId,
            updatePrompt,
            updateType: 'patch',
          });
          await FormSessionService.storeUpdate(
            sessionId,
            updatePrompt,
            rawJsonForStorage,
            'patch'
          );
          console.log('Update stored successfully for session:', sessionId);
        } catch (error) {
          console.error('Failed to store update in IndexedDB:', error);
        }
      } else {
        console.log('No sessionId provided, skipping update storage');
      }

      return {
        success: true,
        updatedJson: formattedJson,
      };
    } catch (error) {
      console.error('Error updating form:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update form',
      };
    }
  }

  /**
   * Validate form against schema
   */
  private validateFormSchema(form: UIJson): {
    isValid: boolean;
    error?: string;
  } {
    try {
      // This would use Ajv validation in a real implementation
      // For now, just check if the form has the required structure
      if (!form.app || !form.app.pages || !Array.isArray(form.app.pages)) {
        return {
          isValid: false,
          error: 'Form must have app.pages array',
        };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation error',
      };
    }
  }

  /**
   * Apply patch operations to a form
   */
  private applyPatchOperations(form: UIJson, operations: unknown[]): UIJson {
    const updatedForm = { ...form } as UIJson;

    for (const operation of operations) {
      const { op, path, value } = operation as {
        op: string;
        path: string;
        value: unknown;
      };
      console.log(`Applying operation: ${op} at path: ${path}`);

      // Sanitize the value to prevent JSON issues
      const sanitizedValue = this.sanitizeValue(value);

      const pathParts = path.split('/').filter(Boolean);
      let current: unknown = updatedForm;

      // Navigate to the parent of the target
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part.match(/^\d+$/)) {
          if (Array.isArray(current)) {
            current = current[parseInt(part)];
          }
        } else {
          if (typeof current === 'object' && current !== null) {
            current = (current as Record<string, unknown>)[part];
          }
        }
      }

      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.match(/^\d+$/)) {
        const index = parseInt(lastPart);
        if (op === 'add') {
          if (Array.isArray(current)) {
            current.splice(index, 0, sanitizedValue);
          }
        } else if (op === 'remove') {
          if (Array.isArray(current)) {
            current.splice(index, 1);
          }
        } else if (op === 'replace') {
          if (Array.isArray(current)) {
            current[index] = sanitizedValue;
          }
        }
      } else {
        if (op === 'add' || op === 'replace') {
          if (typeof current === 'object' && current !== null) {
            (current as Record<string, unknown>)[lastPart] = sanitizedValue;
          }
        } else if (op === 'remove') {
          if (typeof current === 'object' && current !== null) {
            delete (current as Record<string, unknown>)[lastPart];
          }
        }
      }
    }

    return updatedForm;
  }

  /**
   * Sanitize a value to prevent JSON parsing issues
   */
  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // Remove control characters by filtering them out
      return value
        .split('')
        .filter((char) => {
          const code = char.charCodeAt(0);
          return code >= 32 || code === 9 || code === 10 || code === 13;
        })
        .join('');
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize object properties
      if (Array.isArray(value)) {
        const sanitized: unknown[] = [];
        for (let i = 0; i < value.length; i++) {
          sanitized[i] = this.sanitizeValue(value[i]);
        }
        return sanitized;
      } else {
        const sanitized: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = this.sanitizeValue(val);
        }
        return sanitized;
      }
    }
    return value;
  }
}
