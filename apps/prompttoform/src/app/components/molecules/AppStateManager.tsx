import { createContext, useContext, useState, ReactNode } from 'react';
import { UIJson } from '../../types/form-generator.types';

export type ViewMode = 'form' | 'flow' | 'mermaid-flow' | 'json';
export type AppView = 'initial' | 'editor';

interface AppState {
  currentView: AppView;
  prompt: string;
  generatedJson: string;
  parsedJson: UIJson | null;
  currentSessionId: string | null;
  sidebarCollapsed: boolean;
  activeTab: ViewMode;
  isLoading: boolean;
  error: string | null;
}

interface AppStateContextType {
  state: AppState;
  setPrompt: (prompt: string) => void;
  setGeneratedJson: (json: string, parsed?: UIJson | null) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: ViewMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  transitionToEditor: () => void;
  transitionToInitial: () => void;
  resetState: () => void;
}

const initialState: AppState = {
  currentView: 'initial',
  prompt: '',
  generatedJson: '',
  parsedJson: null,
  currentSessionId: null,
  sidebarCollapsed: false,
  activeTab: 'form',
  isLoading: false,
  error: null,
};

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(initialState);

  const setPrompt = (prompt: string) => {
    setState((prev) => ({ ...prev, prompt }));
  };

  const setGeneratedJson = (json: string, parsed?: UIJson | null) => {
    setState((prev) => ({
      ...prev,
      generatedJson: json,
      parsedJson: parsed || prev.parsedJson,
    }));
  };

  const setCurrentSessionId = (sessionId: string | null) => {
    setState((prev) => ({ ...prev, currentSessionId: sessionId }));
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setState((prev) => ({ ...prev, sidebarCollapsed: collapsed }));
  };

  const setActiveTab = (tab: ViewMode) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const transitionToEditor = () => {
    setState((prev) => ({
      ...prev,
      currentView: 'editor',
      sidebarCollapsed: window.innerWidth < 768, // Auto-collapse on mobile
    }));
  };

  const transitionToInitial = () => {
    setState((prev) => ({
      ...prev,
      currentView: 'initial',
      prompt: '',
      generatedJson: '',
      parsedJson: null,
      currentSessionId: null,
      error: null,
    }));
  };

  const resetState = () => {
    setState(initialState);
  };

  const contextValue: AppStateContextType = {
    state,
    setPrompt,
    setGeneratedJson,
    setCurrentSessionId,
    setSidebarCollapsed,
    setActiveTab,
    setLoading,
    setError,
    transitionToEditor,
    transitionToInitial,
    resetState,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
