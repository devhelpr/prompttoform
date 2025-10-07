import React, { useMemo } from 'react';
import {
  getClassNames,
  getClassNamesWithColorAndStyle,
} from '../utils/class-utils';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';
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
  colorClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldText?: string;
  };
  styleClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldText?: string;
  };
}

const TextFormFieldBase: React.FC<TextFormFieldProps> = ({
  label,
  props,
  classes,
  colorClasses,
  styleClasses,
  formValues = {},
}) => {
  // Helper function to get merged classes
  const getMergedFieldClasses = (
    fieldKey: 'field' | 'fieldLabel' | 'fieldText'
  ) => {
    if (colorClasses || styleClasses) {
      const colorClass = colorClasses?.[fieldKey] || '';
      const styleClass = styleClasses?.[fieldKey] || '';
      return getClassNamesWithColorAndStyle(colorClass, styleClass);
    }
    return classes?.[fieldKey] || '';
  };
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
    <div className={getMergedFieldClasses('field') || 'mb-4'}>
      {label && (
        <label
          className={
            getMergedFieldClasses('fieldLabel') ||
            'block text-sm font-medium text-gray-700 mb-1'
          }
        >
          {label}
        </label>
      )}
      {typeof processedProps?.content === 'string' && (
        <p className={getMergedFieldClasses('fieldText') || 'text-gray-700'}>
          {processedProps.content}
        </p>
      )}
      {typeof processedProps?.text === 'string' && (
        <p className={getMergedFieldClasses('fieldText') || 'text-gray-700'}>
          {processedProps.text}
        </p>
      )}
      {typeof processedProps?.helperText === 'string' &&
        processedProps.helperText.trim() !== '' && (
          <p className={getMergedFieldClasses('fieldText') || 'text-gray-700'}>
            {processedProps.helperText}
          </p>
        )}
    </div>
  );
};

export const TextFormField = withExpression(TextFormFieldBase);
