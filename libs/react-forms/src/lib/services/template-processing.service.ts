/**
 * Template Processing Service
 *
 * A framework-agnostic service that processes template strings with {{variable}} syntax.
 * This service handles template compilation, variable substitution, and reactive updates.
 */

export interface TemplateVariable {
  name: string;
  path: string[];
  isNested: boolean;
  defaultValue?: string;
}

export interface ProcessedTemplate {
  original: string;
  processed: string;
  variables: TemplateVariable[];
  hasVariables: boolean;
  lastProcessed: number;
}

export interface TemplateContext {
  formValues: Record<string, any>;
  calculatedValues: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TemplateProcessorOptions {
  variablePattern?: RegExp;
  defaultEmptyValue?: string;
  enableNestedAccess?: boolean;
  enableArrayAccess?: boolean;
  enableFunctionCalls?: boolean;
  cacheTimeout?: number;
}

export class TemplateProcessingService {
  private processedTemplates: Map<string, ProcessedTemplate>;
  private variablePattern: RegExp;
  private defaultEmptyValue: string;
  private enableNestedAccess: boolean;
  private enableArrayAccess: boolean;
  private enableFunctionCalls: boolean;
  private cacheTimeout: number;

  constructor(options: TemplateProcessorOptions = {}) {
    this.processedTemplates = new Map();
    this.variablePattern = options.variablePattern || /\{\{([^}]+)\}\}/g;
    this.defaultEmptyValue = options.defaultEmptyValue || '-';
    this.enableNestedAccess = options.enableNestedAccess !== false;
    this.enableArrayAccess = options.enableArrayAccess !== false;
    this.enableFunctionCalls = options.enableFunctionCalls !== false;
    this.cacheTimeout = options.cacheTimeout || 1000;
  }

