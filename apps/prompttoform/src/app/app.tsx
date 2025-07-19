import { useState, Suspense } from 'react';
import { MainLayout } from './components/templates/MainLayout';
import { InitialStateLayout } from './components/templates/InitialStateLayout';
import { FormEditorLayout } from './components/templates/FormEditorLayout';
import { InitialPromptInput } from './components/molecules/InitialPromptInput';
import { FormEditorSidebar } from './components/molecules/FormEditorSidebar';
import { FormPreviewPanel } from './components/molecules/FormPreviewPanel';
import { ErrorBoundary } from './components/molecules/ErrorBoundary';

import { PerformanceMonitor } from './components/molecules/PerformanceMonitor';
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
import { FormSession, FormSessionService } from './services/indexeddb';
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

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}

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
  const [isUpdating, setIsUpdating] = useState(false);
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

        // Create session in IndexedDB
        if (result.sessionId) {
          setCurrentSessionId(result.sessionId);
        } else {
          // Create new session if none exists
          const sessionId = await FormSessionService.createSession(
            prompt,
            formattedJson
          );
          setCurrentSessionId(sessionId);
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

            // Store update in session
            if (state.currentSessionId) {
              await FormSessionService.storeUpdate(
                state.currentSessionId,
                updatePrompt,
                formattedJson
              );
            }
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

  const handleUpdate = async () => {
    if (!updatePrompt.trim() || !state.generatedJson) {
      setError('Please enter an update prompt and ensure form is generated');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // For now, we'll use the same evaluation logic as handleEvaluate
      // In the future, this could be a simpler update without full evaluation
      const systemMessage = getSystemPrompt(uiSchema);
      const apiConfig = getCurrentAPIConfig();

      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        setError(
          `No API key set for ${apiConfig.name}. Please configure it in the Settings.`
        );
        setIsUpdating(false);
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

            // Store update in session
            if (state.currentSessionId) {
              await FormSessionService.storeUpdate(
                state.currentSessionId,
                updatePrompt,
                formattedJson
              );
            }
          }
        } catch (parseError) {
          console.error('Error parsing improved output:', parseError);
        }
      }
    } catch (err) {
      setError('An error occurred during update.');
      console.error(err);
    } finally {
      setIsUpdating(false);
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

        // Update session with Netlify site ID
        if (state.currentSessionId) {
          // Extract site ID from URL
          const siteId = url.split('/').pop()?.split('.')[0];
          if (siteId) {
            FormSessionService.updateSession(
              state.currentSessionId,
              state.generatedJson,
              siteId
            );
          }
        }

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
    try {
      setPrompt(session.prompt);
      setGeneratedJson(session.generatedJson);
      setCurrentSessionId(session.id);

      // Parse the JSON to update the parsed state
      const parsedJson = parseJsonSafely(session.generatedJson);
      if (parsedJson) {
        setGeneratedJson(session.generatedJson, parsedJson);
      }

      transitionToEditor();
      setIsSessionHistoryOpen(false);
    } catch (err) {
      setError('Failed to load session');
      console.error(err);
    }
  };

  const handleStartNewSession = () => {
    // Reset to initial state
    setPrompt('');
    setGeneratedJson('');
    setCurrentSessionId(null);
    setError(null);
    setIsSessionHistoryOpen(false);
  };

  // If we have a formJson from URL params (triggerDeploy), show the editor view
  if (triggerDeploy && formJson) {
    return (
      <ErrorBoundary>
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
                  onUpdate={handleUpdate}
                  isDeploying={isDeploying}
                  isEvaluating={isEvaluating}
                  isUpdating={isUpdating}
                  currentSessionId={state.currentSessionId}
                />
              }
              mainContent={
                <Suspense fallback={<LoadingSpinner />}>
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
                </Suspense>
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

        <PerformanceMonitor />
      </ErrorBoundary>
    );
  }

  // Show initial state or editor based on current view
  if (state.currentView === 'initial') {
    return (
      <ErrorBoundary>
        <InitialStateLayout>
          <InitialPromptInput
            onGenerate={handleGenerate}
            isLoading={state.isLoading}
            error={state.error}
          />
        </InitialStateLayout>
        <PerformanceMonitor />
      </ErrorBoundary>
    );
  }

  // Show editor view
  return (
    <ErrorBoundary>
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
                onUpdate={handleUpdate}
                isDeploying={isDeploying}
                isEvaluating={isEvaluating}
                isUpdating={isUpdating}
                currentSessionId={state.currentSessionId}
              />
            }
            mainContent={
              <Suspense fallback={<LoadingSpinner />}>
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
              </Suspense>
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

      <PerformanceMonitor />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </ErrorBoundary>
  );
}

export default App;
