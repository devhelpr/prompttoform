import React from 'react';
import {
  getClassNames,
  getClassNamesWithColorAndStyle,
} from '../utils/class-utils';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';
import { Option } from '../interfaces/form-interfaces';

interface FormRadioFieldProps {
  fieldId: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  validation?: {
    required?: boolean;
  };
  props?: Record<string, unknown> & {
    options?: Option[];
  };
  showError: boolean;
  validationErrors: string[];
  disabled?: boolean;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldRadio?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
  colorClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldRadio?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
  styleClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldRadio?: string;
    fieldError?: string;
    fieldHelperText?: string;
    requiredIndicator?: string;
  };
}

export const FormRadioField: React.FC<FormRadioFieldProps> = ({
  fieldId,
  label,
  value,
  onChange,
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
      | 'fieldRadio'
      | 'fieldError'
      | 'fieldHelperText'
      | 'requiredIndicator'
  ) => {
    if (colorClasses || styleClasses) {
      // If only colorClasses is provided, use default style classes
      // If only styleClasses is provided, use default color classes
      // If both are provided, use both
      const colorClass =
        colorClasses?.[fieldKey] || defaultColorClasses[fieldKey] || '';
      const styleClass =
        styleClasses?.[fieldKey] || defaultStyleClasses[fieldKey] || '';
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
      <div
        className="space-y-2"
        role="radiogroup"
        aria-describedby={describedBy}
        aria-invalid={showError}
        aria-required={!!validation?.required}
      >
        {Array.isArray(props?.options) &&
          props.options.map((option: Option, index: number) => {
            const optionLabel =
              typeof option === 'string' ? option : option.label || '';
            const optionValue =
              typeof option === 'string' ? option : option.value || '';

            return (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`${fieldId}-${index}`}
                  name={fieldId}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={(e) => onChange(e.target.value)}
                  className={
                    getMergedFieldClasses('fieldRadio') ||
                    `h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                      disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`
                  }
                  required={!!validation?.required}
                  disabled={disabled}
                />
                <label
                  htmlFor={`${fieldId}-${index}`}
                  className={getClassNames(
                    'ml-2 text-sm text-gray-700',
                    classes?.fieldLabel
                  )}
                >
                  {optionLabel}
                </label>
              </div>
            );
          })}
      </div>
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
