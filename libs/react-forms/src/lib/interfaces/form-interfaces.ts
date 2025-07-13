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
  } & DateRange;
}

export interface PageProps {
  id: string;
  title: string;
  route: string;
  layout?: string;
  components: FormComponentFieldProps[];
  isEndPage?: boolean;
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
  };
}

export interface FormRendererProps {
  formJson: FormDefinition;
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

export type Option =
  | {
      label?: string;
      value?: string;
    }
  | string;
