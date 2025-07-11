import React from 'react';

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
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {typeof label === 'string' ? label : ''}
        {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  required={!!validation?.required}
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
