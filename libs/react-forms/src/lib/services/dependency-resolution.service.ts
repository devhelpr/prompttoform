/**
 * Dependency Resolution Service
 *
 * A framework-agnostic service that manages expression dependencies and evaluation order.
 * This service creates a dependency graph and ensures expressions are evaluated in the
 * correct topological order to handle inter-field dependencies.
 */

export interface DependencyNode {
  id: string;
  dependencies: string[];
  dependents: string[];
  expression?: string;
  value?: any;
  isCalculated: boolean;
  lastEvaluated?: number;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  evaluationOrder: string[];
  isDirty: boolean;
}

export interface EvaluationContext {
  formValues: Record<string, any>;
  calculatedValues: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EvaluationResult {
  value: any;
  error?: string;
  dependencies: string[];
  timestamp: number;
}

export class DependencyResolutionService {
  private graph: DependencyGraph;
  private evaluationCache: Map<string, EvaluationResult>;
  private customFunctions: Map<string, Function>;
  private evaluationTimeout: number;

  constructor(evaluationTimeout: number = 100) {
    this.graph = {
      nodes: new Map(),
      evaluationOrder: [],
      isDirty: true,
    };
    this.evaluationCache = new Map();
    this.customFunctions = new Map();
    this.evaluationTimeout = evaluationTimeout;

    this.setupDefaultFunctions();
  }

  /**
   * Register a field with its expression and dependencies
   */
  registerField(
    fieldId: string,
    expression: string,
    dependencies: string[] = []
  ): void {
    const existingNode = this.graph.nodes.get(fieldId);

    const node: DependencyNode = {
      id: fieldId,
      dependencies: [...new Set(dependencies)], // Remove duplicates
      dependents: existingNode?.dependents || [],
      expression,
      value: existingNode?.value,
      isCalculated: false,
      lastEvaluated: existingNode?.lastEvaluated,
    };

    // Update dependents for all dependencies
    dependencies.forEach((depId) => {
      if (!this.graph.nodes.has(depId)) {
        // Create placeholder node for dependency
        this.graph.nodes.set(depId, {
          id: depId,
          dependencies: [],
          dependents: [fieldId],
          isCalculated: false,
        });
      } else {
        const depNode = this.graph.nodes.get(depId)!;
        if (!depNode.dependents.includes(fieldId)) {
          depNode.dependents.push(fieldId);
        }
      }
    });

    // Remove old dependencies from their dependents
    if (existingNode) {
      existingNode.dependencies.forEach((depId) => {
        if (!dependencies.includes(depId)) {
          const depNode = this.graph.nodes.get(depId);
          if (depNode) {
            depNode.dependents = depNode.dependents.filter(
              (id) => id !== fieldId
            );
          }
        }
      });
    }

    this.graph.nodes.set(fieldId, node);
    this.graph.isDirty = true;

    // Rebuild evaluation order immediately
    this.buildEvaluationOrder();
  }

  /**
   * Unregister a field and clean up dependencies
   */
  unregisterField(fieldId: string): void {
    const node = this.graph.nodes.get(fieldId);
    if (!node) return;

    // Remove from all dependencies' dependents
    node.dependencies.forEach((depId) => {
      const depNode = this.graph.nodes.get(depId);
      if (depNode) {
        depNode.dependents = depNode.dependents.filter((id) => id !== fieldId);
      }
    });

    // Remove from all dependents' dependencies
    node.dependents.forEach((depId) => {
      const depNode = this.graph.nodes.get(depId);
      if (depNode) {
        depNode.dependencies = depNode.dependencies.filter(
          (id) => id !== fieldId
        );
      }
    });

    this.graph.nodes.delete(fieldId);
    this.evaluationCache.delete(fieldId);
    this.graph.isDirty = true;
  }

  /**
   * Update form values and trigger re-evaluation
   */
  updateFormValues(formValues: Record<string, any>): void {
    // Mark all nodes as potentially dirty
    this.graph.nodes.forEach((node) => {
      if (!node.isCalculated) {
        this.evaluationCache.delete(node.id);
      }
    });

    // Rebuild evaluation order if needed
    if (this.graph.isDirty) {
      this.buildEvaluationOrder();
    }
  }

  /**
   * Evaluate all expressions in dependency order
   */
  async evaluateAll(context: EvaluationContext): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // Merge form values and calculated values
    const fullContext = {
      ...context.formValues,
      ...context.calculatedValues,
      ...context.metadata,
    };

    // First, add all form values to results
    Object.keys(context.formValues).forEach((fieldId) => {
      results[fieldId] = context.formValues[fieldId];
      fullContext[fieldId] = context.formValues[fieldId];
      
      // Also create alias for component ID (e.g., "maxMortgage" for "resultColumn.maxMortgage")
      // This allows expressions to reference fields by their component ID
      const fieldIdParts = fieldId.split('.');
      if (fieldIdParts.length > 1) {
        const componentId = fieldIdParts[fieldIdParts.length - 1];
        // Only create alias if it doesn't already exist (nested fields take precedence)
        if (fullContext[componentId] === undefined) {
          fullContext[componentId] = context.formValues[fieldId];
        }
        if (results[componentId] === undefined) {
          results[componentId] = context.formValues[fieldId];
        }
      }
    });

