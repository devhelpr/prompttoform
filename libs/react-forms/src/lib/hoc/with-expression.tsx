import React, {
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useExpressionContext } from '../contexts/expression-context';
import { ExpressionConfig } from '../interfaces/expression-interfaces';
import { expressionEngine } from '../services/expression-engine.service';

// Custom hook to access form values directly from FormRenderer
const useFormValues = () => {
  // This is a temporary solution - we'll access the form values through the ExpressionContextProvider
  // but we need to ensure the context is properly updated
  const context = useExpressionContext();
  return context.values;
};

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
    const isUpdatingRef = useRef(false);
    const lastUpdateTimeRef = useRef(0);

    // Extract expression from props.expression if it exists
    const actualExpression =
      expression || (restProps as any)?.props?.expression;

    // Extract read-only flag to avoid infinite loops
    const isReadOnly = (restProps as any)?.props?.readOnly === true;

    // Use state to store expression results and update them with useEffect
    const [expressionResults, setExpressionResults] = useState(() => {
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
    });

    // Update expression results when dependencies change
    useEffect(() => {
      // Debug logging for line total fields
      if (fieldId && fieldId.includes('lineTotal')) {
        const depValues = (actualExpression?.dependencies || []).map(
          (dep) => context.values[dep]
        );
        console.log('🔍 LineTotal useEffect triggered:', {
          fieldId,
          actualExpression: !!actualExpression,
          expression: actualExpression?.expression,
          dependencies: actualExpression?.dependencies,
          depValues,
          depValuesDetails: depValues.map((val, i) => ({
            dep: actualExpression?.dependencies?.[i],
            value: val,
            type: typeof val,
          })),
          contextValues: context.values,
        });
      }

      // Special handling for line total fields - force manual calculation
      if (
        fieldId &&
        fieldId.includes('lineTotal') &&
        actualExpression?.expression
      ) {
        const arrayItemMatch = fieldId.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
        if (arrayItemMatch) {
          const [, arrayName, indexStr] = arrayItemMatch;
          const index = parseInt(indexStr, 10);

          // Try to get values from the raw form context first
          const arrayData = context.values[arrayName];
          let quantityValue, unitPriceValue;

          if (
            arrayData &&
            Array.isArray(arrayData.value) &&
            arrayData.value[index]
          ) {
            // Get values from the array item directly
            const item = arrayData.value[index];
            quantityValue = item.quantity;
            unitPriceValue = item.unitPrice;
          } else {
            // Fallback to scoped field IDs
            const quantityFieldId = `${arrayName}[${index}].quantity`;
            const unitPriceFieldId = `${arrayName}[${index}].unitPrice`;
            quantityValue = context.values[quantityFieldId]?.value;
            unitPriceValue = context.values[unitPriceFieldId]?.value;
          }

          // Manual calculation as fallback
          if (quantityValue !== undefined && unitPriceValue !== undefined) {
            const quantity = parseFloat(quantityValue || 0);
            const unitPrice = parseFloat(unitPriceValue || 0);
            const manualTotal = quantity * unitPrice;

            // If we have a valid manual calculation, use it
            if (!isNaN(manualTotal)) {
              const manualResults = {
                value: manualTotal,
                visibility: true,
                validation: true,
                disabled: false,
                required: false,
                label: undefined,
                helperText: undefined,
              };

              setExpressionResults(manualResults);
              return; // Skip the normal expression evaluation
            }
          }
        }
      }

      if (!actualExpression) {
        setExpressionResults({
          value: null,
          visibility: true,
          validation: true,
          disabled: false,
          required: false,
          label: undefined,
          helperText: undefined,
        });
        return;
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
      if (fieldId && fieldId.includes('lineTotal')) {
        console.log('🔍 LineTotal checking expression:', {
          fieldId,
          hasExpression: !!actualExpression.expression,
          expression: actualExpression.expression,
          mode: actualExpression.mode,
        });
      }

      if (actualExpression.expression) {
        // Debug: Log context values before evaluation
        if (fieldId && fieldId.includes('lineTotal')) {
          console.log('🔍 LineTotal context values before evaluation:', {
            fieldId,
            contextValues: context.values,
            quantityValue: context.values['products[0].quantity'],
            unitPriceValue: context.values['products[0].unitPrice'],
            lineTotalValue: context.values['products[0].lineTotal'],
            allContextKeys: Object.keys(context.values),
            dependencies: actualExpression?.dependencies,
            mappedDependencies: (actualExpression?.dependencies || []).map(
              (dep) => {
                // For array items, map local field names to full field IDs
                const arrayItemMatch = fieldId?.match(
                  /^([^[]+)\[(\d+)\]\.(.+)$/
                );
                if (arrayItemMatch) {
                  const [, arrayName, indexStr] = arrayItemMatch;
                  const index = parseInt(indexStr, 10);

                  // If it's a local field name (like 'quantity', 'unitPrice'), map it to the full field ID
                  if (
                    dep === 'quantity' ||
                    dep === 'unitPrice' ||
                    dep === 'lineTotal'
                  ) {
                    const fullFieldId = `${arrayName}[${index}].${dep}`;
                    return {
                      dep,
                      fullFieldId,
                      value: context.values[fullFieldId],
                    };
                  }
                }
                return { dep, fullFieldId: dep, value: context.values[dep] };
              }
            ),
          });
        }

        const evaluation = evaluateExpression(
          actualExpression.expression,
          fieldId
        );

        if (fieldId && fieldId.includes('lineTotal')) {
          console.log('🔍 LineTotal evaluation result:', {
            fieldId,
            evaluation,
            resultsBefore: results,
            evaluationValue: evaluation.value,
            evaluationSuccess: evaluation.success,
            evaluationError: evaluation.error,
          });
        }

        if (
          evaluation.success &&
          evaluation.value !== null &&
          evaluation.value !== undefined
        ) {
          (results as any)[actualExpression.mode] = evaluation.value;
        }

        if (fieldId && fieldId.includes('lineTotal')) {
          console.log('🔍 LineTotal results after:', {
            fieldId,
            results,
            mode: actualExpression.mode,
            resultsValue: results.value,
            resultsMode: results[actualExpression.mode],
          });
        }
      } else if (fieldId && fieldId.includes('lineTotal')) {
        console.log('🔍 LineTotal NO EXPRESSION FOUND:', {
          fieldId,
          actualExpression,
        });
      }

      setExpressionResults(results);
    }, [
      actualExpression?.expression,
      actualExpression?.mode,
      fieldId,
      // Use a stable string representation of the dependencies
      actualExpression?.dependencies?.join(',') || '',
      // Add context values for the dependencies to ensure re-evaluation when values change
      ...(actualExpression?.dependencies || []).map((dep) => {
        // For array items, map local field names to full field IDs
        const arrayItemMatch = fieldId?.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
        if (arrayItemMatch) {
          const [, arrayName, indexStr] = arrayItemMatch;
          const index = parseInt(indexStr, 10);

          // If it's a local field name (like 'quantity', 'unitPrice'), map it to the full field ID
          if (
            dep === 'quantity' ||
            dep === 'unitPrice' ||
            dep === 'lineTotal'
          ) {
            const fullFieldId = `${arrayName}[${index}].${dep}`;
            return context.values[fullFieldId];
          }
        }
        return context.values[dep];
      }),
    ]);

    // Add a second useEffect that runs after a short delay to catch any missed updates
    useEffect(() => {
      if (
        fieldId &&
        fieldId.includes('lineTotal') &&
        actualExpression?.expression
      ) {
        const timeoutId = setTimeout(() => {
          const evaluation = evaluateExpression(
            actualExpression.expression,
            fieldId
          );

          if (fieldId && fieldId.includes('lineTotal')) {
            console.log('🔍 LineTotal delayed evaluation:', {
              fieldId,
              evaluation,
              currentResults: expressionResults,
              evaluationValue: evaluation.value,
              evaluationSuccess: evaluation.success,
              evaluationError: evaluation.error,
            });
          }

          if (
            evaluation.success &&
            evaluation.value !== null &&
            evaluation.value !== undefined &&
            evaluation.value !== expressionResults.value
          ) {
            const newResults = { ...expressionResults };
            (newResults as any)[actualExpression.mode] = evaluation.value;

            if (fieldId && fieldId.includes('lineTotal')) {
              console.log('🔍 LineTotal updating from delayed evaluation:', {
                fieldId,
                oldValue: expressionResults.value,
                newValue: evaluation.value,
                newResults,
              });
            }

            setExpressionResults(newResults);
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }, [
      fieldId,
      actualExpression?.expression,
      actualExpression?.mode,
      // Add context values for the dependencies to ensure re-evaluation when values change
      ...(actualExpression?.dependencies || []).map((dep) => {
        // For array items, map local field names to full field IDs
        const arrayItemMatch = fieldId?.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
        if (arrayItemMatch) {
          const [, arrayName, indexStr] = arrayItemMatch;
          const index = parseInt(indexStr, 10);

          // If it's a local field name (like 'quantity', 'unitPrice'), map it to the full field ID
          if (
            dep === 'quantity' ||
            dep === 'unitPrice' ||
            dep === 'lineTotal'
          ) {
            const fullFieldId = `${arrayName}[${index}].${dep}`;
            return context.values[fullFieldId];
          }
        }
        return context.values[dep];
      }),
    ]);

    // Add a third useEffect that runs after a longer delay to catch any missed updates
    useEffect(() => {
      if (
        fieldId &&
        fieldId.includes('lineTotal') &&
        actualExpression?.expression
      ) {
        const timeoutId = setTimeout(() => {
          const evaluation = evaluateExpression(
            actualExpression.expression,
            fieldId
          );

          if (fieldId && fieldId.includes('lineTotal')) {
            console.log('🔍 LineTotal long delayed evaluation:', {
              fieldId,
              evaluation,
              currentResults: expressionResults,
              evaluationValue: evaluation.value,
              evaluationSuccess: evaluation.success,
              evaluationError: evaluation.error,
            });
          }

          if (
            evaluation.success &&
            evaluation.value !== null &&
            evaluation.value !== undefined &&
            evaluation.value !== expressionResults.value
          ) {
            const newResults = { ...expressionResults };
            (newResults as any)[actualExpression.mode] = evaluation.value;

            if (fieldId && fieldId.includes('lineTotal')) {
              console.log(
                '🔍 LineTotal updating from long delayed evaluation:',
                {
                  fieldId,
                  oldValue: expressionResults.value,
                  newValue: evaluation.value,
                  newResults,
                }
              );
            }

            setExpressionResults(newResults);
          }
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    }, [
      fieldId,
      actualExpression?.expression,
      actualExpression?.mode,
      // Add context values for the dependencies to ensure re-evaluation when values change
      ...(actualExpression?.dependencies || []).map((dep) => {
        // For array items, map local field names to full field IDs
        const arrayItemMatch = fieldId?.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
        if (arrayItemMatch) {
          const [, arrayName, indexStr] = arrayItemMatch;
          const index = parseInt(indexStr, 10);

          // If it's a local field name (like 'quantity', 'unitPrice'), map it to the full field ID
          if (
            dep === 'quantity' ||
            dep === 'unitPrice' ||
            dep === 'lineTotal'
          ) {
            const fullFieldId = `${arrayName}[${index}].${dep}`;
            return context.values[fullFieldId];
          }
        }
        return context.values[dep];
      }),
    ]);

    // Create a stable onChange callback to prevent infinite loops
    const stableOnChange = useCallback(
      (value: any) => {
        if (onChange) {
          // Check if this is an array item field and we have the array item change handler
          const arrayItemMatch = fieldId.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
          if (
            arrayItemMatch &&
            (restProps as any)?.isArrayItem &&
            (restProps as any)?.arrayItemChangeHandler
          ) {
            // For array item fields, use the dedicated array item change handler
            const [, arrayFieldId, indexStr, fieldName] = arrayItemMatch;
            const itemIndex = parseInt(indexStr, 10);

            console.log('🔍 Calling array item onChange:', {
              fieldId,
              arrayFieldId,
              itemIndex,
              fieldName,
              value,
            });
            (restProps as any).arrayItemChangeHandler(
              arrayFieldId,
              itemIndex,
              fieldName,
              value
            );
          } else {
            // Regular field or fallback
            console.log('🔍 Calling regular onChange:', {
              fieldId,
              value,
              isArrayItem: (restProps as any)?.isArrayItem,
              hasArrayHandler: !!(restProps as any)?.arrayItemChangeHandler,
            });
            onChange(value);
          }
        }
      },
      [onChange, fieldId, restProps]
    );

    // Update form state for read-only calculated fields
    useEffect(() => {
      // Debug logging for line total fields
      if (fieldId && fieldId.includes('lineTotal')) {
        console.log('🔍 LineTotal useEffect triggered:', {
          fieldId,
          actualExpression: !!actualExpression,
          mode: actualExpression?.mode,
          expressionResultsValue: expressionResults.value,
          stableOnChange: !!stableOnChange,
          isReadOnly,
          isUpdating: isUpdatingRef.current,
          currentValue: context.values[fieldId],
          expressionResultsObject: expressionResults,
        });
      }

      if (
        actualExpression &&
        actualExpression.mode === 'value' &&
        expressionResults.value !== null &&
        expressionResults.value !== undefined &&
        stableOnChange &&
        isReadOnly &&
        !isUpdatingRef.current
      ) {
        // Only update if the current form value is different from the expression result
        const currentValue = context.values[fieldId];

        // Add additional checks to prevent infinite loops
        const isValueDifferent = currentValue !== expressionResults.value;
        const isValueValid =
          !isNaN(expressionResults.value) && isFinite(expressionResults.value);

        if (fieldId && fieldId.includes('lineTotal')) {
          console.log('🔍 LineTotal update check:', {
            fieldId,
            currentValue,
            expressionResultsValue: expressionResults.value,
            isValueDifferent,
            isValueValid,
          });
        }

        if (isValueDifferent && isValueValid) {
          const now = Date.now();
          // Prevent updates more than once every 100ms to avoid infinite loops
          if (now - lastUpdateTimeRef.current > 100) {
            // Set flag to prevent infinite loops
            isUpdatingRef.current = true;
            lastUpdateTimeRef.current = now;

            if (fieldId && fieldId.includes('lineTotal')) {
              console.log('🔍 LineTotal updating to:', expressionResults.value);
            }

            // Update the form value immediately - no setTimeout needed
            stableOnChange(expressionResults.value);

            // Reset flag after a short delay
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 50);
          }
        }
      }
    }, [
      expressionResults.value, // Use .value specifically to trigger on value changes
      expressionResults.success, // Also depend on success to catch evaluation changes
      expressionResults.error, // Also depend on error to catch evaluation changes
      fieldId,
      stableOnChange,
      isReadOnly,
      actualExpression,
      context.values[fieldId], // Add this back to ensure we get fresh context values
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
