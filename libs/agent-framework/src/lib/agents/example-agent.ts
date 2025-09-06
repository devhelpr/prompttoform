import { BaseAgent } from '../core/agent-base';
import {
  AgentTask,
  AgentResult,
  ValidationResult,
  AgentCapabilities,
  AgentLogger,
  AgentMetrics,
} from '../types/agent-types';

/**
 * Example agent that demonstrates the framework usage
 */
export class ExampleAgent extends BaseAgent {
  constructor(
    id: string,
    name: string,
    version: string,
    logger: AgentLogger,
    metrics: AgentMetrics
  ) {
    super(id, name, version, logger, metrics);
  }

  getCapabilities(): AgentCapabilities {
    return {
      supportedTaskTypes: ['standard'],
      supportedFormTypes: ['simple', 'multi-step'],
      maxComplexity: 'medium',
      requiresLLM: false,
      estimatedExecutionTime: 2000, // 2 seconds
    };
  }

  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    this.logger.info(`Executing example task: ${task.id}`);

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return a simple result
    return {
      success: true,
      data: {
        message: 'Example agent executed successfully',
        taskId: task.id,
        processedAt: new Date().toISOString(),
      },
      metadata: {
        executionTime: 1000,
        timestamp: Date.now(),
      },
    };
  }

  protected async validateTask(task: AgentTask): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Example validation logic
    if (task.prompt.length < 10) {
      warnings.push('Prompt is quite short, consider providing more details');
    }

    if (task.prompt.length > 1000) {
      warnings.push(
        'Prompt is very long, consider breaking it into smaller tasks'
      );
    }

    if (!task.context.formJson) {
      suggestions.push('Consider providing form context for better results');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info('Example agent initializing...');
    // Perform any initialization tasks
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.info('Example agent initialized');
  }

  protected async onCleanup(): Promise<void> {
    this.logger.info('Example agent cleaning up...');
    // Perform any cleanup tasks
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.info('Example agent cleaned up');
  }

  protected async checkHealth(): Promise<{
    isHealthy: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    // Simple health check - always healthy for this example
    return {
      isHealthy: true,
      status: 'healthy',
      details: {
        uptime: Date.now(),
        version: this.version,
        lastCheck: new Date().toISOString(),
      },
    };
  }
}
