import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  ConversationState,
  ConversationMessage,
  AgentQuestion,
} from '../../types/agent.types';
import {
  ConversationManager,
  FormGenerationAgent,
} from '../../services/agents';
import { FormGenerationResult } from '../../services/form-generation.service';

export type AgentView = 'prompt' | 'conversation' | 'generating';

interface AgentState {
  currentView: AgentView;
  conversationState: ConversationState | null;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}

interface AgentStateContextType {
  state: AgentState;

  // State setters
  setCurrentView: (view: AgentView) => void;
  setConversationState: (state: ConversationState | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string | null) => void;

  // Agent actions
  startAgentConversation: (prompt: string) => Promise<void>;
  processUserResponse: (response: string, questionId: string) => Promise<void>;
  skipToFormGeneration: () => Promise<void>;
  generateFormFromConversation: () => Promise<FormGenerationResult | null>;
  resetAgentState: () => void;

  // Conversation management
  addMessage: (message: ConversationMessage) => void;
  updateQuestions: (questions: AgentQuestion[]) => void;
  markConversationComplete: () => void;
}

const initialAgentState: AgentState = {
  currentView: 'prompt',
  conversationState: null,
  isLoading: false,
  error: null,
  sessionId: null,
};

const AgentStateContext = createContext<AgentStateContextType | undefined>(
  undefined
);

interface AgentStateProviderProps {
  children: ReactNode;
  onFormGenerated?: (result: FormGenerationResult) => void;
  onError?: (error: string) => void;
}

export function AgentStateProvider({
  children,
  onFormGenerated,
  onError,
}: AgentStateProviderProps) {
  const [state, setState] = useState<AgentState>(initialAgentState);
  const [conversationManager, setConversationManager] =
    useState<ConversationManager | null>(null);

  const setCurrentView = useCallback((view: AgentView) => {
    setState((prev) => ({ ...prev, currentView: view }));
  }, []);

  const setConversationState = useCallback(
    (conversationState: ConversationState | null) => {
      setState((prev) => ({ ...prev, conversationState }));
    },
    []
  );

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback(
    (error: string | null) => {
      setState((prev) => ({ ...prev, error }));
      if (error && onError) {
        onError(error);
      }
    },
    [onError]
  );

  const setSessionId = useCallback((sessionId: string | null) => {
    setState((prev) => ({ ...prev, sessionId }));
  }, []);

  const startAgentConversation = useCallback(
    async (prompt: string) => {
      try {
        setLoading(true);
        setError(null);

        // Create a new conversation manager
        const manager = new ConversationManager();
        setConversationManager(manager);

        // Start the conversation
        const conversationState = await manager.startConversation(prompt);

        setConversationState(conversationState);
        setSessionId(conversationState.sessionId || null);

        // Determine the next view based on conversation state
        if (conversationState.isComplete) {
          setCurrentView('generating');
        } else {
          setCurrentView('conversation');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        setCurrentView('prompt');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setConversationState, setSessionId, setCurrentView]
  );

  const processUserResponse = useCallback(
    async (response: string, questionId: string) => {
      if (!conversationManager || !state.conversationState) {
        setError('No active conversation');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const conversationState = await conversationManager.processUserResponse(
          response,
          questionId
        );

        setConversationState(conversationState);

        // Check if conversation is complete
        if (conversationState.isComplete) {
          setCurrentView('generating');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      conversationManager,
      state.conversationState,
      setLoading,
      setError,
      setConversationState,
      setCurrentView,
    ]
  );

  const skipToFormGeneration = useCallback(async () => {
    if (!conversationManager || !state.conversationState) {
      setError('No active conversation');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const conversationState =
        await conversationManager.skipToFormGeneration();

      setConversationState(conversationState);
      setCurrentView('generating');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    conversationManager,
    state.conversationState,
    setLoading,
    setError,
    setConversationState,
    setCurrentView,
  ]);

  const generateFormFromConversation =
    useCallback(async (): Promise<FormGenerationResult | null> => {
      if (!state.conversationState) {
        setError('No active conversation');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const schemaJson = await import('@schema');
        const formGenerationAgent = new FormGenerationAgent(
          schemaJson.default as any,
          true
        );
        const result = await formGenerationAgent.generateFormFromConversation(
          state.conversationState
        );

        if (result.success && result.parsedJson) {
          if (onFormGenerated) {
            onFormGenerated(result);
          }
          return result;
        } else {
          setError(result.error || 'Failed to generate form');
          return null;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }, [state.conversationState, setLoading, setError, onFormGenerated]);

  const resetAgentState = useCallback(() => {
    setState(initialAgentState);
    setConversationManager(null);
  }, []);

  const addMessage = useCallback((message: ConversationMessage) => {
    setState((prev) => {
      if (!prev.conversationState) return prev;

      return {
        ...prev,
        conversationState: {
          ...prev.conversationState,
          messages: [...prev.conversationState.messages, message],
        },
      };
    });
  }, []);

  const updateQuestions = useCallback((questions: AgentQuestion[]) => {
    setState((prev) => {
      if (!prev.conversationState) return prev;

      return {
        ...prev,
        conversationState: {
          ...prev.conversationState,
          currentQuestions: questions,
        },
      };
    });
  }, []);

  const markConversationComplete = useCallback(() => {
    setState((prev) => {
      if (!prev.conversationState) return prev;

      return {
        ...prev,
        conversationState: {
          ...prev.conversationState,
          isComplete: true,
        },
      };
    });
  }, []);

  const contextValue: AgentStateContextType = {
    state,
    setCurrentView,
    setConversationState,
    setLoading,
    setError,
    setSessionId,
    startAgentConversation,
    processUserResponse,
    skipToFormGeneration,
    generateFormFromConversation,
    resetAgentState,
    addMessage,
    updateQuestions,
    markConversationComplete,
  };

  return (
    <AgentStateContext.Provider value={contextValue}>
      {children}
    </AgentStateContext.Provider>
  );
}

export function useAgentState(): AgentStateContextType {
  const context = useContext(AgentStateContext);
  if (context === undefined) {
    throw new Error('useAgentState must be used within an AgentStateProvider');
  }
  return context;
}