  /**
   * Process a template string with variable substitution
   */
  processTemplate(template: string, context: TemplateContext): string {
    if (!template || typeof template !== 'string') {
      return template || '';
    }

    // Check if template has variables
    if (!this.hasVariables(template)) {
      return template;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(template, context);
    const cached = this.processedTemplates.get(cacheKey);

    if (cached && Date.now() - cached.lastProcessed < this.cacheTimeout) {
      return cached.processed;
    }

    // Extract variables from template
    const variables = this.extractVariables(template);

    // Process the template
    const processed = this.substituteVariables(template, variables, context);

    // Cache the result
    const processedTemplate: ProcessedTemplate = {
      original: template,
      processed,
      variables,
      hasVariables: variables.length > 0,
      lastProcessed: Date.now(),
    };

    this.processedTemplates.set(cacheKey, processedTemplate);

    return processed;
  }

  /**
   * Check if a template string contains variables
   */
  hasVariables(template: string): boolean {
    return this.variablePattern.test(template);
  }

  /**
   * Extract all variables from a template
   */
  extractVariables(template: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    let match;

    // Reset regex lastIndex
    this.variablePattern.lastIndex = 0;

    while ((match = this.variablePattern.exec(template)) !== null) {
      const fullMatch = match[0]; // {{variable}}
      const variableContent = match[1].trim(); // variable

      const variable = this.parseVariable(variableContent);
      if (variable) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Parse a variable string into a TemplateVariable object
   */
  private parseVariable(variableContent: string): TemplateVariable | null {
    if (!variableContent) return null;

    // Handle function calls
    if (this.enableFunctionCalls && variableContent.includes('(')) {
      return {
        name: variableContent,
        path: [variableContent],
        isNested: false,
      };
    }

    // Handle nested access (e.g., "user.profile.name")
    if (this.enableNestedAccess && variableContent.includes('.')) {
      const path = variableContent.split('.');
      return {
        name: variableContent,
        path,
        isNested: true,
      };
    }

    // Handle array access (e.g., "items[0].name")
    if (this.enableArrayAccess && variableContent.includes('[')) {
      const path = this.parseArrayPath(variableContent);
      return {
        name: variableContent,
        path,
        isNested: true,
      };
    }

    // Simple variable
    return {
      name: variableContent,
      path: [variableContent],
      isNested: false,
    };
  }

  /**
   * Parse array access path (e.g., "items[0].name" -> ["items", "0", "name"])
   */
  private parseArrayPath(path: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inBrackets = false;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];

      if (char === '[') {
        if (current) {
          parts.push(current);
          current = '';
        }
        inBrackets = true;
      } else if (char === ']') {
        if (current) {
          parts.push(current);
          current = '';
        }
        inBrackets = false;
      } else if (char === '.' && !inBrackets) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  /**
   * Substitute variables in template with their values
   */
  private substituteVariables(
    template: string,
    variables: TemplateVariable[],
    context: TemplateContext
  ): string {
    let processed = template;

    variables.forEach((variable) => {
      const value = this.resolveVariable(variable, context);
      const displayValue = this.formatValueForDisplay(value);

      // Replace all occurrences of this variable
      const regex = new RegExp(
        `\\{\\{\\s*${this.escapeRegex(variable.name)}\\s*\\}\\}`,
        'g'
      );
      processed = processed.replace(regex, displayValue);
    });

    return processed;
  }

  /**
   * Resolve a variable to its value from context
   */
  private resolveVariable(
    variable: TemplateVariable,
    context: TemplateContext
  ): any {
    // Merge all context sources
    const fullContext = {
      ...context.formValues,
      ...context.calculatedValues,
      ...context.metadata,
    };

    // Handle function calls
    if (this.enableFunctionCalls && variable.name.includes('(')) {
      return this.evaluateFunction(variable.name, fullContext);
    }

    // Handle nested access
    if (variable.isNested) {
      return this.resolveNestedValue(variable.path, fullContext);
    }

    // Simple variable access
    return fullContext[variable.name];
  }

  /**
   * Resolve nested value using path
   */
  private resolveNestedValue(
    path: string[],
    context: Record<string, any>
  ): any {
    let current = context;

    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current === 'object') {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Evaluate function calls in templates
   */
  private evaluateFunction(
    functionCall: string,
    context: Record<string, any>
  ): any {
    try {
      // Extract function name and arguments
      const match = functionCall.match(/^(\w+)\(([^)]*)\)$/);
      if (!match) return null;

      const functionName = match[1];
      const argsString = match[2];

      // Parse arguments
      const args = this.parseFunctionArguments(argsString, context);

      // Handle built-in functions
      switch (functionName) {
        case 'length':
          return this.handleLengthFunction(args);
        case 'sum':
          return this.handleSumFunction(args);
        case 'sumLineTotal':
          return this.handleSumLineTotalFunction(args);
        case 'count':
          return this.handleCountFunction(args);
        case 'format':
          return this.handleFormatFunction(args);
        default:
          // Try to find function in context
          const fn = context[functionName];
          if (typeof fn === 'function') {
            return fn(...args);
          }
          return null;
      }
    } catch (error) {
      console.error('Function evaluation error:', error);
      return null;
    }
  }

  /**
   * Parse function arguments
   */
  private parseFunctionArguments(
    argsString: string,
    context: Record<string, any>
  ): any[] {
    if (!argsString.trim()) return [];

    // Simple argument parsing - split by comma and resolve variables
    return argsString.split(',').map((arg) => {
      const trimmed = arg.trim();

      // If it's a quoted string, return as string
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return trimmed.slice(1, -1);
      }

      // If it's a number, return as number
      if (!isNaN(Number(trimmed))) {
        return Number(trimmed);
      }

      // Otherwise, resolve as variable
      return context[trimmed];
    });
  }

  /**
   * Handle length function
   */
  private handleLengthFunction(args: any[]): number {
    if (args.length === 0) return 0;
    const value = args[0];

    if (Array.isArray(value)) {
      return value.length;
    }

    if (typeof value === 'string') {
      return value.length;
    }

    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length;
    }

    return 0;
  }

  /**
   * Handle sum function
   */
  private handleSumFunction(args: any[]): number {
    if (args.length === 0) return 0;

    return args.reduce((sum, arg) => {
      if (Array.isArray(arg)) {
        return (
          sum +
          arg.reduce((itemSum, item) => {
            const num = this.toNumber(item);
            return itemSum + num;
          }, 0)
        );
      }

      return sum + this.toNumber(arg);
    }, 0);
  }

  /**
   * Handle sumLineTotal function for array aggregation
   */
  private handleSumLineTotalFunction(args: any[]): number {
    if (args.length === 0) return 0;

    const array = args[0];
    if (!Array.isArray(array)) return 0;

    return array.reduce((sum, item) => {
      if (typeof item === 'object' && item !== null) {
        // Look for lineTotal property
        if (typeof item.lineTotal === 'number') {
          return sum + item.lineTotal;
        }
        // If no lineTotal, try to calculate from quantity and unitPrice
        if (
          typeof item.quantity === 'number' &&
          typeof item.unitPrice === 'number'
        ) {
          return sum + item.quantity * item.unitPrice;
        }
      }
      return sum;
    }, 0);
  }

  /**
   * Handle count function
   */
  private handleCountFunction(args: any[]): number {
    if (args.length === 0) return 0;

    return args.reduce((count, arg) => {
      if (Array.isArray(arg)) {
        return (
          count +
          arg.filter(
            (item) => item !== null && item !== undefined && item !== ''
          ).length
        );
      }

      if (arg !== null && arg !== undefined && arg !== '') {
        return count + 1;
      }

      return count;
    }, 0);
  }

  /**
   * Handle format function
   */
  private handleFormatFunction(args: any[]): string {
    if (args.length < 2) return '';

    const value = args[0];
    const format = args[1];

    if (typeof format !== 'string') return String(value);

    // Simple formatting - in production, use a proper formatting library
    switch (format.toLowerCase()) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(this.toNumber(value));

      case 'number':
        return new Intl.NumberFormat('en-US').format(this.toNumber(value));

      case 'percent':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(this.toNumber(value) / 100);

      default:
        return String(value);
    }
  }

