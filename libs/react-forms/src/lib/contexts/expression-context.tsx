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
  // Create expression context
  const context = useMemo(
    (): ExpressionContextType => ({
      values: formValues,
      validation,
      required,
      errors,
      metadata,
    }),
    [formValues, validation, required, errors, metadata]
  );

  // Convert to form context for expression engine
  const formContext = useMemo((): FormContext => {
    const ctx: FormContext = {};

    Object.keys(formValues).forEach((fieldId) => {
      ctx[fieldId] = {
        value: formValues[fieldId],
        valid: validation[fieldId] ?? true,
        required: required[fieldId] ?? false,
        error: errors[fieldId],
      };
    });

    return ctx;
  }, [formValues, validation, required, errors]);

  // Evaluate expression for a specific field
  const evaluateExpression = useMemo(() => {
    return (
      expression: string,
      fieldId: string
    ): ExpressionEvaluationResult => {
      try {
        const result = expressionEngine.evaluate(expression, formContext);
        return {
          value: result.value,
          success: !result.error,
          error: result.error,
          dependencies: result.dependencies,
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
  }, [formContext]);

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
