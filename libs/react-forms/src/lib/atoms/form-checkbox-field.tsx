import React from 'react';
import { getClassNames } from '../utils/class-utils';
import { Option } from '../interfaces/form-interfaces';

interface FormCheckboxFieldProps {
  fieldId: string;
  label?: string;
  value: boolean | string[];
  onChange: (value: boolean | string[]) => void;
  onBlur?: () => void;
  validation?: {
    required?: boolean;
  };
  props?: Record<string, unknown>;
  showError: boolean;
  validationErrors: string[];
  disabled?: boolean;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldCheckbox?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
}

export const FormCheckboxField: React.FC<FormCheckboxFieldProps> = ({
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
    : typeof props?.helperText === 'string'
    ? helperId
    : undefined;

  // Handle single checkbox without options
  if (!props?.options) {
    return (
      <div className={getClassNames('mb-4', classes?.field)}>
        <div className="flex items-center">
          <input
            type="checkbox"
            id={fieldId}
            className={getClassNames(
              `h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
              }`,
              classes?.fieldCheckbox
            )}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            required={!!validation?.required}
            aria-required={!!validation?.required}
            aria-invalid={showError}
            aria-describedby={describedBy}
            disabled={disabled}
          />
          <label
            htmlFor={fieldId}
            className={getClassNames(
              'ml-2 text-sm text-gray-700',
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
        </div>
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
        {typeof props?.helperText === 'string' && !showError && (
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
  }

  // Handle multiple checkboxes with options
  const options = props.options as Option[];

  return (
    <div className={getClassNames('mb-4', classes?.field)}>
      <label
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
      <div
        className="space-y-2"
        role="group"
        aria-describedby={describedBy}
        aria-invalid={showError}
      >
        {Array.isArray(options) &&
          options.map((option: Option, index: number) => {
            const optionLabel =
              typeof option === 'string' ? option : option.label || '';
            const optionValue =
              typeof option === 'string' ? option : option.value || '';

            const isChecked = Array.isArray(value)
              ? value.includes(optionValue)
              : false;

            return (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${fieldId}-${index}`}
                  name={fieldId}
                  value={optionValue}
                  checked={isChecked}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, optionValue]
                      : currentValues.filter((v) => v !== optionValue);
                    onChange(newValues);
                  }}
                  onBlur={onBlur}
                  className={getClassNames(
                    `h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                      disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`,
                    classes?.fieldCheckbox
                  )}
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
      {typeof props?.helperText === 'string' && !showError && (
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
