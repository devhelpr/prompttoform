import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import {
  ExpressionContext as ExpressionContextType,
  ExpressionEvaluationResult,
} from '../interfaces/expression-interfaces';
import {
  expressionEngine,
  FormContext,
} from '../services/expression-engine.service';

interface ExpressionContextProviderProps {
  children: ReactNode;
  formValues: Record<string, any>;
  validation: Record<string, boolean>;
  required: Record<string, boolean>;
  errors: Record<string, string | undefined>;
  metadata?: Record<string, any>;
}

interface ExpressionContextValue {
  context: ExpressionContextType;
  evaluateExpression: (
    expression: string,
    fieldId: string
  ) => ExpressionEvaluationResult;
  getFieldValue: (fieldId: string) => any;
  isFieldValid: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
}

const ExpressionContext = createContext<ExpressionContextValue | undefined>(
  undefined
);

export const ExpressionContextProvider: React.FC<
  ExpressionContextProviderProps
> = ({ children, formValues, validation, required, errors, metadata = {} }) => {
  // Convert to form context for expression engine
  const formContext = useMemo((): FormContext => {
    const ctx: FormContext = {};

    // Add all form values to context
    Object.keys(formValues).forEach((fieldId) => {
      ctx[fieldId] = {
        value: formValues[fieldId],
        valid: validation[fieldId] ?? true,
        required: required[fieldId] ?? false,
        error: errors[fieldId],
      };
    });

    // Add array field values to context for expression evaluation
    Object.keys(formValues).forEach((fieldId) => {
      const value = formValues[fieldId];
      if (Array.isArray(value)) {
        // This is an array field, add individual array item fields to context
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((itemFieldId) => {
              const scopedFieldId = `${fieldId}[${index}].${itemFieldId}`;
              ctx[scopedFieldId] = {
                value: item[itemFieldId],
                valid: validation[scopedFieldId] ?? true,
                required: required[scopedFieldId] ?? false,
                error: errors[scopedFieldId],
              };
            });
          }
        });
      }
    });

    // Don't clear cache here as it can cause infinite loops
    // The cache will be invalidated naturally when dependencies change
    return ctx;
  }, [formValues, validation, required, errors]);

  // Create expression context with processed values
  const context = useMemo(
    (): ExpressionContextType => ({
      values: formContext, // Use the processed formContext instead of raw formValues
      validation,
      required,
      errors,
      metadata,
    }),
    [formContext, validation, required, errors, metadata]
  );

  // Evaluate expression for a specific field
  const evaluateExpression = useMemo(() => {
    return (
      expression: string,
      fieldId: string
    ): ExpressionEvaluationResult => {
      try {
        // Check if this is an array item field (e.g., products[0].lineTotal)
        const arrayItemMatch = fieldId.match(/^([^[]+)\[(\d+)\]\.(.+)$/);

        let evaluationContext = formContext;
        if (arrayItemMatch) {
          // This is an array item field, create a local context
          const [, arrayName, indexStr, fieldName] = arrayItemMatch;
          const index = parseInt(indexStr, 10);

          // Get the array item data
          const arrayData = formValues[arrayName];

          if (Array.isArray(arrayData) && arrayData[index]) {
            const itemData = arrayData[index];

            // Always create local context for array items, even if they don't have data yet
            if (typeof itemData === 'object' && itemData !== null) {
              // Create a local context with the array item's field values
              const localContext: FormContext = { ...formContext };

              // Add the array item's field values to the local context with direct field names
              // This allows expressions like "quantity * unitPrice" to work
              Object.keys(itemData).forEach((itemFieldId) => {
                const fieldValue = itemData[itemFieldId];
                localContext[itemFieldId] = {
                  value: fieldValue,
                  valid: true,
                  required: false,
                  error: undefined,
                };
              });

              // Also add the scoped field names for backward compatibility
              Object.keys(itemData).forEach((itemFieldId) => {
                const scopedFieldId = `${arrayName}[${index}].${itemFieldId}`;
                const fieldValue = itemData[itemFieldId];
                localContext[scopedFieldId] = {
                  value: fieldValue,
                  valid: true,
                  required: false,
                  error: undefined,
                };
              });

              evaluationContext = localContext;
            }
          } else {
            // Even if there's no array data yet, create a minimal context with default values
            const localContext: FormContext = { ...formContext };

            // Add default values for common fields that might be used in expressions
            const defaultFields = ['quantity', 'unitPrice', 'lineTotal'];
            defaultFields.forEach((fieldName) => {
              localContext[fieldName] = {
                value: 0,
                valid: true,
                required: false,
                error: undefined,
              };
            });

            evaluationContext = localContext;
          }
        }

        const result = expressionEngine.evaluate(
          expression,
          evaluationContext,
          fieldId
        );

        // Only log for array item fields to reduce noise
        if (arrayItemMatch) {
          const quantityValue = evaluationContext.quantity?.value;
          const unitPriceValue = evaluationContext.unitPrice?.value;
          const manualResult =
            parseFloat(quantityValue || 0) * parseFloat(unitPriceValue || 0);
        }

        // Map dependencies for array item fields
        let mappedDependencies = result.dependencies;
        if (arrayItemMatch) {
          const [, arrayName, indexStr] = arrayItemMatch;
          const index = parseInt(indexStr, 10);

          // Map local field names to full field IDs
          mappedDependencies = result.dependencies.map((dep) => {
            // If it's a local field name (like 'quantity', 'unitPrice'), map it to the full field ID
            if (
              dep === 'quantity' ||
              dep === 'unitPrice' ||
              dep === 'lineTotal'
            ) {
              return `${arrayName}[${index}].${dep}`;
            }
            return dep;
          });
        }

        // Debug logging for array item fields
        if (
          arrayItemMatch &&
          (fieldId.includes('lineTotal') ||
            fieldId.includes('quantity') ||
            fieldId.includes('unitPrice'))
        ) {
          console.log('🔍 Array item expression evaluation result:', {
            fieldId,
            expression,
            result: result.value,
            success: !result.error,
            error: result.error,
            evaluationContext: evaluationContext,
            quantityValue: evaluationContext.quantity?.value,
            unitPriceValue: evaluationContext.unitPrice?.value,
            manualResult:
              evaluationContext.quantity?.value &&
              evaluationContext.unitPrice?.value
                ? parseFloat(evaluationContext.quantity.value) *
                  parseFloat(evaluationContext.unitPrice.value)
                : 0,
          });
        }

        return {
          value: result.value,
          success: !result.error,
          error: result.error,
          dependencies: mappedDependencies,
          shouldUpdate: true,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          value: null,
          success: false,
          error: `Expression evaluation failed for field ${fieldId}: ${errorMessage}`,
          dependencies: [],
          shouldUpdate: false,
        };
      }
    };
  }, [formContext, formValues]);

  // Helper functions
  const getFieldValue = useMemo(() => {
    return (fieldId: string) => formValues[fieldId];
  }, [formValues]);

  const isFieldValid = useMemo(() => {
    return (fieldId: string) => validation[fieldId] ?? true;
  }, [validation]);

  const isFieldRequired = useMemo(() => {
    return (fieldId: string) => required[fieldId] ?? false;
  }, [required]);

  const getFieldError = useMemo(() => {
    return (fieldId: string) => errors[fieldId];
  }, [errors]);

  const value: ExpressionContextValue = {
    context,
    evaluateExpression,
    getFieldValue,
    isFieldValid,
    isFieldRequired,
    getFieldError,
  };

  return (
    <ExpressionContext.Provider value={value}>
      {children}
    </ExpressionContext.Provider>
  );
};

export const useExpressionContext = (): ExpressionContextValue => {
  const context = useContext(ExpressionContext);
  if (context === undefined) {
    throw new Error(
      'useExpressionContext must be used within an ExpressionContextProvider'
    );
  }
  return context;
};
