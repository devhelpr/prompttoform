import { Parser } from 'expr-eval';

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
 */
export class ExpressionEngineService {
  private parser: Parser;
  private cache: Map<string, any> = new Map();
  private dependencyCache: Map<string, string[]> = new Map();

  constructor() {
    this.parser = new Parser();
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
      parseFloat: parseFloat,
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
  evaluate(expression: string, context: FormContext): ExpressionResult {
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
    ];
    return builtInFunctions.includes(name);
  }

  /**
   * Pre-process expression to handle member expressions
   */
  private preprocessExpression(
    expression: string,
    context: FormContext
  ): string {
    let processedExpression = expression;

    // Replace fieldId.value with fieldId for direct access
    Object.keys(context).forEach((fieldId) => {
      const regex = new RegExp(`\\b${fieldId}\\.value\\b`, 'g');
      processedExpression = processedExpression.replace(regex, fieldId);
    });

    // Replace JavaScript-style operators with expr-eval compatible ones
    processedExpression = processedExpression
      .replace(/===/g, '==') // Replace strict equality with loose equality
      .replace(/!==/g, '!=') // Replace strict inequality with loose inequality
      .replace(/&&/g, 'and') // Replace logical AND with expr-eval syntax
      .replace(/\|\|/g, 'or'); // Replace logical OR with expr-eval syntax

    return processedExpression;
  }

  /**
   * Create evaluation context from form context
   */
  private createEvaluationContext(context: FormContext): Record<string, any> {
    const evalContext: Record<string, any> = {};

    // Add field values directly for simpler expressions
    Object.entries(context).forEach(([fieldId, fieldData]) => {
      evalContext[fieldId] = fieldData.value;
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
          enhancedContext
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
   * Get cache statistics
   */
  getCacheStats(): { cacheSize: number; dependencyCacheSize: number } {
    return {
      cacheSize: this.cache.size,
      dependencyCacheSize: this.dependencyCache.size,
    };
  }
}

// Singleton instance
export const expressionEngine = new ExpressionEngineService();
