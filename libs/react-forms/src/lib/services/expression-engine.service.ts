import { Parser } from 'expr-eval';
import {
  DependencyResolutionService,
  EvaluationContext,
  EvaluationResult,
} from './dependency-resolution.service';
import {
  TemplateProcessingService,
  TemplateContext,
} from './template-processing.service';

/**
 * Form context interface for expression evaluation
 */
export interface FormContext {
  [fieldId: string]: {
    value: any;
    valid: boolean;
    required: boolean;
    error?: string;
  };
}

/**
 * Expression evaluation result
 */
export interface ExpressionResult {
  value: any;
  error?: string;
  dependencies: string[];
}

/**
 * Expression engine service for dynamic form calculations
 * Now integrated with dependency resolution and template processing
 */
export class ExpressionEngineService {
  private parser: Parser;
  private cache: Map<string, any> = new Map();
  private dependencyCache: Map<string, string[]> = new Map();
  private calculatedValues: Map<string, any> = new Map();
  private dependencyService: DependencyResolutionService;
  private templateService: TemplateProcessingService;

  constructor() {
    this.parser = new Parser();
    this.dependencyService = new DependencyResolutionService();
    this.templateService = new TemplateProcessingService();
    this.setupCustomFunctions();
  }

  /**
   * Setup custom functions available in expressions
   */
  private setupCustomFunctions() {
    // Add custom functions to the parser
    this.parser.functions = {
      // Math functions
      abs: Math.abs,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      min: Math.min,
      max: Math.max,
      sqrt: Math.sqrt,
      pow: Math.pow,
      // Utility functions
      parseFloat: (value: any) => {
        const result = parseFloat(value);
        console.log('Custom parseFloat called with:', value, 'result:', result);
        return result;
      },
      toNumber: (value: any) => {
        const result = parseFloat(value);
        console.log('Custom toNumber called with:', value, 'result:', result);
        return result;
      },
      parseInt: parseInt,
      isNaN: isNaN,
      isFinite: isFinite,
      // String functions
      toString: (value: any) => {
        return value.toString();
      },
      getAsString: (value: any) => {
        return value.toString();
      },
      // Array functions
      length: (arr: any) => (Array.isArray(arr) ? arr.length : 0),
      // Array aggregation functions
      sum: (arr: any, fieldExpression?: string) => {
        if (arr === undefined || arr === null) {
          return 0;
        }
        if (!Array.isArray(arr) || arr.length === 0) {
          return 0;
        }
        if (!fieldExpression) {
          // Simple sum of array values
          return arr.reduce((acc, item) => {
            const num = parseFloat(item) || 0;
            return acc + num;
          }, 0);
        }
        // Sum of calculated field values
        const result = arr.reduce((acc, item, index) => {
          if (typeof item === 'object' && item !== null) {
            // Create a local evaluation context with the item's field values
            const localContext: Record<string, any> = {};
            Object.keys(item).forEach((fieldName) => {
              const value = item[fieldName];
              // Extract the actual value from field objects (which have .value property)
              if (
                typeof value === 'object' &&
                value !== null &&
                'value' in value
              ) {
                localContext[fieldName] =
                  value.value === null || value.value === undefined
                    ? 0
                    : value.value;
              } else {
                localContext[fieldName] =
                  value === null || value === undefined ? 0 : value;
              }
            });

            try {
              // Create a new parser instance for this evaluation
              const localParser = new Parser();
              localParser.functions = this.parser.functions;

              const evalResult = localParser.evaluate(
                fieldExpression,
                localContext
              );
              const num = parseFloat(String(evalResult)) || 0;
              return acc + num;
            } catch (error) {
              // Silently handle errors for empty arrays or missing data
              return acc;
            }
          }
          return acc;
        }, 0);

        // Ensure we return a valid number
        return isNaN(result) ? 0 : result;
      },
      count: (arr: any) => {
        return Array.isArray(arr) ? arr.length : 0;
      },
      // Specialized aggregation function for line totals
      sumLineTotal: (arr: any) => {
        if (arr === undefined || arr === null) {
          return 0;
        }
        if (!Array.isArray(arr) || arr.length === 0) {
          return 0;
        }

        const result = arr.reduce((acc, item, index) => {
          if (typeof item === 'object' && item !== null) {
            // Simple field access - should now be products[0].quantity, products[0].unitPrice
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const lineTotal = quantity * unitPrice;

            return acc + lineTotal;
          }
          return acc;
        }, 0);

        return isNaN(result) ? 0 : result;
      },
      avg: (arr: any, fieldExpression?: string) => {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        if (!fieldExpression) {
          // Simple average of array values
          const sum = arr.reduce((acc, item) => {
            const num = parseFloat(item) || 0;
            return acc + num;
          }, 0);
          return sum / arr.length;
        }
        // Average of calculated field values
        const sum = arr.reduce((acc, item, index) => {
          if (typeof item === 'object' && item !== null) {
            // Create a local evaluation context with the item's field values
            const localContext: Record<string, any> = {};
            Object.keys(item).forEach((fieldName) => {
              const value = item[fieldName];
              // Extract the actual value from field objects (which have .value property)
              if (
                typeof value === 'object' &&
                value !== null &&
                'value' in value
              ) {
                localContext[fieldName] =
                  value.value === null || value.value === undefined
                    ? 0
                    : value.value;
              } else {
                localContext[fieldName] =
                  value === null || value === undefined ? 0 : value;
              }
            });

            try {
              // Create a new parser instance for this evaluation
              const localParser = new Parser();
              localParser.functions = this.parser.functions;

              const evalResult = localParser.evaluate(
                fieldExpression,
                localContext
              );
              const num = parseFloat(String(evalResult)) || 0;
              return acc + num;
            } catch (error) {
              // Silently handle errors for empty arrays or missing data
              return acc;
            }
          }
          return acc;
        }, 0);

        const result = sum / arr.length;
        return isNaN(result) ? 0 : result;
      },
      // Conditional functions
      if: (condition: boolean, trueValue: any, falseValue: any) =>
        condition ? trueValue : falseValue,
      // Override unsupported functions to throw errors
      sin: () => {
        throw new Error('Function sin is not supported');
      },
      cos: () => {
        throw new Error('Function cos is not supported');
      },
      tan: () => {
        throw new Error('Function tan is not supported');
      },
      log: () => {
        throw new Error('Function log is not supported');
      },
      exp: () => {
        throw new Error('Function exp is not supported');
      },
    };
  }

