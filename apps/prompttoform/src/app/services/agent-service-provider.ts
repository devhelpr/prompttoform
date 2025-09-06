import {
  AgentService,
  ConsoleAgentLogger,
  MemoryAgentMetrics,
  MemoryAgentCache,
  ExampleAgent,
  StandardAgent,
} from '@devhelpr/agent-framework';

/**
 * Provider for the agent service with proper initialization
 */
export class AgentServiceProvider {
  private static instance: AgentService | null = null;

  /**
   * Get or create the agent service instance
   */
  static getInstance(): AgentService {
    if (!this.instance) {
      this.instance = this.createAgentService();
    }
    return this.instance;
  }

  /**
   * Create a new agent service with default configuration
   */
  private static createAgentService(): AgentService {
    const logger = new ConsoleAgentLogger('info');
    const metrics = new MemoryAgentMetrics();
    const cache = new MemoryAgentCache();

    const agentService = new AgentService({
      maxConcurrentTasks: 5,
      defaultTimeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxDelay: 10000,
      },
      cachingEnabled: true,
      performanceMonitoring: true,
      logLevel: 'info',
    });

    // Register agents for demonstration
    this.registerAgents(agentService, logger, metrics);

    return agentService;
  }

  /**
   * Register all available agents
   */
  private static async registerAgents(
    agentService: AgentService,
    logger: ConsoleAgentLogger,
    metrics: MemoryAgentMetrics
  ): Promise<void> {
    try {
      // Register example agent
      const exampleAgent = new ExampleAgent(
        'example-agent',
        'Example Agent',
        '1.0.0',
        logger,
        metrics
      );

      // Register standard agent
      const standardAgent = new StandardAgent(
        'standard-agent',
        'Standard Form Agent',
        '1.0.0',
        logger,
        metrics
      );

      await agentService.registerAgent(exampleAgent);
      await agentService.registerAgent(standardAgent);

      console.log(
        'Agents registered successfully: example-agent, standard-agent'
      );
    } catch (error) {
      console.error('Failed to register agents:', error);
    }
  }

  /**
   * Cleanup the agent service
   */
  static async cleanup(): Promise<void> {
    if (this.instance) {
      await this.instance.cleanup();
      this.instance = null;
    }
  }
}
