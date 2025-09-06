import {
  AgentTask,
  AgentResult,
  ValidationResult,
  AgentCapabilities,
  AgentContext,
  AgentLogger,
  AgentMetrics,
  AgentHealthCheck,
} from '../types/agent-types';

/**
 * Abstract base class for all agents in the framework
 * Provides common functionality and enforces the agent interface
 */
export abstract class BaseAgent {
  protected logger: AgentLogger;
  protected metrics: AgentMetrics;
  protected isInitialized: boolean = false;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    logger: AgentLogger,
    metrics: AgentMetrics
  ) {
    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Initialize the agent - called once when agent is registered
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.onInitialize();
      this.isInitialized = true;
      this.logger.info(`Agent ${this.id} initialized successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize agent ${this.id}`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Cleanup resources when agent is unregistered
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.onCleanup();
      this.isInitialized = false;
      this.logger.info(`Agent ${this.id} cleaned up successfully`);
    } catch (error) {
      this.logger.error(`Failed to cleanup agent ${this.id}`, error as Error);
    }
  }

  /**
   * Execute a task - main entry point for agent execution
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      this.logger.info(`Starting task execution for agent ${this.id}`, {
        taskId: task.id,
      });

      // Validate task before execution
      const validation = await this.validate(task);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Task validation failed: ${validation.errors.join(', ')}`,
          warnings: validation.warnings,
          metadata: {
            executionTime: Date.now() - startTime,
            timestamp: Date.now(),
          },
        };
      }

      // Record metrics
      this.metrics.incrementCounter('agent.tasks.started', 1);

      // Execute the actual task
      const result = await this.executeTask(task);

      // Record success metrics
      const executionTime = Date.now() - startTime;
      this.metrics.recordTiming('agent.task.execution_time', executionTime);
      this.metrics.incrementCounter('agent.tasks.completed', 1);

      this.logger.info(`Task completed successfully for agent ${this.id}`, {
        taskId: task.id,
        executionTime,
      });

      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.metrics.incrementCounter('agent.tasks.failed', 1);
      this.metrics.recordTiming(
        'agent.task.failed_execution_time',
        executionTime
      );

      this.logger.error(
        `Task execution failed for agent ${this.id}`,
        error as Error,
        {
          taskId: task.id,
          executionTime,
        }
      );

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Validate a task before execution
   */
  async validate(task: AgentTask): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!task.id) {
      errors.push('Task ID is required');
    }

    if (!task.type) {
      errors.push('Task type is required');
    }

    if (!task.prompt) {
      errors.push('Task prompt is required');
    }

    // Check if agent supports this task type
    const capabilities = this.getCapabilities();
    if (!capabilities.supportedTaskTypes.includes(task.type)) {
      errors.push(`Agent ${this.id} does not support task type: ${task.type}`);
    }

    // Agent-specific validation
    const agentValidation = await this.validateTask(task);
    errors.push(...agentValidation.errors);
    warnings.push(...agentValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: agentValidation.suggestions,
    };
  }

  /**
   * Get agent capabilities
   */
  abstract getCapabilities(): AgentCapabilities;

  /**
   * Get agent health status
   */
  async getHealthCheck(): Promise<AgentHealthCheck> {
    try {
      const health = await this.checkHealth();
      return {
        isHealthy: health.isHealthy,
        status: health.status,
        details: health.details,
        lastChecked: Date.now(),
      };
    } catch (error) {
      this.logger.error(
        `Health check failed for agent ${this.id}`,
        error as Error
      );
      return {
        isHealthy: false,
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Check if agent can handle a specific task type
   */
  canHandleTask(taskType: string): boolean {
    return this.getCapabilities().supportedTaskTypes.includes(taskType as any);
  }

  /**
   * Get estimated execution time for a task
   */
  async estimateExecutionTime(task: AgentTask): Promise<number> {
    const capabilities = this.getCapabilities();
    return capabilities.estimatedExecutionTime || 5000; // Default 5 seconds
  }

  // Abstract methods to be implemented by concrete agents

  /**
   * Execute the actual task - to be implemented by concrete agents
   */
  protected abstract executeTask(task: AgentTask): Promise<AgentResult>;

  /**
   * Agent-specific task validation - to be implemented by concrete agents
   */
  protected abstract validateTask(task: AgentTask): Promise<ValidationResult>;

  /**
   * Agent-specific initialization - to be implemented by concrete agents
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Agent-specific cleanup - to be implemented by concrete agents
   */
  protected abstract onCleanup(): Promise<void>;

  /**
   * Agent-specific health check - to be implemented by concrete agents
   */
  protected abstract checkHealth(): Promise<{
    isHealthy: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }>;
}

/**
 * Utility class for creating agent instances with common functionality
 */
export class AgentFactory {
  static createAgent<T extends BaseAgent>(
    AgentClass: new (...args: any[]) => T,
    id: string,
    name: string,
    version: string,
    logger: AgentLogger,
    metrics: AgentMetrics,
    ...additionalArgs: any[]
  ): T {
    return new AgentClass(
      id,
      name,
      version,
      logger,
      metrics,
      ...additionalArgs
    );
  }
}

/**
 * Mixin for agents that require LLM services
 */
export abstract class LLMAgent extends BaseAgent {
  protected llmService?: any; // Will be injected

  setLLMService(llmService: any): void {
    this.llmService = llmService;
  }

  protected async callLLM(prompt: string, context?: any): Promise<string> {
    if (!this.llmService) {
      throw new Error('LLM service not available');
    }
    return await this.llmService.generateResponse(prompt, context);
  }
}

/**
 * Mixin for agents that can be cached
 */
export abstract class CacheableAgent extends BaseAgent {
  protected cache?: any; // Will be injected

  setCache(cache: any): void {
    this.cache = cache;
  }

  protected async getCachedResult(key: string): Promise<any> {
    if (!this.cache) {
      return null;
    }
    return await this.cache.get(key);
  }

  protected async setCachedResult(
    key: string,
    data: any,
    ttl?: number
  ): Promise<void> {
    if (!this.cache) {
      return;
    }
    await this.cache.set(key, data, ttl);
  }
}
