import { createContext, useContext, useState, ReactNode } from 'react';
import { UIJson } from '../../types/form-generator.types';
import {
  FormSynchronizationService,
  SyncSource,
  SyncStatus,
} from '../../services/form-synchronization.service';

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
  // Multi-language support
  currentLanguage: string;
  // Form synchronization
  formSynchronizationService: FormSynchronizationService;
  lastModifiedBy: SyncSource;
  formVersion: number;
  pendingChanges: boolean;
  syncStatus: SyncStatus;
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
  // Multi-language support
  setCurrentLanguage: (language: string) => void;
  // Form synchronization
  updateFormFromFlow: (nodes: any[], edges: any[]) => void;
  updateFormFromJson: (jsonString: string) => void;
  markFormModified: (source: SyncSource) => void;
  resolveFormConflicts: () => void;
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
  currentLanguage: 'en',
  // Form synchronization
  formSynchronizationService: new FormSynchronizationService(),
  lastModifiedBy: 'prompt',
  formVersion: 0,
  pendingChanges: false,
  syncStatus: 'synced',
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
    setState((prev) => {
      const newParsedJson = parsed || prev.parsedJson;

      // Auto-set current language for multi-language forms
      let newCurrentLanguage = prev.currentLanguage;
      if (newParsedJson?.defaultLanguage) {
        newCurrentLanguage = newParsedJson.defaultLanguage;
      } else if (
        newParsedJson?.supportedLanguages &&
        newParsedJson.supportedLanguages.length > 0
      ) {
        newCurrentLanguage = newParsedJson.supportedLanguages[0];
      }

      return {
        ...prev,
        generatedJson: json,
        parsedJson: newParsedJson,
        currentLanguage: newCurrentLanguage,
      };
    });
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

    // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetState = () => {
    setState(initialState);
  };

  const setCurrentLanguage = (language: string) => {
    setState((prev) => ({ ...prev, currentLanguage: language }));
  };

  // Form synchronization methods
  const updateFormFromFlow = (nodes: any[], edges: any[]) => {
    setState((prev) => {
      if (!prev.parsedJson) return prev;

      try {
        const updatedForm = prev.formSynchronizationService.updateFromFlow(
          nodes,
          edges,
          prev.parsedJson
        );

        const jsonString = JSON.stringify(updatedForm, null, 2);

        return {
          ...prev,
          generatedJson: jsonString,
          parsedJson: updatedForm,
          lastModifiedBy: 'flow',
          formVersion: prev.formVersion + 1,
          pendingChanges: false,
          syncStatus: 'synced',
          error: null, // Clear any previous errors
        };
      } catch (error) {
        console.error('Error updating form from flow:', error);
        return {
          ...prev,
          syncStatus: 'error',
          error: 'Failed to synchronize form changes from flow editor',
        };
      }
    });
  };

  const updateFormFromJson = (jsonString: string) => {
    setState((prev) => {
      try {
        const updatedForm =
          prev.formSynchronizationService.updateFromJson(jsonString);

        if (updatedForm) {
          return {
            ...prev,
            generatedJson: jsonString,
            parsedJson: updatedForm,
            lastModifiedBy: 'json',
            formVersion: prev.formVersion + 1,
            pendingChanges: false,
            syncStatus: 'synced',
            error: null, // Clear any previous errors
          };
        } else {
          return {
            ...prev,
            syncStatus: 'error',
            error: 'Invalid JSON format',
          };
        }
      } catch (error) {
        console.error('Error updating form from JSON:', error);
        return {
          ...prev,
          syncStatus: 'error',
          error: 'Failed to parse JSON',
        };
      }
    });
  };

  const markFormModified = (source: SyncSource) => {
    setState((prev) => ({
      ...prev,
      lastModifiedBy: source,
      pendingChanges: true,
      syncStatus: 'pending',
    }));
  };

  const resolveFormConflicts = () => {
    setState((prev) => {
      const conflicts = prev.formSynchronizationService.getActiveConflicts();

      if (conflicts.length > 0) {
        // For now, just clear the conflicts and mark as synced
        // In a real implementation, this would show a conflict resolution dialog
        conflicts.forEach((conflict) => {
          prev.formSynchronizationService.clearConflict(conflict.id);
        });
      }

      return {
        ...prev,
        syncStatus: 'synced',
        pendingChanges: false,
      };
    });
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
    setCurrentLanguage,
    // Form synchronization
    updateFormFromFlow,
    updateFormFromJson,
    markFormModified,
    resolveFormConflicts,
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
