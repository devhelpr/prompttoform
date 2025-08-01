import { useState, useEffect } from 'react';
import { FormUpdate, FormSessionService } from '../../services/indexeddb';

interface FormEditorSidebarProps {
  originalPrompt: string;
  updatePrompt: string;
  onUpdatePromptChange: (prompt: string) => void;
  onDeploy: () => void;
  onEvaluate: () => void;
  onUpdate: () => void;
  isDeploying: boolean;
  isEvaluating: boolean;
  isUpdating: boolean;
  currentSessionId: string | null;
}

export function FormEditorSidebar({
  originalPrompt,
  updatePrompt,
  onUpdatePromptChange,
  onDeploy,
  onEvaluate,
  onUpdate,
  isDeploying,
  isEvaluating,
  isUpdating,
  currentSessionId,
}: FormEditorSidebarProps) {
  const [piiWarning, setPiiWarning] = useState<string | null>(null);
  const [creationHistory, setCreationHistory] = useState<FormUpdate[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load creation history when session changes
  useEffect(() => {
    if (currentSessionId) {
      const loadHistory = async () => {
        try {
          console.log(
            'Loading creation history for session:',
            currentSessionId
          );
          const updates = await FormSessionService.getSessionUpdates(
            currentSessionId
          );
          console.log('Loaded updates:', updates);
          setCreationHistory(updates);
        } catch (error) {
          console.error('Failed to load creation history:', error);
        }
      };
      loadHistory();
    } else {
      setCreationHistory([]);
    }
  }, [currentSessionId]);

  // Refresh history after updates (when isUpdating changes from true to false)
  useEffect(() => {
    if (!isUpdating && currentSessionId) {
      const refreshHistory = async () => {
        try {
          console.log('Refreshing creation history after update');
          const updates = await FormSessionService.getSessionUpdates(
            currentSessionId
          );
          console.log('Refreshed updates:', updates);
          setCreationHistory(updates);
        } catch (error) {
          console.error('Failed to refresh creation history:', error);
        }
      };
      refreshHistory();
    }
  }, [isUpdating, currentSessionId]);

  const handleUpdatePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    onUpdatePromptChange(newValue);

    // PII detection
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{3}\.\d{2}\.\d{4}\b/, // SSN with dots
      /\b\d{10}\b/, // Phone number
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    ];

    const hasPII = piiPatterns.some((pattern) => pattern.test(newValue));
    if (hasPII) {
      setPiiWarning('Warning: This prompt may contain personal information.');
    } else {
      setPiiWarning(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncatePrompt = (prompt: string, maxLength = 60) => {
    return prompt.length > maxLength
      ? prompt.substring(0, maxLength) + '...'
      : prompt;
  };

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto">
      {/* Session Info */}
      {currentSessionId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Active Session
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1 truncate">
            ID: {currentSessionId}
          </p>
        </div>
      )}

      {/* Original Prompt */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Original Prompt
        </label>
        <textarea
          value={originalPrompt}
          readOnly
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm resize-none"
          rows={4}
          placeholder="Original prompt will appear here..."
        />
      </div>

      {/* Update Prompt */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Update Form
        </label>
        <textarea
          value={updatePrompt}
          onChange={handleUpdatePromptChange}
          className={`w-full rounded-lg border shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 p-3 text-sm resize-none transition-all duration-200 ${
            piiWarning ? 'border-amber-300' : 'border-zinc-200'
          }`}
          placeholder="Describe the changes you want to make to the form..."
          rows={4}
        />

        {/* PII Warning */}
        {piiWarning && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            {piiWarning}
          </div>
        )}

        {/* Update Button */}
        <button
          onClick={onUpdate}
          disabled={isUpdating || !updatePrompt.trim()}
          className={`mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
            isUpdating ? 'cursor-not-allowed' : ''
          }`}
        >
          {isUpdating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Updating...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Update Form
            </>
          )}
        </button>
      </div>

      {/* Creation History */}
      {currentSessionId && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-zinc-700 mb-2 hover:text-zinc-900"
          >
            <span>
              Form Changes{' '}
              {creationHistory.length > 0 ? `(${creationHistory.length})` : ''}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${
                showHistory ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showHistory && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {creationHistory.length > 0 ? (
                creationHistory.map((update, index) => (
                  <div
                    key={update.id}
                    className={`p-3 border rounded-lg ${
                      update.updateType === 'patch'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-purple-50 border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            update.updateType === 'patch'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {update.updateType === 'patch' ? (
                            <>
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              Update
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Evaluate
                            </>
                          )}
                        </span>
                        <span className="text-xs font-medium text-zinc-600">
                          Change {creationHistory.length - index}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {formatDate(update.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      {truncatePrompt(update.updatePrompt, 80)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-center">
                  <svg
                    className="w-8 h-8 mx-auto text-zinc-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm text-zinc-600">No changes yet</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Use "Update Form" or "Evaluate & Improve" to make changes
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onEvaluate}
          disabled={isEvaluating || !updatePrompt.trim()}
          className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
            isEvaluating ? 'cursor-not-allowed' : ''
          }`}
        >
          {isEvaluating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Evaluating...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Evaluate & Improve
            </>
          )}
        </button>

        <button
          onClick={onDeploy}
          disabled={isDeploying}
          className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
            isDeploying ? 'cursor-not-allowed' : ''
          }`}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          Deploy to Netlify
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-zinc-500 space-y-2">
        <p>
          <strong>Update Form:</strong> Applies precise changes using JSON-patch
          operations. Faster and more targeted.
        </p>
        <p>
          <strong>Evaluate & Improve:</strong> Analyzes your form and suggests
          comprehensive improvements. May regenerate the entire form.
        </p>
        <p>
          <strong>Deploy to Netlify:</strong> Creates a live, shareable version
          of your form.
        </p>
      </div>
    </div>
  );
}