  /**
   * Format value for display in template
   */
  private formatValueForDisplay(value: any): string {
    if (value === null || value === undefined) {
      return this.defaultEmptyValue;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'None';
      }

      // For arrays of objects, show a summary
      if (value.length > 0 && typeof value[0] === 'object') {
        return `${value.length} item${value.length === 1 ? '' : 's'}`;
      }

      return value.join(', ');
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return 'Empty';
      }

      return `${keys.length} propert${keys.length === 1 ? 'y' : 'ies'}`;
    }

    return String(value);
  }

  /**
   * Convert value to number
   */
  private toNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get cache key for template processing
   */
  private getCacheKey(template: string, context: TemplateContext): string {
    const relevantContext = this.getRelevantContext(template, context);
    return `${template}:${JSON.stringify(relevantContext)}`;
  }

  /**
   * Get only the relevant context variables for a template
   */
  private getRelevantContext(
    template: string,
    context: TemplateContext
  ): Record<string, any> {
    const variables = this.extractVariables(template);
    const relevant: Record<string, any> = {};

    const fullContext = {
      ...context.formValues,
      ...context.calculatedValues,
      ...context.metadata,
    };

    variables.forEach((variable) => {
      if (variable.isNested) {
        const value = this.resolveNestedValue(variable.path, fullContext);
        relevant[variable.name] = value;
      } else {
        relevant[variable.name] = fullContext[variable.name];
      }
    });

    return relevant;
  }

  /**
   * Clear template processing cache
   */
  clearCache(): void {
    this.processedTemplates.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    templates: string[];
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const templates = Array.from(this.processedTemplates.keys());
    const timestamps = Array.from(this.processedTemplates.values()).map(
      (t) => t.lastProcessed
    );

    return {
      size: this.processedTemplates.size,
      templates,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }

  /**
   * Register custom function for template processing
   */
  registerCustomFunction(name: string, fn: Function): void {
    // This would be used to extend the function evaluation capabilities
    // Implementation depends on how you want to integrate with the evaluation system
  }
}
