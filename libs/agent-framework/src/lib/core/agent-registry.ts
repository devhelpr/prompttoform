import { BaseAgent, AgentFactory } from './agent-base';
import {
  AgentTask,
  AgentResult,
  AgentInfo,
  AgentEvent,
  AgentEventListener,
  AgentRegistryConfig,
  AgentHealthCheck,
  AgentPerformanceMetrics,
  TaskExecution,
  TaskStatus,
} from '../types/agent-types';

/**
 * Registry for managing and orchestrating agents
 */
export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();
  private eventListeners: Set<AgentEventListener> = new Set();
  private taskExecutions: Map<string, TaskExecution> = new Map();
  private performanceMetrics: Map<string, AgentPerformanceMetrics> = new Map();
  private config: AgentRegistryConfig;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: Partial<AgentRegistryConfig> = {}) {
    this.config = {
      autoRegister: true,
      healthCheckInterval: 30000, // 30 seconds
      maxAgents: 100,
      allowCustomAgents: true,
      ...config,
    };

    this.startHealthCheckInterval();
  }

  /**
   * Register an agent with the registry
   */
  async registerAgent(agent: BaseAgent): Promise<void> {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(
        `Maximum number of agents (${this.config.maxAgents}) reached`
      );
    }

    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID '${agent.id}' is already registered`);
    }

    try {
      await agent.initialize();
      this.agents.set(agent.id, agent);

      // Initialize performance metrics
      this.performanceMetrics.set(agent.id, {
        agentId: agent.id,
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        lastExecutionTime: 0,
        errorRate: 0,
      });

      this.emitEvent({
        type: 'agent_registered',
        agentId: agent.id,
        timestamp: Date.now(),
        data: { name: agent.name, version: agent.version },
      });

      console.log(`Agent '${agent.id}' registered successfully`);
    } catch (error) {
      console.error(`Failed to register agent '${agent.id}':`, error);
      throw error;
    }
  }

  /**
   * Unregister an agent from the registry
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' is not registered`);
    }

    try {
      await agent.cleanup();
      this.agents.delete(agentId);
      this.performanceMetrics.delete(agentId);
      this.taskExecutions.delete(agentId);

      this.emitEvent({
        type: 'agent_unregistered',
        agentId,
        timestamp: Date.now(),
      });

      console.log(`Agent '${agentId}' unregistered successfully`);
    } catch (error) {
      console.error(`Failed to unregister agent '${agentId}':`, error);
      throw error;
    }
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): BaseAgent | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Get all registered agents
   */
  listAgents(): AgentInfo[] {
    return Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.name, // Could be enhanced with description
      version: agent.version,
      capabilities: agent.getCapabilities(),
      isActive: true,
      lastUpdated: Date.now(),
    }));
  }

  /**
   * Get agents that can handle a specific task type
   */
  getAgentsForTaskType(taskType: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.canHandleTask(taskType)
    );
  }

  /**
   * Execute a task using the most appropriate agent
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    const availableAgents = this.getAgentsForTaskType(task.type);

    if (availableAgents.length === 0) {
      return {
        success: false,
        error: `No agents available for task type: ${task.type}`,
        metadata: {
          executionTime: 0,
          timestamp: Date.now(),
        },
      };
    }

    // For now, use the first available agent
    // In the future, this could be enhanced with agent selection logic
    const agent = availableAgents[0];

    return await this.executeTaskWithAgent(task, agent);
  }

  /**
   * Execute a task with a specific agent
   */
  async executeTaskWithAgent(
    task: AgentTask,
    agent: BaseAgent
  ): Promise<AgentResult> {
    const executionId = `${agent.id}-${task.id}-${Date.now()}`;

    // Create task execution record
    const execution: TaskExecution = {
      task,
      status: 'pending',
      retryCount: 0,
    };

    this.taskExecutions.set(executionId, execution);

    try {
      // Update status to running
      execution.status = 'running';
      execution.startTime = Date.now();

      this.emitEvent({
        type: 'task_started',
        agentId: agent.id,
        taskId: task.id,
        timestamp: Date.now(),
        data: { executionId },
      });

      // Execute the task
      const result = await agent.execute(task);

      // Update execution record
      execution.endTime = Date.now();
      execution.status = result.success ? 'completed' : 'failed';
      execution.result = result;

      // Update performance metrics
      this.updatePerformanceMetrics(agent.id, result, execution);

      this.emitEvent({
        type: result.success ? 'task_completed' : 'task_failed',
        agentId: agent.id,
        taskId: task.id,
        timestamp: Date.now(),
        data: { executionId, result },
      });

      return result;
    } catch (error) {
      // Update execution record
      execution.endTime = Date.now();
      execution.status = 'failed';
      execution.error = error as Error;

      // Update performance metrics
      this.updatePerformanceMetrics(
        agent.id,
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            executionTime: execution.endTime - (execution.startTime || 0),
            timestamp: Date.now(),
          },
        },
        execution
      );

      this.emitEvent({
        type: 'task_failed',
        agentId: agent.id,
        taskId: task.id,
        timestamp: Date.now(),
        data: {
          executionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get performance metrics for an agent
   */
  getPerformanceMetrics(agentId: string): AgentPerformanceMetrics | null {
    return this.performanceMetrics.get(agentId) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics(): Map<string, AgentPerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Get task execution history
   */
  getTaskExecutions(agentId?: string): TaskExecution[] {
    const executions = Array.from(this.taskExecutions.values());
    return agentId
      ? executions.filter((exec) => exec.task.context.sessionId === agentId)
      : executions;
  }

  /**
   * Add event listener
   */
  addEventListener(listener: AgentEventListener): void {
    this.eventListeners.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: AgentEventListener): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Get health status of all agents
   */
  async getHealthStatus(): Promise<Map<string, AgentHealthCheck>> {
    const healthStatus = new Map<string, AgentHealthCheck>();

    for (const [agentId, agent] of this.agents) {
      try {
        const health = await agent.getHealthCheck();
        healthStatus.set(agentId, health);
      } catch (error) {
        healthStatus.set(agentId, {
          isHealthy: false,
          status: 'unhealthy',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          lastChecked: Date.now(),
        });
      }
    }

    return healthStatus;
  }

  /**
   * Cleanup registry resources
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Cleanup all agents
    const cleanupPromises = Array.from(this.agents.values()).map((agent) =>
      agent.cleanup()
    );
    await Promise.allSettled(cleanupPromises);

    this.agents.clear();
    this.performanceMetrics.clear();
    this.taskExecutions.clear();
    this.eventListeners.clear();
  }

  /**
   * Update performance metrics for an agent
   */
  private updatePerformanceMetrics(
    agentId: string,
    result: AgentResult,
    execution: TaskExecution
  ): void {
    const metrics = this.performanceMetrics.get(agentId);
    if (!metrics) return;

    const executionTime = execution.endTime! - execution.startTime!;

    // Update counters
    metrics.totalExecutions++;
    if (result.success) {
      metrics.successRate =
        (metrics.successRate * (metrics.totalExecutions - 1) + 1) /
        metrics.totalExecutions;
    } else {
      metrics.errorRate =
        (metrics.errorRate * (metrics.totalExecutions - 1) + 1) /
        metrics.totalExecutions;
    }

    // Update average execution time
    metrics.averageExecutionTime =
      (metrics.averageExecutionTime * (metrics.totalExecutions - 1) +
        executionTime) /
      metrics.totalExecutions;
    metrics.lastExecutionTime = executionTime;

    this.performanceMetrics.set(agentId, metrics);
  }

  /**
   * Start health check interval
   */
  private startHealthCheckInterval(): void {
    if (
      this.config.healthCheckInterval &&
      this.config.healthCheckInterval > 0
    ) {
      this.healthCheckInterval = setInterval(async () => {
        try {
          await this.performHealthChecks();
        } catch (error) {
          console.error('Health check interval failed:', error);
        }
      }, this.config.healthCheckInterval);
    }
  }

  /**
   * Perform health checks on all agents
   */
  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.agents.values()).map(
      async (agent) => {
        try {
          const health = await agent.getHealthCheck();
          if (!health.isHealthy) {
            console.warn(`Agent ${agent.id} is unhealthy:`, health);
          }
        } catch (error) {
          console.error(`Health check failed for agent ${agent.id}:`, error);
        }
      }
    );

    await Promise.allSettled(healthPromises);
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: AgentEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }
}
