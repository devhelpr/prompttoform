import React, { useEffect, useState } from 'react';
import { AgentDashboard } from '../components/templates/AgentDashboard';
import { AgentServiceProvider } from '../services/agent-service-provider';
import { AgentService } from '@devhelpr/agent-framework';

export function AgentDemoPage() {
  const [agentService, setAgentService] = useState<AgentService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAgentService = async () => {
      try {
        setIsLoading(true);
        const service = AgentServiceProvider.getInstance();
        setAgentService(service);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize agent service'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeAgentService();

    // Cleanup on unmount
    return () => {
      AgentServiceProvider.cleanup();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Agent Framework...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Initialization Error
            </h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!agentService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Agent service not available</p>
        </div>
      </div>
    );
  }

  return <AgentDashboard agentService={agentService} />;
}
