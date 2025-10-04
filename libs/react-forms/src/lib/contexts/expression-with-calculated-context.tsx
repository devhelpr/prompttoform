import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useCalculatedValues } from './calculated-values-context';
import {
  ExpressionContextProvider,
  ExpressionContextType,
} from './expression-context';
import { FormContext } from '../services/expression-engine.service';

interface ExpressionWithCalculatedContextProviderProps {
  children: ReactNode;
  formValues: Record<string, any>;
  validation: Record<string, boolean>;
  required: Record<string, boolean>;
  errors: Record<string, string | undefined>;
  metadata?: Record<string, any>;
}

export const ExpressionWithCalculatedContextProvider: React.FC<
  ExpressionWithCalculatedContextProviderProps
> = ({ children, formValues, validation, required, errors, metadata = {} }) => {
  const { getCalculatedValues } = useCalculatedValues();
  const calculatedValues = getCalculatedValues();

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

    // Add calculated values to context (these override form values for expression evaluation)
    Object.keys(calculatedValues).forEach((fieldId) => {
      if (
        calculatedValues[fieldId] !== null &&
        calculatedValues[fieldId] !== undefined
      ) {
        ctx[fieldId] = {
          value: calculatedValues[fieldId],
          valid: validation[fieldId] ?? true,
          required: required[fieldId] ?? false,
          error: errors[fieldId],
        };
      }
    });

    // Add array field values to context for expression evaluation
    Object.keys(formValues).forEach((fieldId) => {
      const value = formValues[fieldId];
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((key) => {
              const arrayFieldId = `${fieldId}[${index}].${key}`;
              ctx[arrayFieldId] = {
                value: item[key],
                valid: validation[arrayFieldId] ?? true,
                required: required[arrayFieldId] ?? false,
                error: errors[arrayFieldId],
              };
            });
          }
        });
      }
    });

    // Don't clear cache here as it can cause infinite loops
    // The cache will be invalidated naturally when dependencies change
    return ctx;
  }, [formValues, validation, required, errors, calculatedValues]);

  // Create expression context with processed values
  const context = useMemo(
    (): ExpressionContextType => ({
      values: formContext, // Use the processed formContext instead of raw formValues
      metadata: metadata || {},
    }),
    [formContext, metadata]
  );

  return (
    <ExpressionContextProvider
      formValues={formValues}
      validation={validation}
      required={required}
      errors={errors}
      calculatedValues={calculatedValues}
      metadata={metadata}
    >
      {children}
    </ExpressionContextProvider>
  );
};
