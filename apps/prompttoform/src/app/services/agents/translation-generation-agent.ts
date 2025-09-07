import { generateResponse } from '../llm-api';
import {
  TranslationRequest,
  TranslationResult,
  TranslationConfig,
} from '../../types/multi-language-agent.types';

export class TranslationGenerationAgent {
  private config: TranslationConfig;

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  /**
   * Generate translations for a form in multiple languages
   */
  async generateTranslations(
    request: TranslationRequest
  ): Promise<TranslationResult> {
    const startTime = Date.now();
    const translations: Record<string, any> = {};
    const errors: string[] = [];

    try {
      // Handle empty target languages
      if (!request.targetLanguages || request.targetLanguages.length === 0) {
        return {
          success: true,
          translations: {},
          processingTime: Date.now() - startTime,
        };
      }

      for (const language of request.targetLanguages) {
        try {
          const languagePrompt = this.buildComprehensiveLanguagePrompt(
            request.formJson,
            language,
            request.sourceLanguage,
            request.languageDetails
          );

          const response = await this.retryWithBackoff(
            () => generateResponse(languagePrompt),
            this.config.maxRetries,
            1000
          );

          const parsedResponse = this.parseTranslationResponse(response);
          if (parsedResponse.isValid) {
            translations[language] = parsedResponse.data;
          } else {
            errors.push(
              `Invalid translation response for ${language}: ${parsedResponse.errors?.join(
                ', '
              )}`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to translate to ${language}: ${errorMessage}`);
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        success: errors.length === 0,
        translations:
          Object.keys(translations).length > 0 ? translations : undefined,
        errors: errors.length > 0 ? errors : undefined,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        errors: [
          `Translation generation failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        ],
        processingTime,
      };
    }
  }

  /**
   * Build comprehensive language prompt for translation
   */
  private buildComprehensiveLanguagePrompt(
    formJson: any,
    targetLanguage: string,
    sourceLanguage = 'en',
    languageDetails?: Array<{ code: string; name: string; nativeName: string }>
  ): string {
    const getLanguageName = (langCode: string, useNative = false): string => {
      if (languageDetails) {
        const langDetail = languageDetails.find((l) => l.code === langCode);
        if (langDetail) {
          return useNative ? langDetail.nativeName : langDetail.name;
        }
      }
      return langCode.toUpperCase();
    };

    const sourceLanguageName = getLanguageName(sourceLanguage);
    const targetLanguageName = getLanguageName(targetLanguage);
    const targetLanguageNativeName = getLanguageName(targetLanguage, true);

    return `Translate the following form content from ${sourceLanguageName} to ${targetLanguageName} (${targetLanguageNativeName}).

IMPORTANT INSTRUCTIONS:
1. Translate ALL text content including labels, placeholders, helper text, button text, error messages, and UI elements
2. Preserve the exact JSON structure - only translate string values
3. Keep all IDs, values, and technical properties unchanged
4. For select/radio options, translate the "label" but keep the "value" unchanged
5. For error messages, preserve placeholder syntax like {fieldLabel}, {minLength}, etc.
6. Maintain the same tone and formality level as the original
7. Ensure translations are culturally appropriate and natural
8. For UI elements, use common conventions in the target language

FORM JSON TO TRANSLATE:
${JSON.stringify(formJson, null, 2)}

REQUIRED TRANSLATION STRUCTURE:
You must return a complete JSON object with the following structure:
{
  "app": {
    "title": "translated app title"
  },
  "pages": [
    {
      "id": "same as original",
      "title": "translated page title",
      "components": [
        {
          "id": "same as original",
          "label": "translated component label",
          "props": {
            "placeholder": "translated placeholder",
            "helperText": "translated helper text",
            "options": [
              {
                "label": "translated option label",
                "value": "same as original"
              }
            ]
          },
          "validation": {
            "errorMessages": {
              "required": "translated error message with {fieldLabel} placeholder",
              "minLength": "translated error message with {fieldLabel} and {minLength} placeholders"
            }
          }
        }
      ]
    }
  ],
  "thankYouPage": {
    "title": "translated thank you title",
    "message": "translated thank you message",
    "customActions": [
      {
        "label": "translated action label"
      }
    ]
  },
  "ui": {
    "stepIndicator": "translated step indicator (preserve {currentStep} and {totalSteps} placeholders)",
    "nextButton": "translated next button text",
    "previousButton": "translated previous button text",
    "submitButton": "translated submit button text",
    "confirmSubmitButton": "translated confirm submit button text",
    "reviewConfirmButton": "translated review confirm button text",
    "submissionsTitle": "translated submissions title",
    "noSubmissionsText": "translated no submissions text",
    "thankYouTitle": "translated thank you title",
    "thankYouMessage": "translated thank you message",
    "restartButton": "translated restart button text",
    "multiPageInfo": "translated multi-page info (preserve {pageCount} placeholder)",
    "invalidFormData": "translated invalid form data message",
    "noPagesDefined": "translated no pages defined message",
    "invalidPageIndex": "translated invalid page index message",
    "noContentInSection": "translated no content in section message",
    "addItemButton": "translated add item button text",
    "removeItemButton": "translated remove item button text",
    "addAnotherButton": "translated add another button text",
    "requiredIndicator": "translated required indicator",
    "requiredText": "translated required text",
    "loadingText": "translated loading text",
    "submittingText": "translated submitting text",
    "requiredFieldAriaLabel": "translated required field ARIA label",
    "optionalFieldAriaLabel": "translated optional field ARIA label",
    "errorAriaLabel": "translated error ARIA label",
    "successAriaLabel": "translated success ARIA label"
  },
  "errorMessages": {
    "required": "translated required error (preserve {fieldLabel} placeholder)",
    "minLength": "translated min length error (preserve {fieldLabel} and {minLength} placeholders)",
    "maxLength": "translated max length error (preserve {fieldLabel} and {maxLength} placeholders)",
    "pattern": "translated pattern error (preserve {fieldLabel} placeholder)",
    "minItems": "translated min items error (preserve {fieldLabel} and {minItems} placeholders)",
    "maxItems": "translated max items error (preserve {fieldLabel} and {maxItems} placeholders)",
    "minDate": "translated min date error (preserve {fieldLabel} and {minDate} placeholders)",
    "maxDate": "translated max date error (preserve {fieldLabel} and {maxDate} placeholders)",
    "min": "translated min error (preserve {fieldLabel} and {min} placeholders)",
    "max": "translated max error (preserve {fieldLabel} and {max} placeholders)",
    "invalidFormat": "translated invalid format error (preserve {fieldLabel} placeholder)",
    "invalidEmail": "translated invalid email error (preserve {fieldLabel} placeholder)",
    "invalidNumber": "translated invalid number error (preserve {fieldLabel} placeholder)",
    "invalidDate": "translated invalid date error (preserve {fieldLabel} placeholder)",
    "generic": "translated generic error (preserve {fieldLabel} placeholder)"
  }
}

Return ONLY the translated JSON object, no additional text or explanations.`;
  }

  /**
   * Parse translation response from LLM
   */
  private parseTranslationResponse(response: string): {
    isValid: boolean;
    data?: any;
    errors?: string[];
  } {
    try {
      const parsed = JSON.parse(response);
      const validation = this.validateTranslationResponse(parsed);

      if (validation.isValid) {
        return { isValid: true, data: parsed };
      } else {
        return { isValid: false, errors: validation.errors };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Error parsing translation response: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        ],
      };
    }
  }

  /**
   * Validate translation response structure
   */
  private validateTranslationResponse(response: any): {
    isValid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];

    if (!response || typeof response !== 'object') {
      errors.push('Response is null or undefined');
      return { isValid: false, errors };
    }

    // More strict validation - require at least one main section
    if (
      !response.app &&
      !response.pages &&
      !response.ui &&
      !response.errorMessages
    ) {
      errors.push('Response contains no recognizable translation content');
    }

    // If response has content but is missing critical sections, it's invalid
    if (response.app && typeof response.app !== 'object') {
      errors.push('App section must be an object');
    }

    if (response.pages && !Array.isArray(response.pages)) {
      errors.push('Pages section must be an array');
    }

    if (response.ui && typeof response.ui !== 'object') {
      errors.push('UI section must be an object');
    }

    if (response.errorMessages && typeof response.errorMessages !== 'object') {
      errors.push('Error messages section must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    baseDelay: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxRetries - 1) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
