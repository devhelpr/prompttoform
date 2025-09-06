import { AgentRegistry } from '../core/agent-registry';
import {
  AgentTask,
  AgentResult,
  AgentContext,
  AgentSuggestion,
  AgentEvent,
  AgentEventListener,
  AgentConfiguration,
  OrchestrationResult,
  AgentExecutionPlan,
  TaskDependency,
} from '../types/agent-types';

/**
 * Main service for agent communication and orchestration
 */
export class AgentService {
  private registry: AgentRegistry;
  private configuration: AgentConfiguration;
  private eventListeners: Set<AgentEventListener> = new Set();

  constructor(config?: Partial<AgentConfiguration>) {
    this.configuration = {
      maxConcurrentTasks: 5,
      defaultTimeout: 30000, // 30 seconds
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxDelay: 10000,
      },
      cachingEnabled: true,
      performanceMonitoring: true,
      logLevel: 'info',
      ...config,
    };

    this.registry = new AgentRegistry({
      autoRegister: true,
      healthCheckInterval: 30000,
      maxAgents: 100,
      allowCustomAgents: true,
    });

    // Forward registry events
    this.registry.addEventListener((event) => {
      this.emitEvent(event);
    });
  }

  /**
   * Process a user prompt and determine appropriate agent tasks
   */
  async processPrompt(
    prompt: string,
    context: AgentContext
  ): Promise<AgentResult[]> {
    try {
      // Analyze the prompt to determine what agents are needed
      const tasks = await this.analyzePrompt(prompt, context);

      if (tasks.length === 0) {
        return [
          {
            success: false,
            error: 'No suitable agents found for the given prompt',
            metadata: {
              executionTime: 0,
              timestamp: Date.now(),
            },
          },
        ];
      }

      // Execute tasks in parallel or sequence based on dependencies
      const results = await this.executeTasks(tasks);

      return results;
    } catch (error) {
      console.error('Error processing prompt:', error);
      return [
        {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
          metadata: {
            executionTime: 0,
            timestamp: Date.now(),
          },
        },
      ];
    }
  }

  /**
   * Execute a specific agent task
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      return await this.registry.executeTask(task);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Get suggestions for agents that could handle a prompt
   */
  async getAgentSuggestions(prompt: string): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    const availableAgents = this.registry.listAgents();

    for (const agentInfo of availableAgents) {
      // Simple heuristic to determine if agent might be suitable
      const confidence = this.calculateAgentConfidence(prompt, agentInfo);

      if (confidence > 0.3) {
        // Only suggest agents with >30% confidence
        suggestions.push({
          agentId: agentInfo.id,
          confidence,
          reason: this.generateSuggestionReason(prompt, agentInfo),
          estimatedTime: agentInfo.capabilities.estimatedExecutionTime || 5000,
        });
      }
    }

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Register an agent with the service
   */
  async registerAgent(agent: any): Promise<void> {
    await this.registry.registerAgent(agent);
  }

  /**
   * Unregister an agent from the service
   */
  async unregisterAgent(agentId: string): Promise<void> {
    await this.registry.unregisterAgent(agentId);
  }

  /**
   * Get all registered agents
   */
  getRegisteredAgents() {
    return this.registry.listAgents();
  }

  /**
   * Get agent performance metrics
   */
  getPerformanceMetrics(agentId?: string) {
    if (agentId) {
      return this.registry.getPerformanceMetrics(agentId);
    }
    return this.registry.getAllPerformanceMetrics();
  }

  /**
   * Get health status of all agents
   */
  async getHealthStatus() {
    return await this.registry.getHealthStatus();
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
   * Cleanup service resources
   */
  async cleanup(): Promise<void> {
    await this.registry.cleanup();
    this.eventListeners.clear();
  }

  /**
   * Analyze a prompt and determine what agent tasks are needed
   */
  private async analyzePrompt(
    prompt: string,
    context: AgentContext
  ): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // Simple keyword-based analysis - in a real implementation, this would use NLP
    if (
      this.containsKeywords(lowerPrompt, [
        'style',
        'theme',
        'color',
        'design',
        'look',
        'appearance',
      ])
    ) {
      tasks.push({
        id: `styling-${Date.now()}`,
        type: 'styling',
        prompt,
        context,
        parameters: {
          styleType: this.determineStyleType(lowerPrompt),
        },
      });
    }

    if (
      this.containsKeywords(lowerPrompt, [
        'calculate',
        'formula',
        'expression',
        'math',
        'compute',
        'sum',
        'total',
      ])
    ) {
      tasks.push({
        id: `expression-${Date.now()}`,
        type: 'expression',
        prompt,
        context,
        parameters: {
          expressionType: this.determineExpressionType(lowerPrompt),
        },
      });
    }

    if (
      this.containsKeywords(lowerPrompt, [
        'language',
        'translate',
        'spanish',
        'french',
        'german',
        'multilingual',
      ])
    ) {
      tasks.push({
        id: `multi-language-${Date.now()}`,
        type: 'multi-language',
        prompt,
        context,
        parameters: {
          targetLanguages: this.extractLanguages(lowerPrompt),
        },
      });
    }

    // Always include standard form generation if no specific tasks were identified
    if (tasks.length === 0) {
      tasks.push({
        id: `standard-${Date.now()}`,
        type: 'standard',
        prompt,
        context,
      });
    }

    return tasks;
  }

  /**
   * Execute multiple tasks with dependency management
   */
  private async executeTasks(tasks: AgentTask[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const executionPlan = this.createExecutionPlan(tasks);

    if (executionPlan.parallelExecution) {
      // Execute tasks in parallel
      const promises = tasks.map((task) => this.executeTask(task));
      const taskResults = await Promise.allSettled(promises);

      for (const result of taskResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : 'Task execution failed',
            metadata: {
              executionTime: 0,
              timestamp: Date.now(),
            },
          });
        }
      }
    } else {
      // Execute tasks sequentially
      for (const task of tasks) {
        const result = await this.executeTask(task);
        results.push(result);

        // Stop execution if a critical task fails
        if (!result.success && this.isCriticalTask(task)) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Create execution plan for tasks
   */
  private createExecutionPlan(tasks: AgentTask[]): AgentExecutionPlan {
    const dependencies: TaskDependency[] = [];
    let canExecuteInParallel = true;

    // Simple dependency analysis - in a real implementation, this would be more sophisticated
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        if (this.hasDependency(tasks[i], tasks[j])) {
          dependencies.push({
            taskId: tasks[j].id,
            dependsOn: [tasks[i].id],
            type: 'sequential',
          });
          canExecuteInParallel = false;
        }
      }
    }

    return {
      tasks,
      dependencies,
      estimatedTotalTime: tasks.reduce(
        (total, task) =>
          total + (task.timeout || this.configuration.defaultTimeout),
        0
      ),
      parallelExecution: canExecuteInParallel,
    };
  }

  /**
   * Calculate confidence score for an agent based on prompt analysis
   */
  private calculateAgentConfidence(prompt: string, agentInfo: any): number {
    const lowerPrompt = prompt.toLowerCase();
    let confidence = 0;

    // Check for task type keywords
    for (const taskType of agentInfo.capabilities.supportedTaskTypes) {
      const keywords = this.getKeywordsForTaskType(taskType);
      const matches = keywords.filter((keyword) =>
        lowerPrompt.includes(keyword)
      );
      confidence += (matches.length / keywords.length) * 0.8;
    }

    // Check for form type keywords
    if (agentInfo.capabilities.supportedFormTypes) {
      for (const formType of agentInfo.capabilities.supportedFormTypes) {
        if (lowerPrompt.includes(formType.toLowerCase())) {
          confidence += 0.2;
        }
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate a reason for agent suggestion
   */
  private generateSuggestionReason(prompt: string, agentInfo: any): string {
    const taskTypes = agentInfo.capabilities.supportedTaskTypes.join(', ');
    return `This agent can handle ${taskTypes} tasks and appears suitable for your request.`;
  }

  /**
   * Check if prompt contains specific keywords
   */
  private containsKeywords(prompt: string, keywords: string[]): boolean {
    return keywords.some((keyword) => prompt.includes(keyword));
  }

  /**
   * Determine style type from prompt
   */
  private determineStyleType(prompt: string): string {
    if (prompt.includes('theme') || prompt.includes('color')) return 'theme';
    if (prompt.includes('layout') || prompt.includes('arrange'))
      return 'layout';
    if (prompt.includes('responsive') || prompt.includes('mobile'))
      return 'responsive';
    if (prompt.includes('accessibility') || prompt.includes('a11y'))
      return 'accessibility';
    return 'theme';
  }

  /**
   * Determine expression type from prompt
   */
  private determineExpressionType(prompt: string): string {
    if (prompt.includes('conditional') || prompt.includes('if'))
      return 'conditional';
    if (prompt.includes('calculate') || prompt.includes('formula'))
      return 'calculation';
    if (prompt.includes('validate') || prompt.includes('check'))
      return 'validation';
    return 'calculation';
  }

  /**
   * Extract target languages from prompt
   */
  private extractLanguages(prompt: string): string[] {
    const languages: string[] = [];
    const languageMap: Record<string, string> = {
      spanish: 'es',
      french: 'fr',
      german: 'de',
      italian: 'it',
      portuguese: 'pt',
      chinese: 'zh',
      japanese: 'ja',
      korean: 'ko',
    };

    for (const [name, code] of Object.entries(languageMap)) {
      if (prompt.includes(name)) {
        languages.push(code);
      }
    }

    return languages.length > 0 ? languages : ['en']; // Default to English
  }

  /**
   * Get keywords for a specific task type
   */
  private getKeywordsForTaskType(taskType: string): string[] {
    const keywordMap: Record<string, string[]> = {
      styling: [
        'style',
        'theme',
        'color',
        'design',
        'look',
        'appearance',
        'css',
        'styling',
      ],
      expression: [
        'calculate',
        'formula',
        'expression',
        'math',
        'compute',
        'sum',
        'total',
        'conditional',
      ],
      'multi-language': [
        'language',
        'translate',
        'spanish',
        'french',
        'german',
        'multilingual',
        'i18n',
      ],
      standard: ['form', 'create', 'generate', 'build', 'make'],
    };

    return keywordMap[taskType] || [];
  }

  /**
   * Check if two tasks have a dependency
   */
  private hasDependency(task1: AgentTask, task2: AgentTask): boolean {
    // Simple dependency logic - styling depends on standard, expressions depend on standard
    if (
      task1.type === 'standard' &&
      ['styling', 'expression'].includes(task2.type)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Check if a task is critical (should stop execution if it fails)
   */
  private isCriticalTask(task: AgentTask): boolean {
    return task.type === 'standard' || task.priority === 'urgent';
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
