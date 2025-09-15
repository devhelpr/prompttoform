import React, { useMemo } from 'react';
import { useExpressionContext } from '../contexts/expression-context';
import { ExpressionConfig } from '../interfaces/expression-interfaces';

interface WithExpressionProps {
  expression?: ExpressionConfig;
  fieldId: string;
  [key: string]: any;
}

/**
 * Higher-order component that adds expression support to any field component
 */
export function withExpression<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithExpressionComponent = (props: P & WithExpressionProps) => {
    const { expression, fieldId, ...restProps } = props;
    const { evaluateExpression, context } = useExpressionContext();

    // Evaluate expressions for different modes
    const expressionResults = useMemo(() => {
      if (!expression) {
        return {
          value: null,
          visibility: true,
          validation: true,
          disabled: false,
          required: false,
          label: undefined,
          helperText: undefined,
        };
      }

      const results = {
        value: null,
        visibility: true,
        validation: true,
        disabled: false,
        required: false,
        label: undefined,
        helperText: undefined,
      };

      // Evaluate each expression mode
      const modes: (keyof typeof results)[] = [
        'value',
        'visibility',
        'validation',
        'disabled',
        'required',
        'label',
        'helperText',
      ];

      modes.forEach((mode) => {
        if (expression.mode === mode) {
          const result = evaluateExpression(expression.expression, fieldId);
          if (result.success) {
            (results as any)[mode] = result.value;
          }
        }
      });

      return results;
    }, [expression, fieldId, evaluateExpression]);

    // Don't render if visibility expression evaluates to false
    if (expressionResults.visibility === false) {
      return null;
    }

    // Apply expression results to props
    const enhancedProps = useMemo(() => {
      const enhanced: any = { ...restProps };

      // Apply value expression
      if (
        expressionResults.value !== null &&
        expressionResults.value !== undefined
      ) {
        enhanced.value = expressionResults.value;
      }

      // Apply disabled expression
      if (expressionResults.disabled === true) {
        enhanced.disabled = true;
      }

      // Apply required expression
      if (expressionResults.required === true) {
        enhanced.required = true;
      }

      // Apply label expression
      if (typeof expressionResults.label === 'string') {
        enhanced.label = expressionResults.label;
      }

      // Apply helper text expression
      if (typeof expressionResults.helperText === 'string') {
        enhanced.helperText = expressionResults.helperText;
      }

      // Apply validation expression
      if (expressionResults.validation === false) {
        enhanced.showError = true;
        enhanced.validationErrors = enhanced.validationErrors || [];
        enhanced.validationErrors.push('Expression validation failed');
      }

      return enhanced;
    }, [restProps, expressionResults]);

    return <WrappedComponent {...(enhancedProps as P)} />;
  };

  WithExpressionComponent.displayName = `withExpression(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithExpressionComponent;
}

/**
 * Hook for using expression evaluation in field components
 */
export function useFieldExpression(
  fieldId: string,
  expression?: ExpressionConfig
) {
  const { evaluateExpression, context } = useExpressionContext();

  return useMemo(() => {
    if (!expression) {
      return {
        value: null,
        hasError: false,
        error: undefined,
        isEvaluating: false,
      };
    }

    const result = evaluateExpression(expression.expression, fieldId);

    return {
      value: result.value,
      hasError: !result.success,
      error: result.error,
      isEvaluating: false, // We could add loading state if needed
    };
  }, [fieldId, expression, evaluateExpression]);
}
