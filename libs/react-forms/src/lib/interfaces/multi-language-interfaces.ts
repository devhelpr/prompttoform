import {
  FormDefinition,
  FormRendererSettings as BaseFormRendererSettings,
} from './form-interfaces';

export interface TranslationDictionary {
  [languageCode: string]: {
    app?: {
      title?: string;
    };
    pages?: Array<{
      id: string;
      title?: string;
      components?: Array<{
        id: string;
        label?: string;
        props?: {
          placeholder?: string;
          helperText?: string;
          options?: Array<{
            label?: string;
            value: any;
          }>;
        };
        validation?: {
          errorMessages?: {
            [key: string]: string;
          };
        };
      }>;
    }>;
    thankYouPage?: {
      title?: string;
      message?: string;
      customActions?: Array<{
        label?: string;
      }>;
    };
    // UI Text Translations
    ui?: {
      // Navigation
      stepIndicator?: string; // Default: "Step {currentStep} of {totalSteps}"
      nextButton?: string; // Default: "Next"
      previousButton?: string; // Default: "Previous"
      submitButton?: string; // Default: "Submit"
      confirmSubmitButton?: string; // Default: "Confirm & Submit"
      reviewConfirmButton?: string; // Default: "Review & Confirm"

      // Form Submissions
      submissionsTitle?: string; // Default: "Form Submissions"
      noSubmissionsText?: string; // Default: "No submissions yet"

      // Thank You Page
      thankYouTitle?: string; // Default: "Thank You!"
      thankYouMessage?: string; // Default: "Your form has been submitted successfully."
      restartButton?: string; // Default: "Submit Another Response"

      // Form Info
      multiPageInfo?: string; // Default: "This application has {pageCount} pages"

      // Error Messages
      invalidFormData?: string; // Default: "Invalid form data"
      noPagesDefined?: string; // Default: "No pages defined in form"
      invalidPageIndex?: string; // Default: "Invalid page index"
      noContentInSection?: string; // Default: "No content in this section"

      // Array Component Actions
      addItemButton?: string; // Default: "Add Item"
      removeItemButton?: string; // Default: "Remove"
      addAnotherButton?: string; // Default: "Add Another"

      // Required Field Indicator
      requiredIndicator?: string; // Default: "*"
      requiredText?: string; // Default: "Required"

      // Loading States
      loadingText?: string; // Default: "Loading..."
      submittingText?: string; // Default: "Submitting..."

      // Accessibility
      requiredFieldAriaLabel?: string; // Default: "Required field"
      optionalFieldAriaLabel?: string; // Default: "Optional field"
      errorAriaLabel?: string; // Default: "Error"
      successAriaLabel?: string; // Default: "Success"
    };
    // Default Error Messages
    errorMessages?: {
      required?: string; // Default: "{fieldLabel} is required"
      minLength?: string; // Default: "{fieldLabel} must be at least {minLength} characters long"
      maxLength?: string; // Default: "{fieldLabel} cannot exceed {maxLength} characters"
      pattern?: string; // Default: "{fieldLabel} format is invalid"
      minItems?: string; // Default: "Please select at least {minItems} items for {fieldLabel}"
      maxItems?: string; // Default: "Please select no more than {maxItems} items for {fieldLabel}"
      minDate?: string; // Default: "{fieldLabel} must be on or after {minDate}"
      maxDate?: string; // Default: "{fieldLabel} must be before {maxDate}"
      min?: string; // Default: "{fieldLabel} must be at least {min}"
      max?: string; // Default: "{fieldLabel} cannot exceed {max}"
      invalidFormat?: string; // Default: "{fieldLabel} format is invalid"
      invalidEmail?: string; // Default: "Please enter a valid email address for {fieldLabel}"
      invalidNumber?: string; // Default: "Please enter a valid number for {fieldLabel}"
      invalidDate?: string; // Default: "Please enter a valid date for {fieldLabel}"
      generic?: string; // Default: "{fieldLabel} is invalid"
    };
  };
}

export interface MultiLanguageFormDefinition {
  app: FormDefinition['app'];
  translations?: TranslationDictionary;
  defaultLanguage?: string;
  supportedLanguages?: string[];
  languageDetails?: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

export interface FormRendererSettings extends BaseFormRendererSettings {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}