    // Also add any existing calculated values to results and context
    Object.keys(context.calculatedValues).forEach((fieldId) => {
      if (results[fieldId] === undefined) {
        results[fieldId] = context.calculatedValues[fieldId];
        fullContext[fieldId] = context.calculatedValues[fieldId];
      }
      
      // Create alias for calculated values too
      const fieldIdParts = fieldId.split('.');
      if (fieldIdParts.length > 1) {
        const componentId = fieldIdParts[fieldIdParts.length - 1];
        // Calculated values take precedence over form values for aliases
        fullContext[componentId] = context.calculatedValues[fieldId];
        if (results[componentId] === undefined) {
          results[componentId] = context.calculatedValues[fieldId];
        }
      }
    });

    // Evaluate in topological order
    for (const fieldId of this.graph.evaluationOrder) {
      const node = this.graph.nodes.get(fieldId);
      if (!node) continue;

      // If it's an input field (no expression), just use the form value
      if (!node.expression) {
        // Only set if not already set (might be in calculatedValues)
        if (results[fieldId] === undefined) {
          results[fieldId] = context.formValues[fieldId] || null;
          fullContext[fieldId] = results[fieldId];
        }
        node.value = results[fieldId];
        node.isCalculated = false;
        continue;
      }

      try {
        const result = await this.evaluateExpression(
          node.expression,
          fullContext,
          node.dependencies
        );

        results[fieldId] = result.value;
        node.value = result.value;
        node.isCalculated = true;
        node.lastEvaluated = Date.now();

        // Update context for next evaluations - this is critical for chained expressions
        fullContext[fieldId] = result.value;
        
        // Also create alias for component ID (e.g., "maxMortgage" for "resultColumn.maxMortgage")
        // This allows expressions to reference fields by their component ID
        const fieldIdParts = fieldId.split('.');
        if (fieldIdParts.length > 1) {
          const componentId = fieldIdParts[fieldIdParts.length - 1];
          fullContext[componentId] = result.value;
          // Also add to results so it's available for subsequent evaluations
          if (results[componentId] === undefined) {
            results[componentId] = result.value;
          }
        }

        // Cache the result
        this.evaluationCache.set(fieldId, result);
      } catch (error) {
        console.error(`Error evaluating expression for ${fieldId}:`, error);
        results[fieldId] = null;
        node.value = null;
        node.isCalculated = false;
      }
    }

    return results;
  }

  /**
   * Evaluate a single expression
   */
  private async evaluateExpression(
    expression: string,
    context: Record<string, any>,
    dependencies: string[]
  ): Promise<EvaluationResult> {
    const cacheKey = this.getCacheKey(expression, context, dependencies);
    const cached = this.evaluationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.evaluationTimeout) {
      return cached;
    }

