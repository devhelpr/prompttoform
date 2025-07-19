import { useState } from 'react';
import { MainLayout } from './components/templates/MainLayout';
import { InitialStateLayout } from './components/templates/InitialStateLayout';
import { InitialPromptInput } from './components/molecules/InitialPromptInput';
import {
  AppStateProvider,
  useAppState,
} from './components/molecules/AppStateManager';
import { FormGenerator } from './components/molecules/FormGenerator';
import { Settings } from './components/molecules/Settings';
import { SessionHistory } from './components/molecules/SessionHistory';
import { netlifyTokenHandler } from './utils/netlify-token-handler';
import { loadFormJsonFromLocalStorage } from './utils/local-storage';
import { FormGenerationService } from './services/form-generation.service';
import { UISchema } from './types/ui-schema';
import schemaJson from '@schema';
import { formatJsonForDisplay } from './utils/json-utils';
import { FormSession } from './services/indexeddb';

netlifyTokenHandler();
let triggerDeploy = false;

if (
  window.location.search.includes('state') &&
  window.location.search.includes('access_token') &&
  window.location.search.includes('provider')
) {
  triggerDeploy = true;
  window.history.replaceState({}, '', '/');
}

const formJson = triggerDeploy ? loadFormJsonFromLocalStorage() : '';

// Initialize services
const uiSchema = schemaJson as unknown as UISchema;
const formGenerationService = new FormGenerationService(uiSchema, true);

function AppContent() {
  const {
    state,
    setPrompt,
    setGeneratedJson,
    setCurrentSessionId,
    setLoading,
    setError,
    transitionToEditor,
  } = useAppState();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);

  const handleGenerate = async (prompt: string) => {
    setPrompt(prompt);
    setLoading(true);
    setError(null);

    try {
      const result = await formGenerationService.generateForm(prompt);

      if (result.success && result.parsedJson) {
        const formattedJson = formatJsonForDisplay(result.parsedJson);
        setGeneratedJson(formattedJson, result.parsedJson);

        if (result.sessionId) {
          setCurrentSessionId(result.sessionId);
        }

        transitionToEditor();
      } else {
        setError(result.error || 'Failed to generate form');
        if (result.formattedJson) {
          setGeneratedJson(result.formattedJson);
        }
      }
    } catch (err) {
      setError(`An error occurred while generating the UI/Form.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async (session: FormSession) => {
    // TODO: Implement session loading logic
    console.log('Loading session:', session);
  };

  const handleStartNewSession = () => {
    // TODO: Implement new session logic
    console.log('Starting new session');
  };

  // If we have a formJson from URL params (triggerDeploy), show the editor view
  if (triggerDeploy && formJson) {
    return (
      <>
        <MainLayout
          onSettingsClick={() => setIsSettingsOpen(true)}
          onHistoryClick={() => setIsSessionHistoryOpen(true)}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <FormGenerator formJson={formJson} triggerDeploy={triggerDeploy} />
          </div>
        </MainLayout>

        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <SessionHistory
          isOpen={isSessionHistoryOpen}
          onClose={() => setIsSessionHistoryOpen(false)}
          onLoadSession={handleLoadSession}
          onStartNewSession={handleStartNewSession}
        />
      </>
    );
  }

  // Show initial state or editor based on current view
  if (state.currentView === 'initial') {
    return (
      <InitialStateLayout>
        <InitialPromptInput
          onGenerate={handleGenerate}
          isLoading={state.isLoading}
          error={state.error}
        />
      </InitialStateLayout>
    );
  }

  // Show editor view
  return (
    <>
      <MainLayout
        onSettingsClick={() => setIsSettingsOpen(true)}
        onHistoryClick={() => setIsSessionHistoryOpen(true)}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <FormGenerator formJson={state.generatedJson} triggerDeploy={false} />
        </div>
      </MainLayout>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <SessionHistory
        isOpen={isSessionHistoryOpen}
        onClose={() => setIsSessionHistoryOpen(false)}
        onLoadSession={handleLoadSession}
        onStartNewSession={handleStartNewSession}
      />
    </>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
