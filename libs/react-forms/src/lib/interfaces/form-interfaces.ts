import { FieldType } from '../types/field-types';
import { ExpressionConfig } from './expression-interfaces';

export interface DateRange {
  minDate?: string;
  maxDate?: string;
}

export interface FormComponentFieldProps {
  type: FieldType;
  id: string;
  label?: string;
  defaultValue?: unknown;
  expression?: ExpressionConfig;
  options?: { label: string; value: string }[];
  props?: Record<string, unknown> & {
    inputType?: string;
    min?: number;
    max?: number;
    placeholder?: string;
    helperText?: string;
    rows?: number;
    buttonType?: string;
    onClick?: string;
    step?: number;
    showLabels?: boolean;
    showValue?: boolean;
    mode?: 'single' | 'range';
    confirmationSettings?: {
      showSummary?: boolean;
      groupBySection?: boolean;
      excludeFields?: string[];
      customTitle?: string;
      customMessage?: string;
    };
    expression?: ExpressionConfig;
  } & DateRange;
  children?: FormComponentFieldProps[];
  visibilityConditions?: VisibilityCondition[];
  eventHandlers?: {
    onClick?: ActionType;
    onSubmit?: ActionType;
    onChange?: ActionType;
  };
  arrayItems?: ArrayItem[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
    min?: number;
    max?: number;
    minRange?: number;
    maxRange?: number;
    minValueMin?: number;
    minValueMax?: number;
    maxValueMin?: number;
    maxValueMax?: number;
    errorMessages?: {
      required?: string;
      minLength?: string;
      maxLength?: string;
      pattern?: string;
      minItems?: string;
      maxItems?: string;
      minDate?: string;
      maxDate?: string;
      min?: string;
      max?: string;
      invalidFormat?: string;
      invalidEmail?: string;
      invalidNumber?: string;
      invalidDate?: string;
      minRange?: string;
      maxRange?: string;
      minValueMin?: string;
      minValueMax?: string;
      maxValueMin?: string;
      maxValueMax?: string;
    };
  } & DateRange;
}

export interface PageProps {
  id: string;
  title: string;
  route: string;
  layout?: string;
  components: FormComponentFieldProps[];
  isEndPage?: boolean;
  isConfirmationPage?: boolean;
  branches?: Array<{
    condition: {
      field: string;
      operator: string;
      value: string;
    };
    nextPage: string;
  }>;
  nextPage?: string;
}

export interface FormDefinition {
  app: {
    title: string;
    version?: string;
    language?: string;
    theme?: string;
    settings?: {
      showProgressBar?: boolean;
      showStepNumbers?: boolean;
      allowBackNavigation?: boolean;
      submitButtonText?: string;
      nextButtonText?: string;
      previousButtonText?: string;
      showRestartButton?: boolean;
      restartButtonText?: string;
    };
    pages: PageProps[];
    dataSources?: Record<string, unknown>[];
    thankYouPage?: ThankYouPage;
  };
}

export interface FormRendererTheme {
  colors?: {
    primary?: string;
    secondary?: string;
    error?: string;
    success?: string;
    background?: string;
    text?: string;
    border?: string;
  };
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
}

export interface FormRendererTexts {
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
}

/**
 * Color-related CSS classes for form components
 * These classes control colors, backgrounds, borders, and text colors
 */
export interface FormRendererColorClasses {
  // Layout Colors
  container?: string;
  header?: string;
  headerTitle?: string;
  page?: string;
  pageTitle?: string;

  // Navigation Colors
  stepIndicator?: string;
  stepIndicatorItem?: string;
  stepIndicatorActive?: string;
  navigationButtons?: string;
  nextButton?: string;
  previousButton?: string;

  // Form Field Colors
  field?: string;
  fieldLabel?: string;
  fieldInput?: string;
  fieldTextarea?: string;
  fieldSelect?: string;
  fieldCheckbox?: string;
  fieldRadio?: string;
  fieldDate?: string;
  fieldSlider?: string;
  fieldText?: string;
  fieldError?: string;
  fieldHelperText?: string;

  // Special Component Colors
  confirmationField?: string;
  arrayField?: string;
  arrayItem?: string;
  arrayAddButton?: string;
  arrayRemoveButton?: string;

  // Submissions Colors
  submissionsContainer?: string;
  submissionsTitle?: string;
  submissionsData?: string;

  // Thank You Page Colors
  thankYouContainer?: string;
  thankYouMessageContainer?: string;
  thankYouTitle?: string;
  thankYouMessage?: string;
  thankYouButton?: string;

  // Error and Status Colors
  errorMessage?: string;
  invalidFormData?: string;
  noPagesDefined?: string;
  invalidPageIndex?: string;
  noSubmissionsText?: string;
  unsupportedComponent?: string;
  unsupportedArrayComponent?: string;
  thankYouNotConfigured?: string;

  // Form Layout Colors
  formLayout?: string;
  tableHeader?: string;
  tableCell?: string;
  arrayItemContainer?: string;
  arrayItemField?: string;
  requiredIndicator?: string;
}

/**
 * Style and layout CSS classes for form components
 * These classes control spacing, sizing, positioning, borders, shadows, etc.
 */
