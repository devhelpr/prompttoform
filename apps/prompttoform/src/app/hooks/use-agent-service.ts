import { useState, useEffect, useCallback } from 'react';
import { AgentService } from '@devhelpr/agent-framework';
import { AgentServiceProvider } from '../services/agent-service-provider';

/**
 * React hook for using the agent service
 */
export function useAgentService() {
  const [agentService] = useState<AgentService>(() =>
    AgentServiceProvider.getInstance()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Agent service is already initialized when we get the instance
    setIsInitialized(true);
  }, []);

  const executeTask = useCallback(
    async (task: unknown) => {
      try {
        setError(null);
        return await agentService.executeTask(task);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err;
      }
    },
    [agentService]
  );

  const processPrompt = useCallback(
    async (prompt: string, context: unknown) => {
      try {
        setError(null);
        return await agentService.processPrompt(prompt, context);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err;
      }
    },
    [agentService]
  );

  const getAgentSuggestions = useCallback(
    async (prompt: string) => {
      try {
        setError(null);
        return await agentService.getAgentSuggestions(prompt);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err;
      }
    },
    [agentService]
  );

  const getRegisteredAgents = useCallback(() => {
    return agentService.getRegisteredAgents();
  }, [agentService]);

  const getPerformanceMetrics = useCallback(
    (agentId?: string) => {
      return agentService.getPerformanceMetrics(agentId);
    },
    [agentService]
  );

  const getTaskExecutions = useCallback(
    (agentId?: string) => {
      return agentService.getTaskExecutions(agentId);
    },
    [agentService]
  );

  const getHealthStatus = useCallback(async () => {
    try {
      setError(null);
      return await agentService.getHealthStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [agentService]);

  return {
    agentService,
    isInitialized,
    error,
    executeTask,
    processPrompt,
    getAgentSuggestions,
    getRegisteredAgents,
    getPerformanceMetrics,
    getTaskExecutions,
    getHealthStatus,
  };
}
