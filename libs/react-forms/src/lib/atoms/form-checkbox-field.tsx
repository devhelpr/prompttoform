import React from 'react';

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
}) => {
  // Handle single checkbox without options
  if (!props?.options) {
    return (
      <div className="mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={fieldId}
            className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
              disabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            required={!!validation?.required}
            disabled={disabled}
          />
          <label htmlFor={fieldId} className="ml-2 text-sm text-gray-700">
            {typeof label === 'string' ? label : ''}
            {!!validation?.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        </div>
        {showError && (
          <div className="mt-1 text-sm text-red-500">
            {validationErrors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Handle multiple checkboxes with options
  const options = props.options as Option[];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {typeof label === 'string' ? label : ''}
        {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
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
                  className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                    disabled ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  required={!!validation?.required}
                  disabled={disabled}
                />
                <label
                  htmlFor={`${fieldId}-${index}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {optionLabel}
                </label>
              </div>
            );
          })}
      </div>
      {showError && (
        <div className="mt-1 text-sm text-red-500">
          {validationErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
};
