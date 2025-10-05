import React, { useMemo } from 'react';
import { getClassNames } from '../utils/class-utils';
import { withExpression } from '../hoc/with-expression-v2';
import { useExpressionContext } from '../contexts/expression-context';
import { expressionEngine } from '../services/expression-engine.service';

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
  // Process templates using the new template processing service
  const processedProps = useMemo(() => {
    if (!props) return props;

    const processed = { ...props };

    // Process helperText templates using the expression engine's template processor
    if (
      typeof props.helperText === 'string' &&
      expressionEngine.hasTemplateVariables(props.helperText)
    ) {
      processed.helperText = expressionEngine.processTemplate(
        props.helperText,
        formValues
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
