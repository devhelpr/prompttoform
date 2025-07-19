import { useState, useEffect } from 'react';
import { FormSession, FormSessionService } from '../../services/indexeddb';

interface SessionManagerProps {
  currentSessionId: string | null;
  onLoadSession: (session: FormSession) => void;
  onStartNewSession: () => void;
}

export function SessionManager({
  currentSessionId,
  onLoadSession,
  onStartNewSession,
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<FormSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Load sessions from IndexedDB
  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedSessions = await FormSessionService.getAllSessions();
        setSessions(loadedSessions);
      } catch (err) {
        setError('Failed to load sessions');
        console.error('Error loading sessions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  const handleLoadSession = async (session: FormSession) => {
    try {
      onLoadSession(session);
    } catch (err) {
      setError('Failed to load session');
      console.error('Error loading session:', err);
    }
  };

  const handleStartNewSession = () => {
    try {
      onStartNewSession();
    } catch (err) {
      setError('Failed to start new session');
      console.error('Error starting new session:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await FormSessionService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete session');
      console.error('Error deleting session:', err);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncatePrompt = (prompt: string, maxLength = 100) => {
    return prompt.length > maxLength
      ? prompt.substring(0, maxLength) + '...'
      : prompt;
  };

  const getSessionTitle = (session: FormSession) => {
    // Extract first line or first 50 characters as title
    const firstLine = session.prompt.split('\n')[0];
    return firstLine.length > 50
      ? firstLine.substring(0, 50) + '...'
      : firstLine;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">Session History</h3>
        <button
          onClick={handleStartNewSession}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Session
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-red-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-zinc-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No sessions found</p>
            <p className="text-xs text-zinc-400 mt-1">
              Create your first form to see it here
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border rounded-lg transition-colors ${
                currentSessionId === session.id
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-zinc-900 truncate">
                      {getSessionTitle(session)}
                    </h4>
                    {currentSessionId === session.id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-600 mb-2">
                    {truncatePrompt(session.prompt)}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-zinc-500">
                    <span>{formatDate(session.createdAt)}</span>
                    {session.netlifySiteId && (
                      <span className="text-indigo-600 flex items-center space-x-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span>Deployed</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleLoadSession(session)}
                    className="p-2 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md transition-colors"
                    title="Load session"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(session.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md transition-colors"
                    title="Delete session"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === session.id && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-3">
                    Are you sure you want to delete this session? This action
                    cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 text-sm bg-zinc-300 text-zinc-700 rounded hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
