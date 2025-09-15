import React from 'react';
import { getClassNames } from '../utils/class-utils';
import { useExpressionEvaluation } from '../hooks/use-expression-evaluation';
import { ExpressionContext } from '../interfaces/expression-interfaces';

interface FormExpressionFieldProps {
  fieldId: string;
  label?: string;
  expression: string;
  mode:
    | 'value'
    | 'visibility'
    | 'validation'
    | 'disabled'
    | 'required'
    | 'label'
    | 'helperText';
  dependencies?: string[];
  context: ExpressionContext;
  children: React.ReactNode;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
}

/**
 * Wrapper component that applies expression-based behavior to form fields
 */
export const FormExpressionField: React.FC<FormExpressionFieldProps> = ({
  fieldId,
  label,
  expression,
  mode,
  dependencies,
  context,
  children,
  classes,
}) => {
  const { value, hasError, error, isEvaluating } = useExpressionEvaluation({
    expression: {
      expression,
      mode,
      dependencies,
      evaluateOnChange: true,
      debounceMs: 100,
    },
    context,
  });

  // Don't render if visibility expression evaluates to false
  if (mode === 'visibility' && value === false) {
    return null;
  }

  // Apply expression-based modifications to children
  const modifiedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const childProps: any = { ...child.props };

    switch (mode) {
      case 'value':
        if (value !== null && value !== undefined) {
          childProps.value = value;
        }
        break;
      case 'disabled':
        childProps.disabled = value === true;
        break;
      case 'required':
        childProps.required = value === true;
        break;
      case 'label':
        if (typeof value === 'string') {
          childProps.label = value;
        }
        break;
      case 'helperText':
        if (typeof value === 'string') {
          childProps.helperText = value;
        }
        break;
      case 'validation':
        if (value === false) {
          childProps.showError = true;
          childProps.validationErrors = [
            error || 'Expression validation failed',
          ];
        }
        break;
    }

    return React.cloneElement(child, childProps);
  });

  return (
    <div className={getClassNames('mb-4', classes?.field)}>
      {/* Expression Error Display */}
      {hasError && (
        <div
          className={getClassNames(
            'text-red-500 text-sm mb-2',
            classes?.fieldError
          )}
        >
          Expression Error: {error}
        </div>
      )}

      {/* Loading Indicator */}
      {isEvaluating && (
        <div className="text-gray-500 text-sm mb-2">Calculating...</div>
      )}

      {/* Modified Children */}
      {modifiedChildren}
    </div>
  );
};