export interface FormRendererStyleClasses {
  // Layout Styles
  container?: string;
  header?: string;
  headerTitle?: string;
  page?: string;
  pageTitle?: string;

  // Navigation Styles
  stepIndicator?: string;
  stepIndicatorItem?: string;
  stepIndicatorActive?: string;
  navigationButtons?: string;
  nextButton?: string;
  previousButton?: string;

  // Form Field Styles
  field?: string;
  fieldLabel?: string;
  fieldInput?: string;
  fieldTextarea?: string;
  fieldSelect?: string;
  fieldCheckbox?: string;
  fieldRadio?: string;
  fieldDate?: string;
  fieldSlider?: string;
  fieldText?: string;
  fieldError?: string;
  fieldHelperText?: string;

  // Special Component Styles
  confirmationField?: string;
  arrayField?: string;
  arrayItem?: string;
  arrayAddButton?: string;
  arrayRemoveButton?: string;

  // Submissions Styles
  submissionsContainer?: string;
  submissionsTitle?: string;
  submissionsData?: string;

  // Thank You Page Styles
  thankYouContainer?: string;
  thankYouMessageContainer?: string;
  thankYouTitle?: string;
  thankYouMessage?: string;
  thankYouButton?: string;

  // Error and Status Styles
  errorMessage?: string;
  invalidFormData?: string;
  noPagesDefined?: string;
  invalidPageIndex?: string;
  noSubmissionsText?: string;
  unsupportedComponent?: string;
  unsupportedArrayComponent?: string;
  thankYouNotConfigured?: string;

  // Form Layout Styles
  formLayout?: string;
  tableHeader?: string;
  tableCell?: string;
  arrayItemContainer?: string;
  arrayItemField?: string;
  requiredIndicator?: string;
}

/**
 * @deprecated Use FormRendererColorClasses and FormRendererStyleClasses instead
 * Legacy interface for backward compatibility
 */
export interface FormRendererClasses {
  // Layout
  container?: string;
  header?: string;
  headerTitle?: string;
  page?: string;
  pageTitle?: string;

  // Navigation
  stepIndicator?: string;
  stepIndicatorItem?: string;
  stepIndicatorActive?: string;
  navigationButtons?: string;
  nextButton?: string;
  previousButton?: string;

  // Form Fields
  field?: string;
  fieldLabel?: string;
  fieldInput?: string;
  fieldTextarea?: string;
  fieldSelect?: string;
  fieldCheckbox?: string;
  fieldRadio?: string;
  fieldDate?: string;
  fieldSlider?: string;
  fieldText?: string;
  fieldError?: string;
  fieldHelperText?: string;

  // Special Components
  confirmationField?: string;
  arrayField?: string;
  arrayItem?: string;
  arrayAddButton?: string;
  arrayRemoveButton?: string;

  // Submissions
  submissionsContainer?: string;
  submissionsTitle?: string;
  submissionsData?: string;

  // Thank You Page
  thankYouContainer?: string;
  thankYouTitle?: string;
  thankYouMessage?: string;
  thankYouButton?: string;
}

/**
 * Field component classes interface
 * Used by individual field components
 */
export interface FieldClasses {
  field?: string;
  fieldLabel?: string;
  fieldInput?: string;
  fieldTextarea?: string;
  fieldSelect?: string;
  fieldCheckbox?: string;
  fieldRadio?: string;
  fieldDate?: string;
  fieldSlider?: string;
  fieldText?: string;
  fieldError?: string;
  fieldHelperText?: string;
}

export interface FormRendererSettings {
  showFormSubmissions?: boolean;
  /** @deprecated Use colorClasses and styleClasses instead */
  classes?: FormRendererClasses;
  /** Color-related CSS classes for form components */
  colorClasses?: FormRendererColorClasses;
  /** Style and layout CSS classes for form components */
  styleClasses?: FormRendererStyleClasses;
  theme?: FormRendererTheme;
  texts?: FormRendererTexts;
}

export interface PageChangeEvent {
  pageId: string;
  pageIndex: number;
  pageTitle: string;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  isEndPage: boolean;
  isConfirmationPage: boolean;
  previousPageId?: string;
  previousPageIndex?: number;
}

export interface FormRendererProps {
  formJson: FormDefinition;
  onSubmit?: (formValues: FormValues) => void;
  onPageChange?: (event: PageChangeEvent) => void;
  disabled?: boolean;
  prefixId?: string;
  settings?: FormRendererSettings;
}

export interface FormValues {
  [key: string]: unknown;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface VisibilityCondition {
  field: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'lessThan'
    | '=='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<=';
  value: string | number | boolean;
}

export interface ActionType {
  type: string;
  params?: Record<string, unknown>;
  dataSource?: string;
  targetPage?: string;
  message?: string;
}

export interface ArrayItem {
  id: string;
  components: FormComponentFieldProps[];
}

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface ThankYouPage {
  title?: string;
  message?: string;
  components?: FormComponentFieldProps[];
  showRestartButton?: boolean;
  customActions?: Array<{
    label: string;
    action: 'restart' | 'custom';
    customAction?: string;
    className?: string;
  }>;
}

export type Option =
  | {
      label?: string;
      value?: string;
    }
  | string;
