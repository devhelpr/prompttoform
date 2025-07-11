import React from 'react';

import { Option } from '../interfaces/form-interfaces';

interface FormSelectFieldProps {
  fieldId: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  validation?: {
    required?: boolean;
  };
  props?: {
    options?: Option[];
    helperText?: string;
  };
  showError: boolean;
  validationErrors: string[];
}

export const FormSelectField: React.FC<FormSelectFieldProps> = ({
  fieldId,
  label,
  value,
  onChange,
  onBlur,
  validation,
  props,
  showError,
  validationErrors,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {typeof label === 'string' ? label : ''}
        {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={fieldId}
        className={`w-full p-2 border ${
          showError ? 'border-red-500' : 'border-gray-300'
        } rounded-md bg-white`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={!!validation?.required}
      >
        <option value="">Select an option</option>
        {Array.isArray(props?.options) &&
          props.options.map((option: Option, index: number) => {
            const optionLabel =
              typeof option === 'string' ? option : option.label || '';
            const optionValue =
              typeof option === 'string' ? option : option.value || '';

            return (
              <option key={index} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
      </select>
      {showError && (
        <div className="mt-1 text-sm text-red-500">
          {validationErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      {typeof props?.helperText === 'string' && !showError && (
        <p className="mt-1 text-sm text-gray-500">{props.helperText}</p>
      )}
    </div>
  );
};
