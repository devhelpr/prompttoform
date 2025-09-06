import {
  AgentService,
  ConsoleAgentLogger,
  MemoryAgentMetrics,
  ExampleAgent,
  AgentTask,
  AgentResult,
} from '../index';

describe('Agent Framework', () => {
  let agentService: AgentService;
  let logger: ConsoleAgentLogger;
  let metrics: MemoryAgentMetrics;

  beforeEach(() => {
    logger = new ConsoleAgentLogger('info');
    metrics = new MemoryAgentMetrics();
    agentService = new AgentService({
      maxConcurrentTasks: 3,
      defaultTimeout: 5000,
      cachingEnabled: true,
      performanceMonitoring: true,
      logLevel: 'info',
    });
  });

  afterEach(async () => {
    await agentService.cleanup();
  });

  describe('Agent Registration', () => {
    it('should register an agent successfully', async () => {
      const exampleAgent = new ExampleAgent(
        'test-agent',
        'Test Agent',
        '1.0.0',
        logger,
        metrics
      );

      await agentService.registerAgent(exampleAgent);

      const agents = agentService.getRegisteredAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('test-agent');
    });

    it('should not register duplicate agents', async () => {
      const agent1 = new ExampleAgent(
        'test-agent',
        'Test Agent',
        '1.0.0',
        logger,
        metrics
      );
      const agent2 = new ExampleAgent(
        'test-agent',
        'Test Agent 2',
        '1.0.0',
        logger,
        metrics
      );

      await agentService.registerAgent(agent1);

      await expect(agentService.registerAgent(agent2)).rejects.toThrow(
        "Agent with ID 'test-agent' is already registered"
      );
    });
  });

  describe('Task Execution', () => {
    beforeEach(async () => {
      const exampleAgent = new ExampleAgent(
        'test-agent',
        'Test Agent',
        '1.0.0',
        logger,
        metrics
      );
      await agentService.registerAgent(exampleAgent);
    });

    it('should execute a task successfully', async () => {
      const task: AgentTask = {
        id: 'test-task-1',
        type: 'standard',
        prompt: 'Create a simple form',
        context: {
          sessionId: 'test-session',
        },
      };

      const results = await agentService.processPrompt(
        task.prompt,
        task.context
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].data).toBeDefined();
    });

    it('should handle task execution errors gracefully', async () => {
      const task: AgentTask = {
        id: 'test-task-2',
        type: 'invalid-type', // This should cause an error
        prompt: 'Invalid task',
        context: {
          sessionId: 'test-session',
        },
      };

      const result = await agentService.executeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No agents available');
    });
  });

  describe('Agent Suggestions', () => {
    beforeEach(async () => {
      const exampleAgent = new ExampleAgent(
        'test-agent',
        'Test Agent',
        '1.0.0',
        logger,
        metrics
      );
      await agentService.registerAgent(exampleAgent);
    });

    it('should provide agent suggestions for valid prompts', async () => {
      const suggestions = await agentService.getAgentSuggestions(
        'Create a simple form'
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should return empty suggestions for irrelevant prompts', async () => {
      const suggestions = await agentService.getAgentSuggestions(
        'completely irrelevant text'
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      const exampleAgent = new ExampleAgent(
        'test-agent',
        'Test Agent',
        '1.0.0',
        logger,
        metrics
      );
      await agentService.registerAgent(exampleAgent);
    });

    it('should track performance metrics', async () => {
      const task: AgentTask = {
        id: 'test-task-3',
        type: 'standard',
        prompt: 'Test performance tracking',
        context: {
          sessionId: 'test-session',
        },
      };

      await agentService.executeTask(task);

      const performanceMetrics =
        agentService.getPerformanceMetrics('test-agent');
      expect(performanceMetrics).toBeDefined();
      expect(performanceMetrics?.totalExecutions).toBeGreaterThan(0);
    });
  });

  describe('Health Checks', () => {
    beforeEach(async () => {
      const exampleAgent = new ExampleAgent(
        'test-agent',
        'Test Agent',
        '1.0.0',
        logger,
        metrics
      );
      await agentService.registerAgent(exampleAgent);
    });

    it('should perform health checks on agents', async () => {
      const healthStatus = await agentService.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus.has('test-agent')).toBe(true);

      const agentHealth = healthStatus.get('test-agent');
      expect(agentHealth).toBeDefined();
      expect(agentHealth?.isHealthy).toBe(true);
    });
  });
});
