import { describe, it, expect } from 'vitest';
import {
  TranslationDictionary,
  MultiLanguageFormDefinition,
  FormRendererSettings,
} from '../multi-language-interfaces';

describe('Multi-Language Interfaces', () => {
  describe('TranslationDictionary', () => {
    it('should allow valid translation structure', () => {
      const translations: TranslationDictionary = {
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
                    options: [{ label: 'Opción 1', value: 'option1' }],
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
          thankYouPage: {
            title: '¡Gracias!',
            message: 'Su formulario ha sido enviado exitosamente.',
            customActions: [{ label: 'Enviar otra respuesta' }],
          },
          ui: {
            nextButton: 'Siguiente',
            previousButton: 'Anterior',
            submitButton: 'Enviar',
            stepIndicator: 'Paso {currentStep} de {totalSteps}',
            requiredIndicator: '*',
            addItemButton: 'Agregar Elemento',
            removeItemButton: 'Eliminar',
            loadingText: 'Cargando...',
            submittingText: 'Enviando...',
            requiredFieldAriaLabel: 'Campo requerido',
            errorAriaLabel: 'Error',
          },
          errorMessages: {
            required: '{fieldLabel} es requerido',
            minLength:
              '{fieldLabel} debe tener al menos {minLength} caracteres',
            maxLength: '{fieldLabel} no puede exceder {maxLength} caracteres',
            pattern: 'El formato de {fieldLabel} es inválido',
            minItems:
              'Por favor seleccione al menos {minItems} elementos para {fieldLabel}',
            maxItems:
              'Por favor seleccione no más de {maxItems} elementos para {fieldLabel}',
            minDate: '{fieldLabel} debe ser en o después de {minDate}',
            maxDate: '{fieldLabel} debe ser antes de {maxDate}',
            min: '{fieldLabel} debe ser al menos {min}',
            max: '{fieldLabel} no puede exceder {max}',
            invalidFormat: 'El formato de {fieldLabel} es inválido',
            invalidEmail:
              'Por favor ingrese una dirección de correo válida para {fieldLabel}',
            invalidNumber:
              'Por favor ingrese un número válido para {fieldLabel}',
            invalidDate: 'Por favor ingrese una fecha válida para {fieldLabel}',
            generic: '{fieldLabel} es inválido',
          },
        },
      };

      expect(translations.es.app?.title).toBe('Formulario de Registro');
      expect(translations.es.pages?.[0].title).toBe('Información Personal');
      expect(translations.es.pages?.[0].components?.[0].label).toBe('Nombre');
      expect(translations.es.ui?.nextButton).toBe('Siguiente');
      expect(translations.es.errorMessages?.required).toBe(
        '{fieldLabel} es requerido'
      );
    });

    it('should allow partial translation structures', () => {
      const partialTranslations: TranslationDictionary = {
        fr: {
          app: {
            title: "Formulaire d'Inscription",
          },
          ui: {
            nextButton: 'Suivant',
          },
          // Missing pages, thankYouPage, errorMessages
        },
      };

      expect(partialTranslations.fr.app?.title).toBe(
        "Formulaire d'Inscription"
      );
      expect(partialTranslations.fr.ui?.nextButton).toBe('Suivant');
      expect(partialTranslations.fr.pages).toBeUndefined();
    });

    it('should allow empty translation objects', () => {
      const emptyTranslations: TranslationDictionary = {
        de: {},
      };

      expect(emptyTranslations.de).toBeDefined();
      expect(emptyTranslations.de.app).toBeUndefined();
    });
  });

  describe('MultiLanguageFormDefinition', () => {
    it('should allow complete multi-language form definition', () => {
      const multiLangForm: MultiLanguageFormDefinition = {
        app: {
          title: 'User Registration Form',
          pages: [
            {
              id: 'page1',
              title: 'Personal Information',
              route: '/page1',
              components: [
                {
                  type: 'input',
                  id: 'firstName',
                  label: 'First Name',
                  validation: { required: true },
                },
              ],
            },
          ],
        },
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
                  },
                ],
              },
            ],
          },
        },
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es'],
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ],
      };

      expect(multiLangForm.app.title).toBe('User Registration Form');
      expect(multiLangForm.defaultLanguage).toBe('en');
      expect(multiLangForm.supportedLanguages).toEqual(['en', 'es']);
      expect(multiLangForm.languageDetails?.[0].nativeName).toBe('English');
      expect(multiLangForm.languageDetails?.[1].nativeName).toBe('Español');
    });

    it('should allow minimal multi-language form definition', () => {
      const minimalForm: MultiLanguageFormDefinition = {
        app: {
          title: 'Simple Form',
          pages: [
            {
              id: 'page1',
              title: 'Page 1',
              route: '/page1',
              components: [],
            },
          ],
        },
        // Missing translations, defaultLanguage, supportedLanguages, languageDetails
      };

      expect(minimalForm.app.title).toBe('Simple Form');
      expect(minimalForm.translations).toBeUndefined();
      expect(minimalForm.defaultLanguage).toBeUndefined();
    });

    it('should allow form with only language details', () => {
      const formWithDetails: MultiLanguageFormDefinition = {
        app: {
          title: 'Form with Language Details',
          pages: [
            {
              id: 'page1',
              title: 'Page 1',
              route: '/page1',
              components: [],
            },
          ],
        },
        languageDetails: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'zh', name: 'Chinese', nativeName: '中文' },
        ],
      };

      expect(formWithDetails.languageDetails?.[1].nativeName).toBe('中文');
    });
  });

  describe('FormRendererSettings', () => {
    it('should allow settings with language properties', () => {
      const settings: FormRendererSettings = {
        currentLanguage: 'es',
        onLanguageChange: (language: string) => {
          console.log('Language changed to:', language);
        },
      };

      expect(settings.currentLanguage).toBe('es');
      expect(typeof settings.onLanguageChange).toBe('function');
    });

    it('should allow settings without language properties', () => {
      const settings: FormRendererSettings = {};

      expect(settings.currentLanguage).toBeUndefined();
      expect(settings.onLanguageChange).toBeUndefined();
    });
  });

  describe('Language Details Structure', () => {
    it('should validate language details structure', () => {
      const languageDetails = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'ko', name: 'Korean', nativeName: '한국어' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      ];

      languageDetails.forEach((lang) => {
        expect(lang.code).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.nativeName).toBe('string');
        expect(lang.name.length).toBeGreaterThan(0);
        expect(lang.nativeName.length).toBeGreaterThan(0);
      });
    });

    it('should handle special characters in native names', () => {
      const specialLanguageDetails = [
        { code: 'zh', name: 'Chinese', nativeName: '中文' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'ko', name: 'Korean', nativeName: '한국어' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
        { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
        { code: 'th', name: 'Thai', nativeName: 'ไทย' },
      ];

      specialLanguageDetails.forEach((lang) => {
        expect(lang.nativeName).toBeDefined();
        expect(lang.nativeName.length).toBeGreaterThan(0);
      });
    });
  });
});
