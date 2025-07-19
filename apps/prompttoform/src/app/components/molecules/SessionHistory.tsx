import { useState, useEffect, useRef } from 'react';
import { FormSessionService, FormSession } from '../../services/indexeddb';

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (session: FormSession) => Promise<void>;
  onStartNewSession: () => void;
}

export function SessionHistory({
  isOpen,
  onClose,
  onLoadSession,
  onStartNewSession,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<FormSession[]>([]);
  const [updateCounts, setUpdateCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Control dialog open/close state
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      loadSessions(); // Load sessions when dialog opens
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const allSessions = await FormSessionService.getAllSessions();
      setSessions(allSessions);

      // Load update counts for each session
      const counts: Record<string, number> = {};
      for (const session of allSessions) {
        counts[session.id] = await FormSessionService.getUpdateCount(
          session.id
        );
      }
      setUpdateCounts(counts);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    // eslint-disable-next-line no-alert
    if (
      window.confirm(
        'Are you sure you want to delete this session? This action cannot be undone.'
      )
    ) {
      try {
        await FormSessionService.deleteSession(sessionId);
        await loadSessions(); // Reload the list
      } catch (err) {
        setError('Failed to delete session');
        console.error('Error deleting session:', err);
      }
    }
  };

  const handleLoadSession = async (session: FormSession) => {
    await onLoadSession(session);
    onClose(); // Close the dialog after loading
  };

  const handleStartNewSession = () => {
    onStartNewSession();
    onClose(); // Close the dialog after starting new session
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const truncateText = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Handle background click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/30 backdrop:backdrop-blur-sm rounded-lg p-0 max-w-4xl shadow-xl border-0 m-auto w-full md:w-[48rem] max-h-[80vh] overflow-hidden"
      style={{ top: '50%', transform: 'translateY(-50%)' }}
      onClick={handleBackdropClick}
    >
      <div className="p-8 max-h-[calc(80vh-4rem)] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Session History</h2>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-zinc-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-zinc-200 rounded"></div>
              <div className="h-20 bg-zinc-200 rounded"></div>
              <div className="h-20 bg-zinc-200 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">
                  No sessions found. Create your first form to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-zinc-200 rounded-lg p-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-900 mb-2">
                          {truncateText(session.prompt, 80)}
                        </h4>
                        <div className="text-sm text-zinc-500 space-y-1">
                          <p>Created: {formatDate(session.createdAt)}</p>
                          <p>Updated: {formatDate(session.updatedAt)}</p>
                          {updateCounts[session.id] > 0 && (
                            <p className="text-green-600">
                              {updateCounts[session.id]} update
                              {updateCounts[session.id] !== 1 ? 's' : ''}{' '}
                              applied
                            </p>
                          )}
                          {session.netlifySiteId && (
                            <p className="text-indigo-600">
                              Deployed to: {session.netlifySiteId}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleLoadSession(session)}
                          className="inline-flex items-center px-3 py-1 border border-zinc-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={handleStartNewSession}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start New Session
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
