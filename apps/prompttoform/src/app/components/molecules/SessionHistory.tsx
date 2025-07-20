import { useState, useEffect, useRef } from 'react';
import {
  FormSessionService,
  FormSession,
  FormUpdate,
} from '../../services/indexeddb';
import { UpdateAccordion } from './UpdateAccordion';
import { ConfirmationDialog } from './ConfirmationDialog';

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
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  );
  const [sessionUpdates, setSessionUpdates] = useState<
    Record<string, FormUpdate[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    sessionId: string | null;
  }>({ isOpen: false, sessionId: null });
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
    setDeleteConfirmation({ isOpen: true, sessionId });
  };

  const confirmDeleteSession = async () => {
    if (!deleteConfirmation.sessionId) return;

    try {
      await FormSessionService.deleteSession(deleteConfirmation.sessionId);
      await loadSessions(); // Reload the list
    } catch (err) {
      setError('Failed to delete session');
      console.error('Error deleting session:', err);
    } finally {
      setDeleteConfirmation({ isOpen: false, sessionId: null });
    }
  };

  const cancelDeleteSession = () => {
    setDeleteConfirmation({ isOpen: false, sessionId: null });
  };

  const handleLoadSession = async (session: FormSession) => {
    await onLoadSession(session);
    onClose(); // Close the dialog after loading
  };

  const toggleSessionExpansion = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // Load updates for this session if not already loaded
      if (!sessionUpdates[sessionId]) {
        try {
          const updates = await FormSessionService.getSessionUpdates(sessionId);
          setSessionUpdates((prev) => ({ ...prev, [sessionId]: updates }));
        } catch (err) {
          console.error('Error loading updates:', err);
        }
      }
    }
    setExpandedSessions(newExpanded);
  };

  const handleLoadUpdate = async (update: FormUpdate) => {
    // Find the original session to preserve its information
    const originalSession = sessions.find((s) => s.id === update.sessionId);
    if (!originalSession) {
      console.error('Original session not found for update:', update.id);
      return;
    }

    // Create a session object with the update's JSON but preserve original session info
    const sessionWithUpdate: FormSession = {
      ...originalSession,
      generatedJson: update.updatedJson,
      updatedAt: update.createdAt,
    };

    await onLoadSession(sessionWithUpdate);
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
                    className="border border-zinc-200 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 hover:bg-zinc-50 transition-colors">
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
                          {updateCounts[session.id] > 1 && (
                            <button
                              onClick={() => toggleSessionExpansion(session.id)}
                              className="inline-flex items-center px-2 py-1 border border-zinc-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="View updates"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${
                                  expandedSessions.has(session.id)
                                    ? 'rotate-180'
                                    : ''
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
                          )}
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

                    {/* Accordion for updates */}
                    {expandedSessions.has(session.id) &&
                      updateCounts[session.id] > 1 && (
                        <div className="border-t border-zinc-200 bg-zinc-50 p-4">
                          <h5 className="text-sm font-medium text-zinc-900 mb-3">
                            Update History
                          </h5>
                          {sessionUpdates[session.id] ? (
                            <UpdateAccordion
                              updates={sessionUpdates[session.id]}
                              onLoadUpdate={handleLoadUpdate}
                            />
                          ) : (
                            <div className="text-sm text-zinc-500">
                              Loading updates...
                            </div>
                          )}
                        </div>
                      )}
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
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteSession}
        onCancel={cancelDeleteSession}
        variant="danger"
      />
    </dialog>
  );
}
