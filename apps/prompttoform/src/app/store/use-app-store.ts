import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UIJson } from '../types/form-generator.types';
import {
  FormSynchronizationService,
  SyncSource,
  SyncStatus,
} from '../services/form-synchronization.service';

// Types
export type ViewMode = 'form' | 'flow' | 'mermaid-flow' | 'json';
export type AppView = 'initial' | 'editor';

// Singleton service outside state (as recommended in research)
const formSyncService = new FormSynchronizationService();

interface AppStore {
  // UI State Slice
  currentView: AppView;
  sidebarCollapsed: boolean;
  activeTab: ViewMode;
  isLoading: boolean;
  error: string | null;

  // Form State Slice
  prompt: string;
  generatedJson: string;
  parsedJson: UIJson | null;
  currentLanguage: string;

  // Session State Slice
  currentSessionId: string | null;

  // Sync State Slice
  lastModifiedBy: SyncSource;
  formVersion: number;
  pendingChanges: boolean;
  syncStatus: SyncStatus;

  // UI Actions
  setCurrentView: (view: AppView) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: ViewMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Form Actions
  setPrompt: (prompt: string) => void;
  setGeneratedJson: (json: string, parsed?: UIJson | null) => void;
  setCurrentLanguage: (language: string) => void;

  // Session Actions
  setCurrentSessionId: (sessionId: string | null) => void;

  // Complex Actions
  updateFormFromFlow: (nodes: any[], edges: any[]) => void;
  updateFormFromJson: (jsonString: string) => void;
  markFormModified: (source: SyncSource) => void;
  resolveFormConflicts: () => void;
  transitionToEditor: () => void;
  transitionToInitial: () => void;
  resetState: () => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentView: 'initial',
        sidebarCollapsed: false,
        activeTab: 'form',
        isLoading: false,
        error: null,
        prompt: '',
        generatedJson: '',
        parsedJson: null,
        currentLanguage: 'en',
        currentSessionId: null,
        lastModifiedBy: 'prompt',
        formVersion: 0,
        pendingChanges: false,
        syncStatus: 'synced',

        // Simple UI Actions
        setCurrentView: (view) => set({ currentView: view }),
        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // Form Actions
        setPrompt: (prompt) => set({ prompt }),
        setGeneratedJson: (json, parsed) => {
          const newParsedJson = parsed || get().parsedJson;
          let newCurrentLanguage = get().currentLanguage;

          if (newParsedJson?.defaultLanguage) {
            newCurrentLanguage = newParsedJson.defaultLanguage;
          } else if (
            newParsedJson?.supportedLanguages &&
            newParsedJson.supportedLanguages.length > 0
          ) {
            newCurrentLanguage = newParsedJson.supportedLanguages[0];
          }

          set({
            generatedJson: json,
            parsedJson: newParsedJson,
            currentLanguage: newCurrentLanguage,
          });
        },
        setCurrentLanguage: (language) => set({ currentLanguage: language }),

        // Session Actions
        setCurrentSessionId: (sessionId) =>
          set({ currentSessionId: sessionId }),

        // Complex Actions
        updateFormFromFlow: (nodes, edges) => {
          const { parsedJson } = get();
          if (!parsedJson) return;

          try {
            const updatedForm = formSyncService.updateFromFlow(
              nodes,
              edges,
              parsedJson
            );
            const jsonString = JSON.stringify(updatedForm, null, 2);
            const conflicts = formSyncService.getActiveConflicts();

            set({
              generatedJson: jsonString,
              parsedJson: updatedForm,
              lastModifiedBy: 'flow',
              formVersion: get().formVersion + 1,
              pendingChanges: false,
              syncStatus: conflicts.length > 0 ? 'conflict' : 'synced',
              error: null,
            });
          } catch (error) {
            console.error('Error updating form from flow:', error);
            set({
              syncStatus: 'error',
              error: 'Failed to synchronize form changes from flow editor',
            });
          }
        },

        updateFormFromJson: (jsonString) => {
          try {
            const updatedForm = formSyncService.updateFromJson(jsonString);

            if (updatedForm) {
              const conflicts = formSyncService.getActiveConflicts();
              set({
                generatedJson: jsonString,
                parsedJson: updatedForm,
                lastModifiedBy: 'json',
                formVersion: get().formVersion + 1,
                pendingChanges: false,
                syncStatus: conflicts.length > 0 ? 'conflict' : 'synced',
                error: null,
              });
            } else {
              set({
                syncStatus: 'error',
                error: 'Invalid JSON format',
              });
            }
          } catch (error) {
            console.error('Error updating form from JSON:', error);
            set({
              syncStatus: 'error',
              error: 'Failed to parse JSON',
            });
          }
        },

        markFormModified: (source) => {
          set({
            lastModifiedBy: source,
            pendingChanges: true,
            syncStatus: 'pending',
          });
        },

        resolveFormConflicts: () => {
          const conflicts = formSyncService.getActiveConflicts();

          if (conflicts.length > 0) {
            // For now, just clear the conflicts and mark as synced
            // In a real implementation, this would show a conflict resolution dialog
            conflicts.forEach((conflict) => {
              formSyncService.clearConflict(conflict.id);
            });
          }

          set({
            syncStatus: 'synced',
            pendingChanges: false,
          });
        },

        transitionToEditor: () => {
          set({
            currentView: 'editor',
            sidebarCollapsed: window.innerWidth < 768,
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        transitionToInitial: () => {
          set({
            currentView: 'initial',
            prompt: '',
            generatedJson: '',
            parsedJson: null,
            currentSessionId: null,
            error: null,
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        resetState: () => {
          // Reset to initial state
          set({
            currentView: 'initial',
            sidebarCollapsed: false,
            activeTab: 'form',
            isLoading: false,
            error: null,
            prompt: '',
            generatedJson: '',
            parsedJson: null,
            currentLanguage: 'en',
            currentSessionId: null,
            lastModifiedBy: 'prompt',
            formVersion: 0,
            pendingChanges: false,
            syncStatus: 'synced',
          });
        },
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          // Only persist certain fields
          currentLanguage: state.currentLanguage,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);

// Convenience hooks for common selections (as recommended in research)
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useFormData = () =>
  useAppStore((state) => ({
    prompt: state.prompt,
    generatedJson: state.generatedJson,
    parsedJson: state.parsedJson,
  }));
export const useUIState = () =>
  useAppStore((state) => ({
    currentView: state.currentView,
    sidebarCollapsed: state.sidebarCollapsed,
    isLoading: state.isLoading,
    error: state.error,
  }));

// Export the service for components that need direct access
export { formSyncService };
