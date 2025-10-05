import React, { useMemo } from 'react';
import { getClassNames } from '../utils/class-utils';
import { withExpression } from '../hoc/with-expression';
import { useExpressionContext } from '../contexts/expression-context';

interface TextFormFieldProps {
  fieldId?: string;
  label?: string;
  props?: {
    content?: string;
    text?: string;
    helperText?: string;
  };
  formValues?: Record<string, any>;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldText?: string;
  };
}

const TextFormFieldBase: React.FC<TextFormFieldProps> = ({
  label,
  props,
  classes,
  formValues = {},
}) => {
  // Process templates reactively when form values change
  const processedProps = useMemo(() => {
    if (!props) return props;

    const processed = { ...props };

    // Process helperText templates
    if (
      typeof props.helperText === 'string' &&
      /\{\{[^}]+\}\}/.test(props.helperText)
    ) {
      processed.helperText = props.helperText.replace(
        /\{\{([^}]+)\}\}/g,
        (match, variable) => {
          const varName = variable.trim();

          // Handle nested variable paths like "applicant.fullName"
          if (varName.includes('.')) {
            const keys = varName.split('.');
            let value: unknown = formValues;

            for (const key of keys) {
              if (value && typeof value === 'object' && key in value) {
                value = (value as Record<string, unknown>)[key];
              } else {
                value = undefined;
                break;
              }
            }

            if (value !== null && value !== undefined && value !== '') {
              // Handle arrays by getting their length
              if (Array.isArray(value)) {
                return String(value.length);
              }
              return String(value);
            }
          }

          // Try direct field name match
          let directValue = formValues[varName];
          if (
            directValue !== null &&
            directValue !== undefined &&
            directValue !== ''
          ) {
            // Handle arrays by getting their length
            if (Array.isArray(directValue)) {
              return String(directValue.length);
            }
            return String(directValue);
          }

          // Try common field name variations
          const variations = [
            varName.toLowerCase(),
            varName.replace(/([A-Z])/g, '_$1').toLowerCase(), // camelCase to snake_case
            varName.replace(/_/g, ''), // remove underscores
            varName.replace(/[._]/g, ''), // remove dots and underscores
          ];

          for (const variation of variations) {
            const value = formValues[variation];
            if (value !== null && value !== undefined && value !== '') {
              // Handle arrays by getting their length
              if (Array.isArray(value)) {
                return String(value.length);
              }
              return String(value);
            }
          }

          // Try to find partial matches in field names
          const matchingKey = Object.keys(formValues).find(
            (key) =>
              key.toLowerCase().includes(varName.toLowerCase()) ||
              varName.toLowerCase().includes(key.toLowerCase())
          );

          if (
            matchingKey &&
            formValues[matchingKey] !== null &&
            formValues[matchingKey] !== undefined &&
            formValues[matchingKey] !== ''
          ) {
            return String(formValues[matchingKey]);
          }

          // Return a dash for missing/empty fields
          return '-';
        }
      );
    }

    return processed;
  }, [props, formValues]);

  return (
    <div className={getClassNames('mb-4', classes?.field)}>
      {label && (
        <label
          className={getClassNames(
            'block text-sm font-medium text-gray-700 mb-1',
            classes?.fieldLabel
          )}
        >
          {label}
        </label>
      )}
      {typeof processedProps?.content === 'string' && (
        <p className={getClassNames('text-gray-700', classes?.fieldText)}>
          {processedProps.content}
        </p>
      )}
      {typeof processedProps?.text === 'string' && (
        <p className={getClassNames('text-gray-700', classes?.fieldText)}>
          {processedProps.text}
        </p>
      )}
      {typeof processedProps?.helperText === 'string' &&
        processedProps.helperText.trim() !== '' && (
          <p className={getClassNames('text-gray-700', classes?.fieldText)}>
            {processedProps.helperText}
          </p>
        )}
    </div>
  );
};

export const TextFormField = withExpression(TextFormFieldBase);
