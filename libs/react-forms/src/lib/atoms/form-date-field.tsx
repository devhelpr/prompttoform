import React from 'react';
import { getClassNames } from '../utils/class-utils';

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
}) => {
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const describedBy = showError
    ? errorId
    : typeof props?.helperText === 'string' && props.helperText.trim() !== ''
    ? helperId
    : undefined;

  return (
    <div className={getClassNames('mb-4', classes?.field)}>
      <label
        htmlFor={fieldId}
        className={getClassNames(
          'block text-sm font-medium text-gray-700 mb-1',
          classes?.fieldLabel
        )}
      >
        {typeof label === 'string' ? label : ''}
        {!!validation?.required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={fieldId}
        type="date"
        className={getClassNames(
          `w-full p-2 border ${
            showError ? 'border-red-500' : 'border-gray-300'
          } rounded-md ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`,
          classes?.fieldDate
        )}
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
          className={getClassNames(
            'mt-1 text-sm text-red-500',
            classes?.fieldError
          )}
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
            className={getClassNames(
              'mt-1 text-sm text-gray-500',
              classes?.fieldHelperText
            )}
          >
            {props.helperText}
          </p>
        )}
    </div>
  );
};
