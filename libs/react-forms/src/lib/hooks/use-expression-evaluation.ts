import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  expressionEngine,
  FormContext,
} from '../services/expression-engine.service';
import {
  UseExpressionConfig,
  UseExpressionResult,
  ExpressionEvaluationResult,
  ExpressionContext as ExpressionContextType,
} from '../interfaces/expression-interfaces';

/**
 * Hook for evaluating expressions in form fields
 */
export function useExpressionEvaluation(
  config: UseExpressionConfig
): UseExpressionResult {
  const {
    expression,
    context,
    enableCache = true,
    enableDebug = false,
  } = config;

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [value, setValue] = useState<any>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastContextRef = useRef<ExpressionContextType>(context);
  const lastExpressionRef = useRef<string>(expression.expression);

  /**
   * Convert expression context to form context
   */
  const formContext = useMemo((): FormContext => {
    const formCtx: FormContext = {};

    Object.keys(context.values).forEach((fieldId) => {
      formCtx[fieldId] = {
        value: context.values[fieldId],
        valid: context.validation[fieldId] ?? true,
        required: context.required[fieldId] ?? false,
        error: context.errors[fieldId],
      };
    });

    return formCtx;
  }, [context.values, context.validation, context.required, context.errors]);

  /**
   * Evaluate expression with debouncing
   */
  const evaluateExpression = useCallback(async () => {
    if (!expression.expression.trim()) {
      setValue(null);
      setHasError(false);
      setError(undefined);
      return;
    }

    setIsEvaluating(true);
    setHasError(false);
    setError(undefined);

    try {
      if (enableDebug) {
        console.log('Evaluating expression:', expression.expression);
        console.log('Form context:', formContext);
      }

      const result = expressionEngine.evaluate(
        expression.expression,
        formContext
      );

      if (result.error) {
        setHasError(true);
        setError(result.error);
        setValue(null);
      } else {
        setValue(result.value);
        setHasError(false);
        setError(undefined);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setHasError(true);
      setError(`Expression evaluation failed: ${errorMessage}`);
      setValue(null);
    } finally {
      setIsEvaluating(false);
    }
  }, [expression.expression, formContext, enableDebug]);

  /**
   * Debounced evaluation
   */
  const debouncedEvaluate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const delay = expression.debounceMs ?? 100;
    debounceTimeoutRef.current = setTimeout(evaluateExpression, delay);
  }, [evaluateExpression, expression.debounceMs]);

  /**
   * Force re-evaluation
   */
  const reEvaluate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    evaluateExpression();
  }, [evaluateExpression]);

  /**
   * Clear expression cache
   */
  const clearCache = useCallback(() => {
    expressionEngine.clearCache();
  }, []);

  /**
   * Check if context has changed
   */
  const hasContextChanged = useCallback(
    (prev: ExpressionContextType, current: ExpressionContextType) => {
      // Check if any relevant values have changed
      const relevantFields = expression.dependencies || [];

      if (relevantFields.length === 0) {
        // If no dependencies specified, check all fields
        return (
          JSON.stringify(prev.values) !== JSON.stringify(current.values) ||
          JSON.stringify(prev.validation) !==
            JSON.stringify(current.validation) ||
          JSON.stringify(prev.required) !== JSON.stringify(current.required)
        );
      }

      // Check only dependent fields
      return relevantFields.some(
        (fieldId) =>
          prev.values[fieldId] !== current.values[fieldId] ||
          prev.validation[fieldId] !== current.validation[fieldId] ||
          prev.required[fieldId] !== current.required[fieldId]
      );
    },
    [expression.dependencies]
  );

  /**
   * Effect to evaluate expression when dependencies change
   */
  useEffect(() => {
    const expressionChanged =
      lastExpressionRef.current !== expression.expression;
    const contextChanged = hasContextChanged(lastContextRef.current, context);

    if (expressionChanged || contextChanged) {
      lastExpressionRef.current = expression.expression;
      lastContextRef.current = context;

      if (expression.evaluateOnChange !== false) {
        debouncedEvaluate();
      }
    }
  }, [
    expression.expression,
    context,
    debouncedEvaluate,
    expression.evaluateOnChange,
  ]);

  /**
   * Effect to evaluate on mount
   */
  useEffect(() => {
    if (expression.expression.trim()) {
      evaluateExpression();
    }
  }, []); // Only run on mount

  /**
   * Cleanup debounce timeout
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Get dependencies from expression
   */
  const dependencies = useMemo(() => {
    return (
      expression.dependencies ||
      expressionEngine.getDependencies(expression.expression)
    );
  }, [expression.dependencies, expression.expression]);

  return {
    value,
    isEvaluating,
    hasError,
    error,
    dependencies,
    reEvaluate,
    clearCache,
  };
}

/**
 * Hook for validating expressions without evaluation
 */
export function useExpressionValidation(expression: string) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [dependencies, setDependencies] = useState<string[]>([]);

  useEffect(() => {
    if (!expression.trim()) {
      setIsValid(true);
      setError(undefined);
      setDependencies([]);
      return;
    }

    const validation = expressionEngine.validate(expression);
    const deps = expressionEngine.getDependencies(expression);

    setIsValid(validation.valid);
    setError(validation.error);
    setDependencies(deps);
  }, [expression]);

  return {
    isValid,
    error,
    dependencies,
  };
}

/**
 * Hook for managing multiple expressions
 */
export function useMultipleExpressions(
  expressions: Record<string, UseExpressionConfig>
): Record<string, UseExpressionResult> {
  const results: Record<string, UseExpressionResult> = {};

  Object.entries(expressions).forEach(([key, config]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useExpressionEvaluation(config);
  });

  return results;
}
