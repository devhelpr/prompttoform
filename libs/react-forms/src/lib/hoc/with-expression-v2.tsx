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

export interface WithExpressionProps {
  expression?: ExpressionConfig;
  fieldId: string;
  onChange?: (value: any) => void;
  [key: string]: any;
}

/**
 * Higher-order component that adds expression support to any field component
 * Now integrated with dependency resolution system for proper evaluation order
 */
export function withExpression<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithExpressionComponent = (props: P & WithExpressionProps) => {
    const { expression, fieldId, onChange, ...restProps } = props;
    const { evaluateExpression, context } = useExpressionContext();
    const contextValues = (context as any).values;

    // Extract primitive values from form context objects
    const primitiveValues = useMemo(() => {
      const values: Record<string, any> = {};
      Object.keys(contextValues).forEach((key) => {
        const fieldContext = contextValues[key];
        if (
          fieldContext &&
          typeof fieldContext === 'object' &&
          'value' in fieldContext
        ) {
          values[key] = fieldContext.value;
        } else {
          values[key] = fieldContext;
        }
      });
      return values;
    }, [contextValues]);

    // Merge primitive form values with any already calculated values from the engine
    const mergedValues = useMemo(() => {
      try {
        const calculated = expressionEngine.getAllCalculatedValues?.();
        if (calculated && typeof calculated === 'object') {
          return { ...primitiveValues, ...calculated } as Record<string, any>;
        }
      } catch {}
      return primitiveValues;
    }, [primitiveValues]);
    const [isRegistered, setIsRegistered] = useState(false);

    // Extract expression from props.expression if it exists
    const actualExpression =
      expression || (restProps as any)?.props?.expression;

    // Register field with dependency resolution system
    useEffect(() => {
      if (fieldId) {
        if (actualExpression?.expression) {
          const dependencies = actualExpression.dependencies || [];
          console.log(`📝 [${fieldId}] Registering field with expression:`, {
            expression: actualExpression.expression,
            dependencies,
            mode: actualExpression.mode,
          });
          expressionEngine.registerField(
            fieldId,
            actualExpression.expression,
            dependencies
          );
          setIsRegistered(true);
          console.log(`✅ [${fieldId}] Field registered successfully`);
        } else {
          // Register field without expression (input field)
          console.log(
            `📝 [${fieldId}] Registering input field without expression`
          );
          expressionEngine.registerField(fieldId, '', []);
          setIsRegistered(true);
          console.log(`✅ [${fieldId}] Input field registered successfully`);
        }
      } else {
        console.log(`❌ [${fieldId}] Cannot register field:`, {
          hasExpression: !!actualExpression?.expression,
          hasFieldId: !!fieldId,
        });
      }

      return () => {
        if (isRegistered) {
          console.log(`🗑️ [${fieldId}] Unregistering field`);
          expressionEngine.unregisterField(fieldId);
          setIsRegistered(false);
        }
      };
    }, [
      actualExpression?.expression,
      fieldId,
      actualExpression?.dependencies,
      isRegistered,
    ]);

    // Use state to store expression results
    const [expressionResults, setExpressionResults] = useState<{
      value: any;
      visibility: boolean;
      validation: boolean;
      disabled: boolean;
      required: boolean;
      label?: string;
      helperText?: string;
      success?: boolean;
      error?: string;
    }>(() => {
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
        value: null as any,
        visibility: true,
        validation: true,
        disabled: false,
        required: false,
        label: undefined,
        helperText: undefined,
      };

      // For calculated fields, provide a default value
      if (actualExpression.mode === 'value') {
        results.value = actualExpression.defaultValue ?? 0;
      }

      return results;
    });

    // Evaluate expressions using the dependency resolution system
    useEffect(() => {
      console.log(`🔍 [${fieldId}] Expression evaluation triggered:`, {
        hasExpression: !!actualExpression,
        isRegistered,
        mode: actualExpression?.mode,
        expression: actualExpression?.expression,
        dependencies: actualExpression?.dependencies,
        contextValues: contextValues,
        primitiveValues: primitiveValues,
        contextValuesKeys: Object.keys(contextValues),
        primitiveValuesKeys: Object.keys(primitiveValues),
        contextValuesTypes: Object.keys(contextValues).reduce((acc, key) => {
          acc[key] = typeof contextValues[key];
          return acc;
        }, {} as Record<string, string>),
      });

      if (!isRegistered) {
        console.log(`❌ [${fieldId}] Field not registered, setting defaults`);
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

      // If no expression, this is an input field - just pass through the value
      if (!actualExpression?.expression) {
        console.log(`📝 [${fieldId}] Input field - passing through value`);
        setExpressionResults({
          value: primitiveValues[fieldId] || null,
          visibility: true,
          validation: true,
          disabled: false,
          required: false,
          label: undefined,
          helperText: undefined,
        });
        return;
      }

      const evaluateWithDependencies = async () => {
        try {
          const results = {
            value: null as any,
            visibility: true,
            validation: true,
            disabled: false,
            required: false,
            label: undefined,
            helperText: undefined,
          };

          // For value mode, try the new dependency resolution system first
          if (actualExpression.mode === 'value') {
            console.log(
              `🧮 [${fieldId}] Evaluating value expression:`,
              actualExpression.expression
            );
            try {
              // Use the new dependency resolution system
              const calculatedValues =
                await expressionEngine.evaluateAllWithDependencies(
                  mergedValues,
                  {
                    fieldId,
                  }
                );

              console.log(
                `📊 [${fieldId}] Dependency resolution results:`,
                calculatedValues
              );

              if (
                calculatedValues[fieldId] !== undefined &&
                calculatedValues[fieldId] !== null
              ) {
                results.value = calculatedValues[fieldId];
                // Persist calculated value so dependents (e.g., grandTotal) can see it in subsequent evaluations
                try {
                  expressionEngine.setCalculatedValue?.(fieldId, results.value);
                } catch {}
                console.log(
                  `✅ [${fieldId}] Using dependency resolution result:`,
                  results.value
                );
              } else {
                // Fallback to direct evaluation if dependency resolution failed
                console.log(
                  `⚠️ [${fieldId}] Dependency resolution returned null, falling back to direct evaluation`
                );
                const evaluation = evaluateExpression(
                  actualExpression.expression,
                  fieldId
                );
                results.value = evaluation.value;
                try {
                  expressionEngine.setCalculatedValue?.(fieldId, results.value);
                } catch {}
                console.log(
                  `🔄 [${fieldId}] Direct evaluation result:`,
                  results.value
                );
              }
            } catch (depError) {
              console.warn(
                `❌ [${fieldId}] Dependency resolution failed, falling back to direct evaluation:`,
                depError
              );
              // Fallback to direct evaluation
              const evaluation = evaluateExpression(
                actualExpression.expression,
                fieldId
              );

              console.log(
                `🔄 [${fieldId}] Direct evaluation result:`,
                evaluation
              );

              if (
                evaluation.success &&
                evaluation.value !== null &&
                evaluation.value !== undefined
              ) {
                results.value = evaluation.value;
                try {
                  expressionEngine.setCalculatedValue?.(fieldId, results.value);
                } catch {}
                console.log(
                  `✅ [${fieldId}] Using direct evaluation result:`,
                  results.value
                );
              } else {
                results.value = actualExpression.defaultValue ?? 0;
                console.log(
                  `⚠️ [${fieldId}] Direct evaluation failed, using default:`,
                  results.value
                );
              }
            }
          } else {
            // For other modes, use the traditional evaluation
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

          console.log(`🎯 [${fieldId}] Final results:`, results);
          setExpressionResults(results);
        } catch (error) {
          console.error(`💥 [${fieldId}] Expression evaluation error:`, error);
          // Set default values on error
          setExpressionResults({
            value:
              actualExpression.mode === 'value'
                ? actualExpression.defaultValue ?? 0
                : null,
            visibility: true,
            validation: true,
            disabled: false,
            required: false,
            label: undefined,
            helperText: undefined,
          });
        }
      };

      evaluateWithDependencies();
    }, [
      actualExpression?.expression,
      actualExpression?.mode,
      actualExpression?.dependencies?.join(','),
      fieldId,
      isRegistered,
      // Include the entire primitiveValues object to trigger re-evaluation when any form value changes
      // Use a more reliable dependency tracking by including each dependency value explicitly
      // This ensures that when a dependency like 'sliderValue' changes, the expression re-evaluates
      ...(actualExpression?.dependencies || []).map(
        (dep) => primitiveValues[dep] ?? null
      ),
      // Also include the stringified version as a fallback for cases where dependencies might not be specified
      JSON.stringify(primitiveValues),
    ]);

    // Create a stable onChange callback
    const stableOnChange = useCallback(
      (value: any) => {
        if (onChange) {
          const arrayItemMatch = fieldId.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
          if (
            arrayItemMatch &&
            (restProps as any)?.isArrayItem &&
            (restProps as any)?.arrayItemChangeHandler
          ) {
            const [, arrayFieldId, indexStr, fieldName] = arrayItemMatch;
            const itemIndex = parseInt(indexStr, 10);

            (restProps as any).arrayItemChangeHandler(
              arrayFieldId,
              itemIndex,
              fieldName,
              value
            );
          } else {
            onChange(value);
          }
        }
      },
      [onChange, fieldId]
    );

    // Apply expression results to props
    const enhancedProps = useMemo(() => {
      const enhanced: any = { ...restProps, fieldId, onChange: stableOnChange };

      // Preserve original validation props unless overridden by expressions
      if (!actualExpression || actualExpression.mode !== 'validation') {
        if (restProps.showError !== undefined) {
          enhanced.showError = restProps.showError;
        }
        if (restProps.validationErrors !== undefined) {
          enhanced.validationErrors = restProps.validationErrors;
        }
      }

      // For calculated fields, override the value directly
      if (
        actualExpression &&
        actualExpression.mode === 'value' &&
        expressionResults.value !== null &&
        expressionResults.value !== undefined
      ) {
        // Check if this is a TextFormField component by looking for the specific props structure
        const propsObj = (restProps as any)?.props as
          | Record<string, any>
          | null
          | undefined;
        if (
          propsObj &&
          typeof propsObj === 'object' &&
          !('inputType' in propsObj)
        ) {
          // For TextFormField, set the content in the props object
          enhanced.props = {
            ...enhanced.props,
            content: expressionResults.value,
          };
        } else {
          // For other components (like input fields), set as value
          enhanced.value = expressionResults.value;
          enhanced.readOnly = true;
        }
      }

      // Apply other expression results
      if (expressionResults.disabled === true) {
        enhanced.disabled = true;
      }

      if (expressionResults.required === true) {
        enhanced.required = true;
      }

      if (typeof expressionResults.label === 'string') {
        enhanced.label = expressionResults.label;
      }

      if (typeof expressionResults.helperText === 'string') {
        enhanced.helperText = expressionResults.helperText;
      }

      // Apply validation expression
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
    }, [restProps, expressionResults, stableOnChange, actualExpression]);

    // Don't render if visibility expression evaluates to false
    if (expressionResults.visibility === false) {
      return null;
    }

    // Handle expression evaluation errors
    if (
      actualExpression &&
      !evaluateExpression(actualExpression.expression, fieldId).success
    ) {
      const evaluation = evaluateExpression(
        actualExpression.expression,
        fieldId
      );

      // For calculated fields, show default value instead of error
      if (actualExpression.mode === 'value') {
        const enhancedPropsWithDefault = {
          ...enhancedProps,
          value: actualExpression.defaultValue ?? 0,
          readOnly: true,
          helperText:
            actualExpression.calculatedFieldHelperText ??
            'Calculated automatically',
        };
        return <WrappedComponent {...(enhancedPropsWithDefault as P)} />;
      }

      // For non-calculated fields, show the error
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
