/**
 * Core types and interfaces for the Agent Framework
 */

export type AgentTaskType =
  | 'styling'
  | 'expression'
  | 'multi-language'
  | 'standard'
  | 'custom';

export interface AgentTask {
  id: string;
  type: AgentTaskType;
  prompt: string;
  context: AgentContext;
  parameters?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timeout?: number; // in milliseconds
  retryCount?: number;
  maxRetries?: number;
}

export interface AgentContext {
  formJson?: any;
  currentPage?: string;
  userPreferences?: UserPreferences;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  language?: string;
  theme?: string;
  accessibilityLevel?: 'AA' | 'AAA';
  brandGuidelines?: BrandGuidelines;
  customStyles?: Record<string, any>;
}

export interface BrandGuidelines {
  primaryColors?: string[];
  secondaryColors?: string[];
  fonts?: string[];
  logo?: string;
  styleGuide?: string;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
  metadata?: AgentResultMetadata;
  rollbackData?: any; // Data needed to rollback changes
}

export interface AgentResultMetadata {
  executionTime: number;
  tokensUsed?: number;
  confidence?: number;
  agentVersion?: string;
  timestamp: number;
  dependencies?: string[]; // Other agents that were used
}

export interface AgentCapabilities {
  supportedTaskTypes: AgentTaskType[];
  supportedFormTypes?: string[];
  maxComplexity: 'low' | 'medium' | 'high';
  supportedLanguages?: string[];
  requiresLLM?: boolean;
  estimatedExecutionTime?: number; // in milliseconds
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapabilities;
  isActive: boolean;
  lastUpdated: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export interface AgentSuggestion {
  agentId: string;
  confidence: number;
  reason: string;
  estimatedTime: number;
  parameters?: Record<string, any>;
}

export interface AgentExecutionPlan {
  tasks: AgentTask[];
  dependencies: TaskDependency[];
  estimatedTotalTime: number;
  parallelExecution: boolean;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  type: 'sequential' | 'parallel' | 'conditional';
}

export interface AgentPerformanceMetrics {
  agentId: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
  errorRate: number;
  userSatisfactionScore?: number;
}

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  retryPolicy: RetryPolicy;
  cachingEnabled: boolean;
  performanceMonitoring: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface AgentEvent {
  type:
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'agent_registered'
    | 'agent_unregistered';
  agentId: string;
  taskId?: string;
  timestamp: number;
  data?: any;
}

export interface AgentEventListener {
  (event: AgentEvent): void;
}

export interface AgentCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
  tags?: string[];
}

export interface AgentCache {
  get(key: string): Promise<AgentCacheEntry | null>;
  set(key: string, data: any, ttl?: number, tags?: string[]): Promise<void>;
  delete(key: string): Promise<void>;
  clear(tags?: string[]): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface AgentLogger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error, data?: any): void;
}

export interface AgentMetrics {
  incrementCounter(name: string, value?: number): void;
  recordTiming(name: string, duration: number): void;
  setGauge(name: string, value: number): void;
  recordHistogram(name: string, value: number): void;
}

export interface AgentHealthCheck {
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
  lastChecked: number;
}

export interface AgentRegistryConfig {
  autoRegister: boolean;
  healthCheckInterval: number;
  maxAgents: number;
  allowCustomAgents: boolean;
}

export interface AgentTaskQueue {
  enqueue(task: AgentTask): Promise<void>;
  dequeue(): Promise<AgentTask | null>;
  peek(): Promise<AgentTask | null>;
  size(): Promise<number>;
  clear(): Promise<void>;
  getTasksByStatus(status: TaskStatus): Promise<AgentTask[]>;
}

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskExecution {
  task: AgentTask;
  status: TaskStatus;
  startTime?: number;
  endTime?: number;
  result?: AgentResult;
  error?: Error;
  retryCount: number;
}

export interface AgentOrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  enableParallelExecution: boolean;
  enableTaskCaching: boolean;
  enablePerformanceMonitoring: boolean;
}

export interface OrchestrationResult {
  success: boolean;
  results: AgentResult[];
  executionPlan: AgentExecutionPlan;
  totalExecutionTime: number;
  errors: string[];
  warnings: string[];
}
