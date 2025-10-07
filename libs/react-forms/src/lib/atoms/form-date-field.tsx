import React from 'react';
import {
  getClassNames,
  getClassNamesWithColorAndStyle,
} from '../utils/class-utils';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';

interface FormDateFieldProps {
  fieldId: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  validation?: {
    required?: boolean;
  };
  props?: {
    minDate?: string;
    maxDate?: string;
    helperText?: string;
  };
  showError: boolean;
  validationErrors: string[];
  disabled?: boolean;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldDate?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
  colorClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldDate?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
  styleClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldDate?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
}

export const FormDateField: React.FC<FormDateFieldProps> = ({
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
      | 'fieldDate'
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
        type="date"
        className={
          getMergedFieldClasses('fieldDate') ||
          `w-full p-2 border ${
            showError ? 'border-red-500' : 'border-gray-300'
          } rounded-md ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`
        }
        value={value}
        min={props?.minDate}
        max={props?.maxDate}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={!!validation?.required}
        aria-required={!!validation?.required}
        aria-invalid={showError}
        aria-describedby={describedBy}
        disabled={disabled}
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
