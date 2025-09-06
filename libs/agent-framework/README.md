# Agent Framework

A comprehensive framework for building and managing AI agents in the PromptToForm.ai ecosystem.

## Overview

The Agent Framework provides a robust foundation for creating, registering, and orchestrating AI agents that can perform various tasks related to form generation, styling, expressions, and multi-language support.

## Features

- **Agent Registration & Management**: Register and manage multiple agents with different capabilities
- **Task Execution**: Execute tasks with proper validation, error handling, and retry logic
- **Performance Monitoring**: Track agent performance metrics and health status
- **Event System**: Subscribe to agent events for real-time monitoring
- **Caching**: Built-in caching support for improved performance
- **Logging**: Comprehensive logging with multiple log levels
- **Health Checks**: Automatic health monitoring for all registered agents

## Installation

```bash
npm install @devhelpr/agent-framework
```

## Quick Start

### 1. Create an Agent

```typescript
import { BaseAgent, ConsoleAgentLogger, MemoryAgentMetrics } from '@devhelpr/agent-framework';
import { AgentTask, AgentResult, ValidationResult, AgentCapabilities } from '@devhelpr/agent-framework';

class MyCustomAgent extends BaseAgent {
  constructor(id: string, name: string, version: string, logger: any, metrics: any) {
    super(id, name, version, logger, metrics);
  }

  getCapabilities(): AgentCapabilities {
    return {
      supportedTaskTypes: ['custom'],
      supportedFormTypes: ['simple', 'complex'],
      maxComplexity: 'high',
      requiresLLM: true,
      estimatedExecutionTime: 5000,
    };
  }

  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    // Your agent logic here
    return {
      success: true,
      data: { message: 'Task completed successfully' },
      metadata: {
        executionTime: 1000,
        timestamp: Date.now(),
      },
    };
  }

  protected async validateTask(task: AgentTask): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  protected async onInitialize(): Promise<void> {
    // Initialize your agent
  }

  protected async onCleanup(): Promise<void> {
    // Cleanup resources
  }

  protected async checkHealth(): Promise<{
    isHealthy: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    return {
      isHealthy: true,
      status: 'healthy',
      details: { uptime: Date.now() },
    };
  }
}
```

### 2. Register and Use the Agent

```typescript
import { AgentService, ConsoleAgentLogger, MemoryAgentMetrics } from '@devhelpr/agent-framework';

// Create the agent service
const logger = new ConsoleAgentLogger('info');
const metrics = new MemoryAgentMetrics();
const agentService = new AgentService({
  maxConcurrentTasks: 5,
  defaultTimeout: 30000,
  cachingEnabled: true,
  performanceMonitoring: true,
});

// Create and register your agent
const myAgent = new MyCustomAgent('my-agent', 'My Custom Agent', '1.0.0', logger, metrics);
await agentService.registerAgent(myAgent);

// Execute a task
const result = await agentService.processPrompt('Create a custom form', {
  sessionId: 'user-session-123',
  userPreferences: {
    language: 'en',
    theme: 'modern',
  },
});

console.log('Task result:', result);
```

### 3. Monitor Agent Performance

```typescript
// Get performance metrics
const metrics = agentService.getPerformanceMetrics('my-agent');
console.log('Agent performance:', metrics);

// Get health status
const health = await agentService.getHealthStatus();
console.log('Agent health:', health.get('my-agent'));

// Get agent suggestions
const suggestions = await agentService.getAgentSuggestions('Create a form with styling');
console.log('Suggested agents:', suggestions);
```

## Agent Types

The framework supports different types of agents:

### Standard Agent
Handles basic form generation tasks.

### Styling Agent
Manages form styling, themes, and visual customization.

### Expression Agent
Handles mathematical expressions, conditional logic, and dynamic calculations.

### Multi-Language Agent
Manages internationalization and multi-language support.

### Custom Agent
Allows you to create agents with custom functionality.

## Configuration

The AgentService can be configured with the following options:

```typescript
interface AgentConfiguration {
  maxConcurrentTasks: number;        // Maximum concurrent tasks (default: 5)
  defaultTimeout: number;            // Default task timeout in ms (default: 30000)
  retryPolicy: RetryPolicy;          // Retry configuration
  cachingEnabled: boolean;           // Enable caching (default: true)
  performanceMonitoring: boolean;    // Enable performance monitoring (default: true)
  logLevel: 'debug' | 'info' | 'warn' | 'error'; // Log level (default: 'info')
}
```

## Event System

Subscribe to agent events for real-time monitoring:

```typescript
agentService.addEventListener((event) => {
  switch (event.type) {
    case 'task_started':
      console.log(`Task ${event.taskId} started on agent ${event.agentId}`);
      break;
    case 'task_completed':
      console.log(`Task ${event.taskId} completed on agent ${event.agentId}`);
      break;
    case 'task_failed':
      console.log(`Task ${event.taskId} failed on agent ${event.agentId}`);
      break;
  }
});
```

## Testing

Run the test suite:

```bash
nx test agent-framework
```

## Building

Build the library:

```bash
nx build agent-framework
```

## API Reference

### Core Classes

- **BaseAgent**: Abstract base class for all agents
- **AgentService**: Main service for agent management and orchestration
- **AgentRegistry**: Registry for managing agent instances

### Utilities

- **ConsoleAgentLogger**: Console-based logging implementation
- **MemoryAgentMetrics**: In-memory metrics collection
- **MemoryAgentCache**: In-memory caching implementation

### Types

- **AgentTask**: Task definition interface
- **AgentResult**: Task result interface
- **AgentCapabilities**: Agent capability definition
- **AgentConfiguration**: Service configuration interface

## Contributing

1. Create your agent by extending `BaseAgent`
2. Implement all required abstract methods
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
