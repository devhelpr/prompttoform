import React, { useState, useEffect } from 'react';
import { AgentService } from '@devhelpr/agent-framework';
import { AgentTaskPanelV2 } from '../molecules/AgentTaskPanelV2';
import { AgentHistory } from '../molecules/AgentHistory';
import { AgentEnhancedFormEditor } from '../molecules/AgentEnhancedFormEditor';
import { AgentResult, AgentHealthCheck } from '@devhelpr/agent-framework';
import { useAgentService } from '../../hooks/use-agent-service';

interface AgentDashboardProps {
  agentService: AgentService;
  className?: string;
}

export function AgentDashboard({
  agentService,
  className = '',
}: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');
  const [healthStatus, setHealthStatus] = useState<
    Map<string, AgentHealthCheck>
  >(new Map());
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  useEffect(() => {
    loadHealthStatus();

    // Set up health check interval
    const interval = setInterval(loadHealthStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [agentService]);

  const loadHealthStatus = async () => {
    try {
      setIsLoadingHealth(true);
      const health = await agentService.getHealthStatus();
      setHealthStatus(health);
    } catch (error) {
      console.error('Failed to load health status:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const handleTaskComplete = (results: AgentResult[]) => {
    // Switch to history tab to show the results
    setActiveTab('history');
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'unhealthy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const registeredAgents = agentService.getRegisteredAgents();

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Agent Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Manage and monitor AI agents for form generation tasks
              </p>
            </div>

            {/* Health Status */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {isLoadingHealth ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Checking health...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">Agents:</span>
                    {Array.from(healthStatus.entries()).map(
                      ([agentId, health]) => (
                        <span
                          key={agentId}
                          className={`inline-flex items-center mr-1 ${getHealthStatusColor(
                            health.status
                          )}`}
                          title={`${agentId}: ${health.status}`}
                        >
                          {getHealthStatusIcon(health.status)}
                        </span>
                      )
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Task Execution
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History & Performance
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'tasks' && (
            <div>
              <AgentTaskPanel
                agentService={agentService}
                onTaskComplete={handleTaskComplete}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <AgentHistory agentService={agentService} />
            </div>
          )}
        </div>

        {/* Agent Status Overview */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Registered Agents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredAgents.map((agent) => {
              const health = healthStatus.get(agent.id);
              return (
                <div
                  key={agent.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {agent.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{agent.id}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {agent.description}
                      </p>

                      <div className="mt-3">
                        <div className="text-xs text-gray-500">
                          <div>Version: {agent.version}</div>
                          <div>
                            Complexity: {agent.capabilities.maxComplexity}
                          </div>
                          <div>
                            Task Types:{' '}
                            {agent.capabilities.supportedTaskTypes.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      {health && (
                        <div
                          className={`flex items-center ${getHealthStatusColor(
                            health.status
                          )}`}
                        >
                          {getHealthStatusIcon(health.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
