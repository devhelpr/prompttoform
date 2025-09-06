import React, { useState, useEffect } from 'react';
import { AgentService } from '@devhelpr/agent-framework';
import {
  TaskExecution,
  AgentPerformanceMetrics,
} from '@devhelpr/agent-framework';

interface AgentHistoryProps {
  agentService: AgentService;
  className?: string;
}

export function AgentHistory({
  agentService,
  className = '',
}: AgentHistoryProps) {
  const [taskExecutions, setTaskExecutions] = useState<TaskExecution[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    Map<string, AgentPerformanceMetrics>
  >(new Map());
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    loadPerformanceMetrics();
  }, [agentService]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const executions = agentService.getTaskExecutions();
      setTaskExecutions(executions);
    } catch (error) {
      console.error('Failed to load task history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const metrics = agentService.getPerformanceMetrics();
      if (metrics instanceof Map) {
        setPerformanceMetrics(metrics);
      } else {
        setPerformanceMetrics(new Map());
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startTime?: number, endTime?: number) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = endTime - startTime;
    return `${duration}ms`;
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const filteredExecutions = selectedAgent
    ? taskExecutions.filter(
        (exec) => exec.task.context.sessionId === selectedAgent
      )
    : taskExecutions;

  const registeredAgents = agentService.getRegisteredAgents();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Agent History & Performance
        </h3>
        <p className="text-sm text-gray-600">
          View task execution history and agent performance metrics.
        </p>
      </div>

      {/* Agent Filter */}
      <div className="mb-4">
        <label
          htmlFor="agent-filter"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filter by Agent
        </label>
        <select
          id="agent-filter"
          value={selectedAgent || ''}
          onChange={(e) => setSelectedAgent(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Agents</option>
          {registeredAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.id})
            </option>
          ))}
        </select>
      </div>

      {/* Performance Metrics Summary */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Performance Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from(performanceMetrics.entries()).map(
            ([agentId, metrics]) => (
              <div key={agentId} className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">
                  {agentId}
                </h5>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Total Executions: {metrics.totalExecutions}</div>
                  <div>
                    Success Rate: {Math.round(metrics.successRate * 100)}%
                  </div>
                  <div>
                    Avg Time: {Math.round(metrics.averageExecutionTime)}ms
                  </div>
                  <div>Error Rate: {Math.round(metrics.errorRate * 100)}%</div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Task Execution History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Task History</h4>
          <button
            onClick={loadHistory}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No task executions found.</p>
            {selectedAgent && (
              <p className="text-sm mt-1">
                Try selecting a different agent or clear the filter.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExecutions.map((execution, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {execution.task.id}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          execution.status
                        )}`}
                      >
                        {execution.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {execution.task.type}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {execution.task.prompt}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Started: {formatTimestamp(execution.startTime)}
                      </span>
                      <span>
                        Duration:{' '}
                        {formatDuration(execution.startTime, execution.endTime)}
                      </span>
                      <span>Retries: {execution.retryCount}</span>
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    {execution.result && (
                      <div className="text-right">
                        {execution.result.success ? (
                          <div className="text-green-600 text-sm">
                            ✓ Success
                          </div>
                        ) : (
                          <div className="text-red-600 text-sm">✗ Failed</div>
                        )}
                        {execution.result.metadata && (
                          <div className="text-xs text-gray-500 mt-1">
                            {execution.result.metadata.executionTime}ms
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Details */}
                {execution.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {execution.error.message}
                    </p>
                  </div>
                )}

                {/* Result Details */}
                {execution.result && execution.result.data && (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                      View Result Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {JSON.stringify(execution.result.data, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
