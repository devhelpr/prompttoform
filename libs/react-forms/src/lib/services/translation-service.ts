import {
  TranslationDictionary,
  MultiLanguageFormDefinition,
} from '../interfaces/multi-language-interfaces';

export class TranslationService {
  private translations: TranslationDictionary;
  private currentLanguage: string;
  private defaultLanguage: string;

  // Default English texts for fallback
  private readonly defaultTexts = {
    ui: {
      stepIndicator: 'Step {currentStep} of {totalSteps}',
      nextButton: 'Next',
      previousButton: 'Previous',
      submitButton: 'Submit',
      confirmSubmitButton: 'Confirm & Submit',
      reviewConfirmButton: 'Review & Confirm',
      submissionsTitle: 'Form Submissions',
      noSubmissionsText: 'No submissions yet',
      thankYouTitle: 'Thank You!',
      thankYouMessage: 'Your form has been submitted successfully.',
      restartButton: 'Submit Another Response',
      multiPageInfo: 'This application has {pageCount} pages',
      invalidFormData: 'Invalid form data',
      noPagesDefined: 'No pages defined in form',
      invalidPageIndex: 'Invalid page index',
      noContentInSection: 'No content in this section',
      addItemButton: 'Add Item',
      removeItemButton: 'Remove',
      addAnotherButton: 'Add Another',
      requiredIndicator: '*',
      requiredText: 'Required',
      loadingText: 'Loading...',
      submittingText: 'Submitting...',
      requiredFieldAriaLabel: 'Required field',
      optionalFieldAriaLabel: 'Optional field',
      errorAriaLabel: 'Error',
      successAriaLabel: 'Success',
    },
    errorMessages: {
      required: '{fieldLabel} is required',
      minLength: '{fieldLabel} must be at least {minLength} characters long',
      maxLength: '{fieldLabel} cannot exceed {maxLength} characters',
      pattern: '{fieldLabel} format is invalid',
      minItems: 'Please select at least {minItems} items for {fieldLabel}',
      maxItems: 'Please select no more than {maxItems} items for {fieldLabel}',
      minDate: '{fieldLabel} must be on or after {minDate}',
      maxDate: '{fieldLabel} must be before {maxDate}',
      min: '{fieldLabel} must be at least {min}',
      max: '{fieldLabel} cannot exceed {max}',
      invalidFormat: '{fieldLabel} format is invalid',
      invalidEmail: 'Please enter a valid email address for {fieldLabel}',
      invalidNumber: 'Please enter a valid number for {fieldLabel}',
      invalidDate: 'Please enter a valid date for {fieldLabel}',
      generic: '{fieldLabel} is invalid',
    },
  };

  constructor(
    translations: TranslationDictionary = {},
    currentLanguage: string = 'en',
    defaultLanguage: string = 'en'
  ) {
    this.translations = translations;
    this.currentLanguage = currentLanguage;
    this.defaultLanguage = defaultLanguage;
  }

  setLanguage(language: string): void {
    this.currentLanguage = language;
  }

  translate(
    path: string,
    fallback?: string,
    language?: string,
    params?: Record<string, string | number>
  ): string {
    const lang = language || this.currentLanguage;
    let translation = this.getTranslationByPath(path, lang);

    // If we have a fallback and it's different from the stored translation,
    // prioritize the fallback for dynamic content (like page titles)
    if (fallback && translation && translation !== fallback) {
      // For dynamic content like page titles, use the fallback if it's different
      if (path.includes('.title') || path.includes('pages.')) {
        return this.replacePlaceholders(fallback, params);
      }
    }

    if (translation) {
      return this.replacePlaceholders(translation, params);
    }

    // Fallback to default language
    if (lang !== this.defaultLanguage) {
      const defaultTranslation = this.getTranslationByPath(
        path,
        this.defaultLanguage
      );
      if (defaultTranslation) {
        return this.replacePlaceholders(defaultTranslation, params);
      }
    }

    // Fallback to hardcoded English defaults
    const defaultText = this.getDefaultText(path);
    if (defaultText) {
      return this.replacePlaceholders(defaultText, params);
    }

    return fallback || path;
  }

  // Specialized translation methods for different text types
  translateUI(
    key: keyof typeof this.defaultTexts.ui,
    params?: Record<string, string | number>
  ): string {
    return this.translate(`ui.${key}`, undefined, undefined, params);
  }

  translateError(
    errorType: keyof typeof this.defaultTexts.errorMessages,
    fieldLabel: string,
    params?: Record<string, string | number>
  ): string {
    const errorParams = { fieldLabel, ...params };
    return this.translate(
      `errorMessages.${errorType}`,
      undefined,
      undefined,
      errorParams
    );
  }

  translateComponent(
    componentId: string,
    pageIndex: number,
    property: string,
    fallback?: string
  ): string {
    // Find the component by ID in the specified page
    const pageTranslations =
      this.translations[this.currentLanguage]?.pages?.[pageIndex];
    if (pageTranslations?.components) {
      const component = pageTranslations.components.find(
        (comp) => comp.id === componentId
      );
      if (component) {
        const pathParts = property.split('.');
        let current: any = component;
        for (const part of pathParts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            return fallback !== undefined ? fallback : property;
          }
        }

        // If we have a fallback and it's different from the stored translation,
        // prioritize the fallback for dynamic content (like component labels)
        if (fallback && typeof current === 'string' && current !== fallback) {
          // For dynamic content like component labels, use the fallback if it's different
          if (
            property === 'label' ||
            property.includes('label') ||
            property.includes('placeholder')
          ) {
            return fallback;
          }
        }

        return typeof current === 'string'
          ? current
          : fallback !== undefined
          ? fallback
          : property;
      }
    }
    return fallback !== undefined ? fallback : property;
  }

  translatePage(
    pageIndex: number,
    property: string,
    fallback?: string
  ): string {
    const path = `pages.${pageIndex}.${property}`;
    return this.translate(path, fallback);
  }

  translateApp(property: string, fallback?: string): string {
    return this.translate(`app.${property}`, fallback);
  }

  private getTranslationByPath(
    path: string,
    language: string
  ): string | undefined {
    const langTranslations = this.translations[language];
    if (!langTranslations) return undefined;

    const pathParts = path.split('.');
    let current: any = langTranslations;

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  private getDefaultText(path: string): string | undefined {
    const pathParts = path.split('.');
    let current: any = this.defaultTexts;

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  replacePlaceholders(
    text: string,
    params?: Record<string, string | number>
  ): string {
    if (!params) return text;

    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return String(params[key] || match);
    });
  }

  getAvailableLanguages(): string[] {
    return Object.keys(this.translations);
  }

  hasTranslations(): boolean {
    return Object.keys(this.translations).length > 0;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getDefaultLanguage(): string {
    return this.defaultLanguage;
  }
}
