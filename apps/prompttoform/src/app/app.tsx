import { useState } from 'react';
import { MainLayout } from './components/templates/MainLayout';
import { InitialStateLayout } from './components/templates/InitialStateLayout';
import { FormEditorLayout } from './components/templates/FormEditorLayout';
import { InitialPromptInput } from './components/molecules/InitialPromptInput';
import { FormEditorSidebar } from './components/molecules/FormEditorSidebar';
import { FormPreviewPanel } from './components/molecules/FormPreviewPanel';
import {
  AppStateProvider,
  useAppState,
} from './components/molecules/AppStateManager';
import { Settings } from './components/molecules/Settings';
import { SessionHistory } from './components/molecules/SessionHistory';
import { netlifyTokenHandler } from './utils/netlify-token-handler';
import { loadFormJsonFromLocalStorage } from './utils/local-storage';
import { FormGenerationService } from './services/form-generation.service';
import { UISchema } from './types/ui-schema';
import schemaJson from '@schema';
import { formatJsonForDisplay, parseJsonSafely } from './utils/json-utils';
import { FormSession } from './services/indexeddb';
import { evaluateAndRerunIfNeeded } from './services/prompt-eval';
import { deployWithNetlify } from './utils/netlify-deploy';
import { createFormZip, downloadZip } from './utils/zip-utils';
import { blobToBase64 } from './utils/blob-to-base64';
import { getSystemPrompt } from './prompt-library/system-prompt';
import { getCurrentAPIConfig } from './services/llm-api';

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
    setSidebarCollapsed,
    setActiveTab,
    transitionToEditor,
  } = useAppState();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');

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

  const handleEvaluate = async () => {
    if (!updatePrompt.trim() || !state.generatedJson) {
      setError('Please enter an update prompt and ensure form is generated');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const systemMessage = getSystemPrompt(uiSchema);
      const apiConfig = getCurrentAPIConfig();

      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        setError(
          `No API key set for ${apiConfig.name}. Please configure it in the Settings.`
        );
        setIsEvaluating(false);
        return;
      }

      const result = await evaluateAndRerunIfNeeded(
        state.prompt,
        systemMessage,
        state.generatedJson,
        apiConfig
      );

      if (result.wasRerun && result.improvedOutput) {
        try {
          const parsedOutput = parseJsonSafely(result.improvedOutput);
          if (parsedOutput) {
            const formattedJson = formatJsonForDisplay(parsedOutput);
            setGeneratedJson(formattedJson, parsedOutput);
          }
        } catch (parseError) {
          console.error('Error parsing improved output:', parseError);
        }
      }
    } catch (err) {
      setError('An error occurred during evaluation.');
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDeploy = async () => {
    if (!state.generatedJson) {
      setError('No form generated to deploy');
      return;
    }

    setIsDeploying(true);
    try {
      const zipBlob = await createFormZip(state.generatedJson);
      const base64 = await blobToBase64(zipBlob);

      deployWithNetlify(base64, (url) => {
        setSiteUrl(url);
        setIsDeploying(false);
      });
    } catch (err) {
      setError('Failed to deploy to Netlify');
      console.error(err);
      setIsDeploying(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(state.generatedJson);
  };

  const handleDownload = () => {
    const blob = new Blob([state.generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!state.generatedJson) {
      setError('No form generated to download');
      return;
    }

    setIsZipDownloading(true);
    try {
      const zip = await createFormZip(state.generatedJson);
      downloadZip(zip, 'react-form.zip');
    } catch (err) {
      setError('Failed to create zip file');
      console.error(err);
    } finally {
      setIsZipDownloading(false);
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
          <div className="h-screen">
            <FormEditorLayout
              sidebar={
                <FormEditorSidebar
                  originalPrompt=""
                  updatePrompt={updatePrompt}
                  onUpdatePromptChange={setUpdatePrompt}
                  onDeploy={handleDeploy}
                  onEvaluate={handleEvaluate}
                  isDeploying={isDeploying}
                  isEvaluating={isEvaluating}
                  currentSessionId={state.currentSessionId}
                />
              }
              mainContent={
                <FormPreviewPanel
                  parsedJson={state.parsedJson}
                  activeTab={state.activeTab}
                  onTabChange={setActiveTab}
                  onJsonChange={setGeneratedJson}
                  generatedJson={state.generatedJson}
                  onCopyToClipboard={handleCopyToClipboard}
                  onDownload={handleDownload}
                  onDownloadZip={handleDownloadZip}
                  isZipDownloading={isZipDownloading}
                  siteUrl={siteUrl}
                />
              }
              sidebarCollapsed={state.sidebarCollapsed}
              onToggleSidebar={() =>
                setSidebarCollapsed(!state.sidebarCollapsed)
              }
            />
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
        <div className="h-screen">
          <FormEditorLayout
            sidebar={
              <FormEditorSidebar
                originalPrompt={state.prompt}
                updatePrompt={updatePrompt}
                onUpdatePromptChange={setUpdatePrompt}
                onDeploy={handleDeploy}
                onEvaluate={handleEvaluate}
                isDeploying={isDeploying}
                isEvaluating={isEvaluating}
                currentSessionId={state.currentSessionId}
              />
            }
            mainContent={
              <FormPreviewPanel
                parsedJson={state.parsedJson}
                activeTab={state.activeTab}
                onTabChange={setActiveTab}
                onJsonChange={setGeneratedJson}
                generatedJson={state.generatedJson}
                onCopyToClipboard={handleCopyToClipboard}
                onDownload={handleDownload}
                onDownloadZip={handleDownloadZip}
                isZipDownloading={isZipDownloading}
                siteUrl={siteUrl}
              />
            }
            sidebarCollapsed={state.sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!state.sidebarCollapsed)}
          />
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
