import React from 'react';
import { HTMLInputTypeAttribute } from 'react';
import {
  getClassNames,
  getClassNamesWithColorAndStyle,
} from '../utils/class-utils';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';
import { withExpression } from '../hoc/with-expression-v2';
import { ExpressionConfig } from '../interfaces/expression-interfaces';

interface FormInputFieldProps {
  fieldId: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  validation?: {
    required?: boolean;
  };
  props?: {
    type?: string;
    inputType?: string;
    min?: number;
    max?: number;
    readOnly?: boolean;
    placeholder?: string;
    helperText?: string;
    expression?: ExpressionConfig;
  };
  showError: boolean;
  validationErrors: string[];
  disabled?: boolean;
  // Array item field props
  isArrayItem?: boolean;
  arrayItemChangeHandler?: (
    arrayFieldId: string,
    itemIndex: number,
    fieldName: string,
    value: any
  ) => void;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldInput?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
  colorClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldInput?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
  styleClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldInput?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
}

const FormInputFieldBase: React.FC<FormInputFieldProps> = ({
  fieldId,
  label,
  value,
  onChange,
  onBlur,
  validation,
  props,
  showError,
  validationErrors,
  disabled = false,
  classes,
  colorClasses,
  styleClasses,
}) => {
  // Helper function to get merged classes
  const getMergedFieldClasses = (
    fieldKey:
      | 'field'
      | 'fieldLabel'
      | 'fieldInput'
      | 'fieldError'
      | 'fieldHelperText'
      | 'requiredIndicator'
  ) => {
    if (colorClasses || styleClasses) {
      const colorClass = colorClasses?.[fieldKey] || '';
      const styleClass = styleClasses?.[fieldKey] || '';
      return getClassNamesWithColorAndStyle(colorClass, styleClass);
    }
    return classes?.[fieldKey] || '';
  };
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const describedBy = showError
    ? errorId
    : typeof props?.helperText === 'string' && props.helperText.trim() !== ''
    ? helperId
    : undefined;

  return (
    <div className={getMergedFieldClasses('field') || 'mb-4'}>
      <label
        htmlFor={fieldId}
        className={
          getMergedFieldClasses('fieldLabel') ||
          'block text-sm font-medium text-gray-700 mb-1'
        }
      >
        {typeof label === 'string' ? label : ''}
        {!!validation?.required && (
          <span
            className={
              getMergedFieldClasses('requiredIndicator') || 'text-red-500 ml-1'
            }
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>
      <input
        id={fieldId}
        type={
          (props?.inputType as HTMLInputTypeAttribute) ||
          (props?.type as HTMLInputTypeAttribute) ||
          'text'
        }
        className={
          getMergedFieldClasses('fieldInput') ||
          `w-full p-2 border ${
            showError ? 'border-red-500' : 'border-gray-300'
          } rounded-md ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${
            props?.readOnly ? 'bg-gray-50 cursor-not-allowed text-gray-900' : ''
          }`
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={props?.readOnly}
        disabled={disabled}
        placeholder={props?.placeholder}
        required={!!validation?.required}
        aria-required={!!validation?.required}
        aria-invalid={showError}
        aria-describedby={describedBy}
        min={props?.inputType === 'number' ? props.min : undefined}
        max={props?.inputType === 'number' ? props.max : undefined}
      />
      {showError && (
        <div
          id={errorId}
          className={
            getMergedFieldClasses('fieldError') || 'mt-1 text-sm text-red-500'
          }
          role="alert"
          aria-live="polite"
        >
          {validationErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      {typeof props?.helperText === 'string' &&
        props.helperText.trim() !== '' &&
        !showError && (
          <p
            id={helperId}
            className={
              getMergedFieldClasses('fieldHelperText') ||
              'mt-1 text-sm text-gray-500'
            }
          >
            {props.helperText}
          </p>
        )}
    </div>
  );
};

export const FormInputField = withExpression(FormInputFieldBase);