    try {
      // Create evaluation context with custom functions
      const evalContext = this.createEvaluationContext(context);

      // Evaluate the expression
      const value = this.evaluateExpressionString(expression, evalContext);

      const result: EvaluationResult = {
        value,
        dependencies,
        timestamp: Date.now(),
      };

      this.evaluationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      const result: EvaluationResult = {
        value: null,
        error: error instanceof Error ? error.message : String(error),
        dependencies,
        timestamp: Date.now(),
      };

      this.evaluationCache.set(cacheKey, result);
      return result;
    }
  }

  /**
   * Build topological evaluation order using Kahn's algorithm
   */
  private buildEvaluationOrder(): void {
    const order: string[] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Initialize in-degree for all nodes
    this.graph.nodes.forEach((node, id) => {
      inDegree.set(id, node.dependencies.length);
      if (node.dependencies.length === 0) {
        queue.push(id);
      }
    });

    // Process nodes with no dependencies
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const node = this.graph.nodes.get(current);
      if (node) {
        // Reduce in-degree for all dependents
        node.dependents.forEach((dependentId) => {
          const currentInDegree = inDegree.get(dependentId) || 0;
          inDegree.set(dependentId, currentInDegree - 1);

          if (inDegree.get(dependentId) === 0) {
            queue.push(dependentId);
          }
        });
      }
    }

    // Check for circular dependencies
    if (order.length !== this.graph.nodes.size) {
      const remaining = Array.from(this.graph.nodes.keys()).filter(
        (id) => !order.includes(id)
      );
      console.warn('Circular dependencies detected:', remaining);
    }

    this.graph.evaluationOrder = order;
    this.graph.isDirty = false;
  }

  /**
   * Create evaluation context with custom functions
   */
  private createEvaluationContext(
    context: Record<string, any>
  ): Record<string, any> {
    const evalContext = { ...context };

    // Add custom functions
    this.customFunctions.forEach((fn, name) => {
      evalContext[name] = fn;
    });

    return evalContext;
  }

  /**
   * Evaluate expression string using a simple evaluator
   */
  private evaluateExpressionString(
    expression: string,
    context: Record<string, any>
  ): any {
    try {
      // Replace variables with their values
      let processedExpression = expression;

      // Preprocess expression to handle .value syntax
      // Replace fieldId.value with fieldId for direct access
      Object.keys(context).forEach((contextFieldId) => {
        const regex = new RegExp(`\\b${contextFieldId}\\.value\\b`, 'g');
        processedExpression = processedExpression.replace(
          regex,
          contextFieldId
        );
      });

      // Replace variable names with their values
      Object.keys(context).forEach((key) => {
        const value = context[key];
        if (value !== null && value !== undefined) {
          // Create a regex that matches the variable name as a whole word
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          processedExpression = processedExpression.replace(
            regex,
            String(value)
          );
        }
      });

      // Handle custom functions
      processedExpression = this.processCustomFunctions(
        processedExpression,
        context
      );

      // Evaluate the expression safely
      return this.safeEvaluate(processedExpression);
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return null;
    }
  }

  /**
   * Process custom functions in the expression
   */
  private processCustomFunctions(
    expression: string,
    context: Record<string, any>
  ): string {
    // Handle sumLineTotal function
    expression = expression.replace(
      /sumLineTotal\(([^)]+)\)/g,
      (match, arrayName) => {
        const array = context[arrayName.trim()];
        if (!Array.isArray(array)) return '0';

        const sum = array.reduce((total, item) => {
          if (item && typeof item === 'object') {
            if (item.lineTotal !== undefined) {
              return total + (parseFloat(item.lineTotal) || 0);
            } else if (
              item.quantity !== undefined &&
              item.unitPrice !== undefined
            ) {
              return (
                total +
                (parseFloat(item.quantity) || 0) *
                  (parseFloat(item.unitPrice) || 0)
              );
            }
          }
          return total;
        }, 0);

        return sum.toString();
      }
    );

    return expression;
  }

  /**
   * Safely evaluate a mathematical expression
   */
  private safeEvaluate(expression: string): any {
    try {
      // Create a context with Math functions available
      const context = {
        round: Math.round,
        pow: Math.pow,
        abs: Math.abs,
        floor: Math.floor,
        ceil: Math.ceil,
        min: Math.min,
        max: Math.max,
        sqrt: Math.sqrt,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        log: Math.log,
        exp: Math.exp,
        parseFloat: parseFloat,
        parseInt: parseInt,
        isNaN: isNaN,
        isFinite: isFinite,
      };

      // Use eval with a controlled context
      // This allows function calls like parseFloat(quantity) to work properly
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);

      // Create a function that evaluates the expression with the context
      const evalFunction = new Function(...contextKeys, `return ${expression}`);

      return evalFunction(...contextValues);
    } catch (error) {
      console.error('Safe evaluation error:', error);
      return null;
    }
  }

  /**
   * Get cache key for expression evaluation
   */
  private getCacheKey(
    expression: string,
    context: Record<string, any>,
    dependencies: string[]
  ): string {
    const relevantContext = dependencies.reduce((acc, dep) => {
      acc[dep] = context[dep];
      return acc;
    }, {} as Record<string, any>);

    return `${expression}:${JSON.stringify(relevantContext)}`;
  }

  /**
   * Setup default custom functions
   */
  private setupDefaultFunctions(): void {
    this.customFunctions.set('sumLineTotal', (array: any[]) => {
      if (!Array.isArray(array)) return 0;
      return array.reduce((sum, item) => {
        if (item && typeof item === 'object' && 'lineTotal' in item) {
          return sum + this.safeToNumber((item as any).lineTotal);
        }
        return sum;
      }, 0);
    });

    this.customFunctions.set('toNumber', (value: any) => {
      return this.safeToNumber(value);
    });

    this.customFunctions.set('parseFloat', (value: any) => {
      return this.safeToNumber(value);
    });
  }

  /**
   * Convert value to number safely, handling strings and nullish values
   */
  private safeToNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(n) ? 0 : n;
  }

  /**
   * Register custom function
   */
  registerCustomFunction(name: string, fn: Function): void {
    this.customFunctions.set(name, fn);
  }

  /**
   * Get dependency graph for debugging
   */
  getDependencyGraph(): DependencyGraph {
    return {
      nodes: new Map(this.graph.nodes),
      evaluationOrder: [...this.graph.evaluationOrder],
      isDirty: this.graph.isDirty,
    };
  }

  /**
   * Clear all cached evaluations
   */
  clearCache(): void {
    this.evaluationCache.clear();
    this.graph.nodes.forEach((node) => {
      node.isCalculated = false;
      node.value = undefined;
    });
  }

  /**
   * Get evaluation statistics
   */
  getStats(): {
    totalNodes: number;
    evaluationOrder: string[];
    cacheSize: number;
    circularDependencies: string[];
  } {
    const allNodes = Array.from(this.graph.nodes.keys());
    const evaluatedNodes = this.graph.evaluationOrder;
    const circularDeps = allNodes.filter((id) => !evaluatedNodes.includes(id));

    return {
      totalNodes: this.graph.nodes.size,
      evaluationOrder: [...this.graph.evaluationOrder],
      cacheSize: this.evaluationCache.size,
      circularDependencies: circularDeps,
    };
  }
}
