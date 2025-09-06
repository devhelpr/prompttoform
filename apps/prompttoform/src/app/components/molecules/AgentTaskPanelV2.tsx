import React, { useState, useEffect } from 'react';
import {
  AgentTask,
  AgentResult,
  AgentSuggestion,
} from '@devhelpr/agent-framework';
import { useAgentService } from '../../hooks/use-agent-service';

interface AgentTaskPanelV2Props {
  onTaskComplete?: (results: AgentResult[]) => void;
  className?: string;
}

export function AgentTaskPanelV2({
  onTaskComplete,
  className = '',
}: AgentTaskPanelV2Props) {
  const {
    agentService,
    isInitialized,
    error: serviceError,
    executeTask,
    processPrompt,
    getAgentSuggestions,
  } = useAgentService();

  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AgentResult | null>(null);

  // Debounced suggestion fetching
  useEffect(() => {
    if (!prompt.trim() || prompt.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const agentSuggestions = await getAgentSuggestions(prompt);
        setSuggestions(agentSuggestions);
        setShowSuggestions(agentSuggestions.length > 0);
      } catch (error) {
        console.error('Failed to get agent suggestions:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [prompt, getAgentSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const context = {
        sessionId: `session-${Date.now()}`,
        userPreferences: {
          accessibilityLevel: 'AA',
        },
      };

      const results = await processPrompt(prompt, context);
      setLastResult(results[0] || null);
      onTaskComplete?.(results);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process prompt';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: AgentSuggestion) => {
    setPrompt((prev) => `${prev} ${suggestion.reason}`);
    setShowSuggestions(false);
  };

  if (!isInitialized) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            Initializing agent service...
          </span>
        </div>
      </div>
    );
  }

  if (serviceError) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="text-red-600">
          <h3 className="font-medium">Service Error</h3>
          <p className="text-sm mt-1">{serviceError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        AI Form Generation
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="agent-prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What would you like to do?
          </label>
          <textarea
            id="agent-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Describe the form you want to create... (e.g., 'Create a customer feedback form with rating scales')"
            disabled={isLoading}
          />

          {/* Agent Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">Suggested agents:</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                >
                  <div className="font-medium">{suggestion.agentId}</div>
                  <div className="text-xs text-blue-600">
                    {suggestion.reason} (Confidence:{' '}
                    {Math.round(suggestion.confidence * 100)}%)
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Generate Form'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPrompt('');
              setError(null);
              setLastResult(null);
              setShowSuggestions(false);
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {lastResult && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {lastResult.success ? (
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {lastResult.success ? 'Success' : 'Failed'}
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                {lastResult.success ? (
                  <div>
                    <p className="font-medium">Form generated successfully!</p>
                    {lastResult.data && (
                      <div className="mt-2">
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {JSON.stringify(lastResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-800 mt-1">
                    {lastResult.error}
                  </p>
                )}
                {lastResult.warnings && lastResult.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-yellow-800">
                      Warnings:
                    </p>
                    <ul className="text-xs text-yellow-700 list-disc list-inside">
                      {lastResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
