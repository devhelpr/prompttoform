import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationService } from '../translation-service';
import { TranslationDictionary } from '../../interfaces/multi-language-interfaces';

describe('TranslationService', () => {
  let translationService: TranslationService;
  let mockTranslations: TranslationDictionary;

  beforeEach(() => {
    mockTranslations = {
      es: {
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
                    required: 'Por favor ingrese su nombre',
                    minLength:
                      'El nombre debe tener al menos {minLength} caracteres',
                  },
                },
              },
            ],
          },
        ],
        ui: {
          nextButton: 'Siguiente',
          previousButton: 'Anterior',
          submitButton: 'Enviar',
          stepIndicator: 'Paso {currentStep} de {totalSteps}',
        },
        errorMessages: {
          required: '{fieldLabel} es requerido',
          minLength: '{fieldLabel} debe tener al menos {minLength} caracteres',
          invalidEmail:
            'Por favor ingrese una dirección de correo válida para {fieldLabel}',
        },
      },
      fr: {
        app: {
          title: "Formulaire d'Inscription",
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
      },
    };

    translationService = new TranslationService(mockTranslations, 'es', 'en');
  });

  describe('Constructor and Basic Setup', () => {
    it('should initialize with default values', () => {
      const service = new TranslationService();
      expect(service.getCurrentLanguage()).toBe('en');
      expect(service.getDefaultLanguage()).toBe('en');
      expect(service.hasTranslations()).toBe(false);
    });

    it('should initialize with provided values', () => {
      expect(translationService.getCurrentLanguage()).toBe('es');
      expect(translationService.getDefaultLanguage()).toBe('en');
      expect(translationService.hasTranslations()).toBe(true);
      expect(translationService.getAvailableLanguages()).toEqual(['es', 'fr']);
    });

    it('should set language correctly', () => {
      translationService.setLanguage('fr');
      expect(translationService.getCurrentLanguage()).toBe('fr');
    });
  });

  describe('Basic Translation', () => {
    it('should translate existing text', () => {
      const result = translationService.translate('app.title');
      expect(result).toBe('Formulario de Registro');
    });

    it('should return fallback for missing translation', () => {
      const result = translationService.translate(
        'app.missing',
        'Fallback Text'
      );
      expect(result).toBe('Fallback Text');
    });

    it('should return path for missing translation without fallback', () => {
      const result = translationService.translate('app.missing');
      expect(result).toBe('app.missing');
    });

    it('should fallback to default language', () => {
      translationService.setLanguage('fr');
      const result = translationService.translate('app.title');
      expect(result).toBe("Formulaire d'Inscription");
    });

    it('should fallback to hardcoded defaults', () => {
      const result = translationService.translate('ui.nextButton');
      expect(result).toBe('Siguiente');
    });
  });

  describe('Placeholder Replacement', () => {
    it('should replace placeholders in translations', () => {
      const result = translationService.translate(
        'ui.stepIndicator',
        undefined,
        undefined,
        {
          currentStep: 2,
          totalSteps: 5,
        }
      );
      expect(result).toBe('Paso 2 de 5');
    });

    it('should replace placeholders in error messages', () => {
      const result = translationService.translate(
        'errorMessages.minLength',
        undefined,
        undefined,
        {
          fieldLabel: 'Nombre',
          minLength: 3,
        }
      );
      expect(result).toBe('Nombre debe tener al menos 3 caracteres');
    });

    it('should handle missing placeholders gracefully', () => {
      const result = translationService.translate(
        'ui.stepIndicator',
        undefined,
        undefined,
        {
          currentStep: 2,
          // missing totalSteps
        }
      );
      expect(result).toBe('Paso 2 de {totalSteps}');
    });
  });

  describe('Specialized Translation Methods', () => {
    it('should translate UI elements', () => {
      const result = translationService.translateUI('nextButton');
      expect(result).toBe('Siguiente');
    });

    it('should translate UI elements with parameters', () => {
      const result = translationService.translateUI('stepIndicator', {
        currentStep: 1,
        totalSteps: 3,
      });
      expect(result).toBe('Paso 1 de 3');
    });

    it('should translate error messages', () => {
      const result = translationService.translateError('required', 'Nombre');
      expect(result).toBe('Nombre es requerido');
    });

    it('should translate error messages with parameters', () => {
      const result = translationService.translateError('minLength', 'Nombre', {
        minLength: 5,
      });
      expect(result).toBe('Nombre debe tener al menos 5 caracteres');
    });

    it('should translate component properties', () => {
      const result = translationService.translateComponent(
        'firstName',
        0,
        'label',
        'First Name'
      );
      expect(result).toBe('Nombre');
    });

    it('should translate component properties with fallback', () => {
      const result = translationService.translateComponent(
        'lastName',
        0,
        'label',
        'Last Name'
      );
      expect(result).toBe('Last Name');
    });

    it('should translate page properties', () => {
      const result = translationService.translatePage(0, 'title', 'Page 1');
      expect(result).toBe('Información Personal');
    });

    it('should translate app properties', () => {
      const result = translationService.translateApp('title', 'App Title');
      expect(result).toBe('Formulario de Registro');
    });
  });

  describe('Default Text Fallbacks', () => {
    it('should use default UI text when no translation exists', () => {
      const service = new TranslationService({}, 'en', 'en');
      const result = service.translateUI('nextButton');
      expect(result).toBe('Next');
    });

    it('should use default error message when no translation exists', () => {
      const service = new TranslationService({}, 'en', 'en');
      const result = service.translateError('required', 'Name');
      expect(result).toBe('Name is required');
    });

    it('should use default error message with parameters', () => {
      const service = new TranslationService({}, 'en', 'en');
      const result = service.translateError('minLength', 'Name', {
        minLength: 3,
      });
      expect(result).toBe('Name must be at least 3 characters long');
    });
  });

  describe('Language Switching', () => {
    it('should switch language and return new translations', () => {
      translationService.setLanguage('fr');
      const result = translationService.translate('ui.nextButton');
      expect(result).toBe('Suivant');
    });

    it('should maintain fallback behavior after language switch', () => {
      translationService.setLanguage('fr');
      const result = translationService.translate('app.title');
      expect(result).toBe("Formulaire d'Inscription");
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty translations object', () => {
      const service = new TranslationService({}, 'es', 'en');
      const result = service.translate('ui.nextButton');
      expect(result).toBe('Next'); // Should fallback to default
    });

    it('should handle null/undefined parameters', () => {
      const result = translationService.translate(
        'ui.nextButton',
        undefined,
        undefined,
        undefined
      );
      expect(result).toBe('Siguiente');
    });

    it('should handle empty string translations', () => {
      const emptyTranslations = {
        es: {
          ui: {
            nextButton: '',
          },
        },
      };
      const service = new TranslationService(emptyTranslations, 'es', 'en');
      const result = service.translate('ui.nextButton');
      expect(result).toBe('Next'); // Should fallback to default
    });

    it('should handle malformed translation paths', () => {
      const result = translationService.translate(
        'invalid.path.with.many.parts'
      );
      expect(result).toBe('invalid.path.with.many.parts');
    });
  });

  describe('replacePlaceholders', () => {
    it('should replace placeholders correctly', () => {
      const text = 'Hello {name}, you have {count} messages';
      const params = { name: 'John', count: 5 };
      const result = translationService.replacePlaceholders(text, params);
      expect(result).toBe('Hello John, you have 5 messages');
    });

    it('should handle missing parameters', () => {
      const text = 'Hello {name}, you have {count} messages';
      const params = { name: 'John' };
      const result = translationService.replacePlaceholders(text, params);
      expect(result).toBe('Hello John, you have {count} messages');
    });

    it('should handle no parameters', () => {
      const text = 'Hello {name}';
      const result = translationService.replacePlaceholders(text);
      expect(result).toBe('Hello {name}');
    });

    it('should handle empty string', () => {
      const result = translationService.replacePlaceholders('', {
        name: 'John',
      });
      expect(result).toBe('');
    });
  });
});
