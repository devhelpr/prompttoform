import React, { useMemo, useEffect, useCallback } from 'react';
import { useExpressionContext } from '../contexts/expression-context';
import { ExpressionConfig } from '../interfaces/expression-interfaces';

interface WithExpressionProps {
  expression?: ExpressionConfig;
  fieldId: string;
  onChange?: (value: any) => void;
  [key: string]: any;
}

/**
 * Higher-order component that adds expression support to any field component
 */
export function withExpression<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithExpressionComponent = (props: P & WithExpressionProps) => {
    const { expression, fieldId, onChange, ...restProps } = props;
    const { evaluateExpression, context } = useExpressionContext();

    // Extract expression from props.expression if it exists
    const actualExpression =
      expression || (restProps as any)?.props?.expression;

    // Extract read-only flag to avoid infinite loops
    const isReadOnly = (restProps as any)?.props?.readOnly === true;

    // Get the current form values for this expression's dependencies
    const currentFormValues = useMemo(() => {
      if (!actualExpression?.dependencies) return {};

      const values: Record<string, any> = {};
      actualExpression.dependencies.forEach((dep: string) => {
        if (context.values[dep] !== undefined) {
          // The context.values[dep] IS the value, not context.values[dep].value
          values[dep] = context.values[dep];
        }
      });
      return values;
    }, [
      actualExpression?.dependencies,
      // Use a more reliable dependency tracking
      actualExpression?.dependencies
        ?.map((dep: string) => {
          const value = context.values[dep];
          return `${dep}:${value}`;
        })
        .join('|') || '',
    ]);

    // Evaluate expressions when dependencies change
    const expressionResults = useMemo(() => {
      if (!actualExpression) {
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

      // Only evaluate if we have a stable expression
      if (actualExpression.expression) {
        const evaluation = evaluateExpression(
          actualExpression.expression,
          fieldId
        );

        if (
          evaluation.success &&
          evaluation.value !== null &&
          evaluation.value !== undefined
        ) {
          (results as any)[actualExpression.mode] = evaluation.value;
        }
      }

      return results;
    }, [
      actualExpression?.expression,
      actualExpression?.mode,
      fieldId,
      currentFormValues,
    ]);

    // Create a stable onChange callback to prevent infinite loops
    const stableOnChange = useCallback(
      (value: any) => {
        if (onChange) {
          onChange(value);
        }
      },
      [onChange]
    );

    // Update form state for read-only calculated fields
    useEffect(() => {
      if (
        actualExpression &&
        actualExpression.mode === 'value' &&
        expressionResults.value !== null &&
        expressionResults.value !== undefined &&
        stableOnChange &&
        isReadOnly
      ) {
        // Only update if the current form value is different from the expression result
        const currentValue = context.values[fieldId];
        if (currentValue !== expressionResults.value) {
          stableOnChange(expressionResults.value);
        }
      }
    }, [
      expressionResults.value,
      fieldId,
      stableOnChange,
      isReadOnly,
      actualExpression,
    ]);

    // Apply expression results to props
    const enhancedProps = useMemo(() => {
      const enhanced: any = { ...restProps, fieldId, onChange: stableOnChange };

      // Preserve original validation props unless overridden by expressions
      if (!actualExpression || actualExpression.mode !== 'validation') {
        // Keep original showError and validationErrors if no validation expression
        if (restProps.showError !== undefined) {
          enhanced.showError = restProps.showError;
        }
        if (restProps.validationErrors !== undefined) {
          enhanced.validationErrors = restProps.validationErrors;
        }
      }

      // For read-only calculated fields, override the value directly
      if (
        actualExpression &&
        actualExpression.mode === 'value' &&
        expressionResults.value !== null &&
        expressionResults.value !== undefined &&
        isReadOnly
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

      // Apply validation expression - only if we have an actual expression
      if (
        actualExpression &&
        actualExpression.mode === 'validation' &&
        expressionResults.validation === false
      ) {
        enhanced.showError = true;
        enhanced.validationErrors = enhanced.validationErrors || [];
        enhanced.validationErrors.push('Expression validation failed');
      }

      return enhanced;
    }, [restProps, expressionResults, stableOnChange]);

    // Don't render if visibility expression evaluates to false
    if (expressionResults.visibility === false) {
      return null;
    }

    // Show error if expression evaluation failed
    if (
      actualExpression &&
      !evaluateExpression(actualExpression.expression, fieldId).success
    ) {
      const evaluation = evaluateExpression(
        actualExpression.expression,
        fieldId
      );
      return (
        <div className="text-red-500 text-sm p-2 border border-red-200 rounded">
          Expression Error: {evaluation.error}
        </div>
      );
    }

    return <WrappedComponent {...(enhancedProps as P)} />;
  };

  WithExpressionComponent.displayName = `withExpression(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithExpressionComponent;
}
