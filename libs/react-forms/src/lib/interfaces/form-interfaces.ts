import { FieldType } from '../types/field-types';

export interface DateRange {
  minDate?: string;
  maxDate?: string;
}

export interface FormComponentFieldProps {
  type: FieldType;
  id: string;
  label?: string;
  defaultValue?: unknown;
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
    confirmationSettings?: {
      showSummary?: boolean;
      groupBySection?: boolean;
      excludeFields?: string[];
      customTitle?: string;
      customMessage?: string;
    };
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
    pages: PageProps[];
    dataSources?: Record<string, unknown>[];
    thankYouPage?: ThankYouPage;
  };
}

export interface FormRendererSettings {
  showFormSubmissions?: boolean;
}

export interface FormRendererProps {
  formJson: FormDefinition;
  onSubmit?: (formValues: FormValues) => void;
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
