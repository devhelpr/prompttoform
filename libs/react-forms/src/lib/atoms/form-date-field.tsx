import React from 'react';

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
      <input
        id={fieldId}
        type="date"
        className={`w-full p-2 border ${
          showError ? 'border-red-500' : 'border-gray-300'
        } rounded-md ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        value={value}
        min={props?.minDate}
        max={props?.maxDate}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={!!validation?.required}
        disabled={disabled}
      />
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