  /**
   * Evaluate an expression with the given form context
   */
  evaluate(
    expression: string,
    context: FormContext,
    fieldId?: string
  ): ExpressionResult {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(expression, context);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Get dependencies
      const dependencies = this.getDependencies(expression);

      // Create evaluation context
      const evalContext = this.createEvaluationContext(context);

      // Pre-process expression to handle member expressions
      const processedExpression = this.preprocessExpression(
        expression,
        context
      );

      // Parse and evaluate expression
      const expr = this.parser.parse(processedExpression);

      const result = expr.evaluate(evalContext);

      // Cache result
      const expressionResult: ExpressionResult = {
        value: result,
        dependencies,
      };

      // Ensure we don't return NaN or Infinity values
      if (typeof result === 'number' && (isNaN(result) || !isFinite(result))) {
        expressionResult.value = 0;
      }

      this.cache.set(cacheKey, expressionResult);
      return expressionResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        value: null,
        error: `Expression evaluation failed: ${errorMessage}`,
        dependencies: this.getDependencies(expression),
      };
    }
  }

  /**
   * Validate an expression without evaluating it
   */
  validate(expression: string): { valid: boolean; error?: string } {
    try {
      this.parser.parse(expression);
      return { valid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        error: `Invalid expression: ${errorMessage}`,
      };
    }
  }

  /**
   * Get field dependencies from an expression
   */
  getDependencies(expression: string): string[] {
    if (this.dependencyCache.has(expression)) {
      return this.dependencyCache.get(expression)!;
    }

    try {
      // Extract dependencies from the original expression (before preprocessing)
      const dependencies = this.extractDependenciesFromString(expression);
      this.dependencyCache.set(expression, dependencies);
      return dependencies;
    } catch {
      return [];
    }
  }

  /**
   * Extract field dependencies from string expression
   */
  private extractDependenciesFromString(expression: string): string[] {
    const dependencies = new Set<string>();

    // Match fieldId.value patterns
    const memberExpressionRegex = /\b(\w+)\.value\b/g;
    let match;
    while ((match = memberExpressionRegex.exec(expression)) !== null) {
      const fieldId = match[1];
      if (!this.isBuiltInFunction(fieldId)) {
        dependencies.add(fieldId);
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Extract field dependencies from parsed expression
   */
  private extractDependencies(expr: any): string[] {
    const dependencies = new Set<string>();

    const traverse = (node: any) => {
      if (node && typeof node === 'object') {
        // Check if this is an identifier (variable reference)
        if (node.type === 'Identifier' && !this.isBuiltInFunction(node.name)) {
          dependencies.add(node.name);
        }

        // Check if this is a member expression (e.g., fieldId.value)
        if (
          node.type === 'MemberExpression' &&
          node.object &&
          node.object.type === 'Identifier' &&
          !this.isBuiltInFunction(node.object.name)
        ) {
          dependencies.add(node.object.name);
        }

        // Check for array field references (e.g., products[0].quantity)
        if (
          node.type === 'MemberExpression' &&
          node.object &&
          node.object.type === 'MemberExpression' &&
          node.object.object &&
          node.object.object.type === 'Identifier' &&
          node.object.property &&
          node.object.property.type === 'Literal' &&
          typeof node.object.property.value === 'number' &&
          node.property &&
          node.property.type === 'Identifier'
        ) {
          const arrayName = node.object.object.name;
          const index = node.object.property.value;
          const fieldName = node.property.name;
          dependencies.add(`${arrayName}[${index}].${fieldName}`);
        }

        // Traverse child nodes
        Object.values(node).forEach((child) => {
          if (child && typeof child === 'object') {
            traverse(child);
          }
        });
      }
    };

    traverse(expr);
    return Array.from(dependencies);
  }

  /**
   * Check if identifier is a built-in function
   */
  private isBuiltInFunction(name: string): boolean {
    const builtInFunctions = [
      'abs',
      'round',
      'floor',
      'ceil',
      'min',
      'max',
      'sqrt',
      'pow',
      'parseFloat',
      'parseInt',
      'isNaN',
      'isFinite',
      'toString',
      'length',
      'if',
      'Math',
      // Array aggregation functions
      'sum',
      'count',
      'avg',
      'sumLineTotal',
    ];
    return builtInFunctions.includes(name);
  }

  /**
   * Pre-process expression to handle member expressions and array field references
   */
  private preprocessExpression(
    expression: string,
    context: FormContext
  ): string {
    let processedExpression = expression;

    // Replace fieldId.value with fieldId for direct access
    Object.keys(context).forEach((contextFieldId) => {
      const regex = new RegExp(`\\b${contextFieldId}\\.value\\b`, 'g');
      processedExpression = processedExpression.replace(regex, contextFieldId);
    });

    // Handle array field references - convert array field access to valid variable names
    // e.g., products[0].quantity -> products_0_quantity
    processedExpression = processedExpression.replace(
      /(\w+)\[(\d+)\]\.(\w+)/g,
      (match, arrayName, index, fieldName) => {
        const scopedFieldId = `${arrayName}[${index}].${fieldName}`;
        if (context[scopedFieldId]) {
          return `${arrayName}_${index}_${fieldName}`;
        }
        return match; // Return original if not found in context
      }
    );

    // Replace JavaScript-style operators with expr-eval compatible ones
    processedExpression = processedExpression
      .replace(/===/g, '==') // Replace strict equality with loose equality
      .replace(/!==/g, '!=') // Replace strict inequality with loose inequality
      .replace(/&&/g, 'and'); // Replace logical AND with expr-eval syntax
    // Keep || as || since it's already valid in expr-eval

    return processedExpression;
  }

  /**
   * Create evaluation context from form context
   */
  private createEvaluationContext(context: FormContext): Record<string, any> {
    const evalContext: Record<string, any> = {};

    // Add field values directly for simpler expressions
    Object.entries(context).forEach(([fieldId, fieldData]) => {
      // Handle both direct values and field data objects
      const value =
        typeof fieldData === 'object' &&
        fieldData !== null &&
        'value' in fieldData
          ? fieldData.value
          : fieldData;

      evalContext[fieldId] = value;

      // Also add array field values with transformed names for expression evaluation
      if (fieldId.includes('[') && fieldId.includes('].')) {
        // This is an array field reference like "products[0].quantity"
        const transformedName = fieldId.replace(/\[(\d+)\]\./g, '_$1_');
        evalContext[transformedName] = value;
      }
    });

    // Add array data for aggregation functions
    // Group array fields by their base name (e.g., "products" from "products[0].quantity")
    const arrayGroups: Record<string, any[]> = {};

    Object.entries(context).forEach(([fieldId, fieldData]) => {
      if (fieldId.includes('[') && fieldId.includes('].')) {
        const match = fieldId.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
        if (match) {
          const [, arrayName, indexStr, fieldName] = match;
          const index = parseInt(indexStr, 10);

          if (!arrayGroups[arrayName]) {
            arrayGroups[arrayName] = [];
          }

          // Ensure the array is large enough
          while (arrayGroups[arrayName].length <= index) {
            arrayGroups[arrayName].push({});
          }

          // Set the field value
          arrayGroups[arrayName][index][fieldName] = fieldData.value;
        }
      }
    });

    // Add array groups to evaluation context
    Object.entries(arrayGroups).forEach(([arrayName, arrayData]) => {
      evalContext[arrayName] = arrayData;
    });

    // Add calculated values to evaluation context (these override form values)
    this.calculatedValues.forEach((value, fieldId) => {
      if (value !== null && value !== undefined) {
        evalContext[fieldId] = value;
      }
    });

    return evalContext;
  }

  /**
   * Evaluate multiple expressions with dependency resolution
   * This allows expressions to depend on the results of other expressions
   */
  evaluateWithDependencies(
    expressions: Array<{
      fieldId: string;
      expression: string;
      context: FormContext;
    }>
  ): Record<string, ExpressionResult> {
    const results: Record<string, ExpressionResult> = {};
    const evaluated = new Set<string>();
    const evaluating = new Set<string>();

    // Helper function to evaluate a single expression
    const evaluateField = (fieldId: string): ExpressionResult => {
      // Check if already evaluated
      if (evaluated.has(fieldId)) {
        return results[fieldId];
      }

      // Check for circular dependency
      if (evaluating.has(fieldId)) {
        return {
          value: null,
          error: `Circular dependency detected for field: ${fieldId}`,
          dependencies: [],
        };
      }

      // Find the expression for this field
      const fieldExpression = expressions.find(
        (expr) => expr.fieldId === fieldId
      );
      if (!fieldExpression) {
        return {
          value: null,
          error: `No expression found for field: ${fieldId}`,
          dependencies: [],
        };
      }

      // Mark as currently evaluating
      evaluating.add(fieldId);

      try {
        // Get dependencies
        const dependencies = this.getDependencies(fieldExpression.expression);

        // Evaluate dependencies first
        for (const dep of dependencies) {
          if (!evaluated.has(dep)) {
            evaluateField(dep);
          }
        }

        // Create enhanced context with evaluated results
        const enhancedContext = this.createEnhancedEvaluationContext(
          fieldExpression.context,
          results
        );

        // Evaluate the expression
        const result = this.evaluate(
          fieldExpression.expression,
          enhancedContext,
          fieldId
        );
        results[fieldId] = result;
        evaluated.add(fieldId);
        evaluating.delete(fieldId);

        return result;
      } catch (error) {
        evaluating.delete(fieldId);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const result = {
          value: null,
          error: `Expression evaluation failed for ${fieldId}: ${errorMessage}`,
          dependencies: this.getDependencies(fieldExpression.expression),
        };
        results[fieldId] = result;
        return result;
      }
    };

    // Evaluate all expressions
    expressions.forEach(({ fieldId }) => {
      if (!evaluated.has(fieldId)) {
        evaluateField(fieldId);
      }
    });

    return results;
  }

  /**
   * Create enhanced evaluation context that includes evaluated expression results
   */
  private createEnhancedEvaluationContext(
    context: FormContext,
    expressionResults: Record<string, ExpressionResult>
  ): FormContext {
    const enhancedContext: FormContext = { ...context };

    // Add evaluated expression results to the context
    Object.entries(expressionResults).forEach(([fieldId, result]) => {
      if (result.value !== null && result.value !== undefined) {
        enhancedContext[fieldId] = {
          value: result.value,
          valid: true,
          required: false,
          error: undefined,
        };
      }
    });

    return enhancedContext;
  }

  /**
   * Generate cache key for expression and context
   */
  private getCacheKey(expression: string, context: FormContext): string {
    const contextHash = Object.keys(context)
      .sort()
      .map((key) => `${key}:${JSON.stringify(context[key])}`)
      .join('|');
    return `${expression}|${contextHash}`;
  }

  /**
   * Clear expression cache
   */
  clearCache(): void {
    this.cache.clear();
    this.dependencyCache.clear();
  }

  /**
   * Set a calculated value for a field
   */
  setCalculatedValue(fieldId: string, value: any) {
    this.calculatedValues.set(fieldId, value);
    // Clear cache for expressions that might depend on this field
    this.clearCacheForField(fieldId);
  }

  /**
   * Get a calculated value for a field
   */
  getCalculatedValue(fieldId: string): any {
    return this.calculatedValues.get(fieldId);
  }

  /**
   * Get all calculated values
   */
  getAllCalculatedValues(): Record<string, any> {
    const result: Record<string, any> = {};
    this.calculatedValues.forEach((value, fieldId) => {
      result[fieldId] = value;
    });
    return result;
  }

  /**
   * Clear calculated values for a specific field
   */
  clearCalculatedValue(fieldId: string) {
    this.calculatedValues.delete(fieldId);
    this.clearCacheForField(fieldId);
  }

  /**
   * Clear all calculated values
   */
  clearAllCalculatedValues() {
    this.calculatedValues.clear();
    this.cache.clear();
  }

  /**
   * Clear cache entries that might depend on a specific field
   */
  private clearCacheForField(fieldId: string) {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(fieldId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { cacheSize: number; dependencyCacheSize: number } {
    return {
      cacheSize: this.cache.size,
      dependencyCacheSize: this.dependencyCache.size,
    };
  }

  /**
   * Register a field with its expression and dependencies for dependency resolution
   */
  registerField(
    fieldId: string,
    expression: string,
    dependencies: string[] = []
  ): void {
    this.dependencyService.registerField(fieldId, expression, dependencies);
  }

  /**
   * Unregister a field from dependency resolution
   */
  unregisterField(fieldId: string): void {
    this.dependencyService.unregisterField(fieldId);
  }

  /**
   * Evaluate all expressions with proper dependency resolution
   */
  async evaluateAllWithDependencies(
    formValues: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<Record<string, any>> {
    const context: EvaluationContext = {
      formValues,
      calculatedValues: this.getAllCalculatedValues(),
      metadata,
    };

    this.dependencyService.updateFormValues(formValues);
    return await this.dependencyService.evaluateAll(context);
  }

  /**
   * Process template strings with variable substitution
   */
  processTemplate(template: string, formValues: Record<string, any>): string {
    const context: TemplateContext = {
      formValues,
      calculatedValues: this.getAllCalculatedValues(),
    };

    return this.templateService.processTemplate(template, context);
  }

  /**
   * Check if a template has variables that need processing
   */
  hasTemplateVariables(template: string): boolean {
    return this.templateService.hasVariables(template);
  }

  /**
   * Get dependency graph for debugging
   */
  getDependencyGraph() {
    return this.dependencyService.getDependencyGraph();
  }

  /**
   * Get template processing cache statistics
   */
  getTemplateCacheStats() {
    return this.templateService.getCacheStats();
  }

  /**
   * Clear all caches (expression, dependency, and template)
   */
  clearAllCaches(): void {
    this.clearCache();
    this.dependencyService.clearCache();
    this.templateService.clearCache();
  }

  /**
   * Register custom function for both expression evaluation and template processing
   */
  registerCustomFunction(name: string, fn: Function): void {
    // Register with dependency service
    this.dependencyService.registerCustomFunction(name, fn);

    // Register with template service
    this.templateService.registerCustomFunction(name, fn);

    // Register with expr-eval parser
    this.parser.functions[name] = fn;
  }
}

// Singleton instance
export const expressionEngine = new ExpressionEngineService();
