import React, { useState, useEffect } from 'react';
import { AgentService } from '@devhelpr/agent-framework';
import {
  AgentTask,
  AgentResult,
  AgentSuggestion,
} from '@devhelpr/agent-framework';
import { useAgentService } from '../../hooks/use-agent-service';

interface AgentTaskPanelProps {
  agentService: AgentService;
  onTaskComplete?: (results: AgentResult[]) => void;
  className?: string;
}

export function AgentTaskPanel({
  agentService,
  onTaskComplete,
  className = '',
}: AgentTaskPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [results, setResults] = useState<AgentResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get agent suggestions when prompt changes
  useEffect(() => {
    if (prompt.trim().length > 10) {
      const timeoutId = setTimeout(async () => {
        try {
          const agentSuggestions = await agentService.getAgentSuggestions(
            prompt
          );
          setSuggestions(agentSuggestions);
          setShowSuggestions(agentSuggestions.length > 0);
        } catch (err) {
          console.error('Failed to get agent suggestions:', err);
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [prompt, agentService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const taskResults = await agentService.processPrompt(prompt, {
        sessionId: 'current-session',
        userPreferences: {
          language: 'en',
          theme: 'default',
        },
      });

      setResults(taskResults);
      onTaskComplete?.(taskResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: AgentSuggestion) => {
    setPrompt((prev) => `${prev} ${suggestion.reason}`);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setPrompt('');
    setResults([]);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Agent Task Panel
        </h3>
        <p className="text-sm text-gray-600">
          Describe what you want to accomplish and let our agents help you.
        </p>
      </div>

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
            placeholder="e.g., 'Create a modern blue theme for my form' or 'Add calculations to compute total cost'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            disabled={isLoading}
          />

          {/* Agent Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Suggested agents:
              </p>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left p-2 text-sm text-blue-800 hover:bg-blue-100 rounded border border-blue-200"
                  >
                    <div className="font-medium">{suggestion.agentId}</div>
                    <div className="text-xs text-blue-600">
                      {suggestion.reason} (Confidence:{' '}
                      {Math.round(suggestion.confidence * 100)}%)
                    </div>
                  </button>
                ))}
              </div>
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
              'Execute Task'
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Results</h4>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {result.success ? (
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
                    <h5 className="text-sm font-medium">
                      {result.success ? 'Task Completed' : 'Task Failed'}
                    </h5>
                    {result.success ? (
                      <div className="mt-1">
                        {result.data && (
                          <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                        {result.metadata && (
                          <p className="text-xs text-green-600 mt-1">
                            Execution time: {result.metadata.executionTime}ms
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-red-800 mt-1">
                        {result.error}
                      </p>
                    )}
                    {result.warnings && result.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-yellow-800">
                          Warnings:
                        </p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {result.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
