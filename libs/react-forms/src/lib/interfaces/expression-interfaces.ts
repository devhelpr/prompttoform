/**
 * Expression configuration for form fields
 */
export interface ExpressionConfig {
  /** Expression string to evaluate */
  expression: string;
  /** How the expression affects the field */
  mode: ExpressionMode;
  /** Field IDs that this expression depends on */
  dependencies?: string[];
  /** Error message when expression evaluation fails */
  errorMessage?: string;
  /** Whether to evaluate expression on every change */
  evaluateOnChange?: boolean;
  /** Debounce delay for expression evaluation (ms) */
  debounceMs?: number;
  /** Default value to show for calculated fields when dependencies are missing */
  defaultValue?: any;
  /** Helper text to show for calculated fields */
  calculatedFieldHelperText?: string;
}

/**
 * Expression modes that define how expressions affect fields
 */
export type ExpressionMode =
  | 'value' // Expression sets the field value
  | 'visibility' // Expression controls field visibility
  | 'validation' // Expression provides validation logic
  | 'disabled' // Expression controls field disabled state
  | 'required' // Expression controls field required state
  | 'label' // Expression sets the field label
  | 'helperText'; // Expression sets the field helper text

/**
 * Expression evaluation context for a form
 */
export interface ExpressionContext {
  /** Current form values */
  values: Record<string, any>;
  /** Field validation states */
  validation: Record<string, boolean>;
  /** Field required states */
  required: Record<string, boolean>;
  /** Field error messages */
  errors: Record<string, string | undefined>;
  /** Form metadata */
  metadata?: Record<string, any>;
}

/**
 * Expression evaluation result
 */
export interface ExpressionEvaluationResult {
  /** Evaluated value */
  value: any;
  /** Whether evaluation was successful */
  success: boolean;
  /** Error message if evaluation failed */
  error?: string;
  /** Field dependencies used in evaluation */
  dependencies: string[];
  /** Whether the result should trigger a re-render */
  shouldUpdate: boolean;
}

/**
 * Expression hook configuration
 */
export interface UseExpressionConfig {
  /** Expression configuration */
  expression: ExpressionConfig;
  /** Current form context */
  context: ExpressionContext;
  /** Whether to enable caching */
  enableCache?: boolean;
  /** Whether to enable debug logging */
  enableDebug?: boolean;
}

/**
 * Expression hook return value
 */
export interface UseExpressionResult {
  /** Current evaluated value */
  value: any;
  /** Whether expression is currently evaluating */
  isEvaluating: boolean;
  /** Whether expression evaluation failed */
  hasError: boolean;
  /** Error message if evaluation failed */
  error?: string;
  /** Field dependencies */
  dependencies: string[];
  /** Force re-evaluation of expression */
  reEvaluate: () => void;
  /** Clear expression cache */
  clearCache: () => void;
}

/**
 * Expression validation result
 */
export interface ExpressionValidationResult {
  /** Whether expression is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Field dependencies found in expression */
  dependencies: string[];
  /** Suggested fixes for common errors */
  suggestions?: string[];
}

/**
 * Expression template for common patterns
 */
export interface ExpressionTemplate {
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template expression */
  expression: string;
  /** Required field types */
  requiredFields: string[];
  /** Example usage */
  example: string;
  /** Template category */
  category: 'calculation' | 'validation' | 'conditional' | 'formatting';
}

/**
 * Expression error types
 */
export type ExpressionErrorType =
  | 'syntax' // Invalid expression syntax
  | 'reference' // Reference to non-existent field
  | 'type' // Type mismatch in expression
  | 'runtime' // Runtime evaluation error
  | 'circular' // Circular dependency detected
  | 'timeout'; // Expression evaluation timeout

/**
 * Expression error details
 */
export interface ExpressionError {
  /** Error type */
  type: ExpressionErrorType;
  /** Error message */
  message: string;
  /** Field ID where error occurred */
  fieldId?: string;
  /** Expression that caused the error */
  expression?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Expression performance metrics
 */
export interface ExpressionMetrics {
  /** Number of evaluations performed */
  evaluationCount: number;
  /** Average evaluation time (ms) */
  averageEvaluationTime: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  /** Number of errors encountered */
  errorCount: number;
  /** Most frequently used expressions */
  frequentExpressions: Array<{
    expression: string;
    count: number;
  }>;
}
