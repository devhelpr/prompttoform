import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { InitialStateLayout } from '../templates/InitialStateLayout';
import { FormEditorLayout } from '../templates/FormEditorLayout';
import { InitialPromptInput } from '../molecules/InitialPromptInput';
import { AgentPromptInput } from '../molecules/AgentPromptInput';
import { AgentStateProvider } from '../molecules/AgentStateManager';
import { FormEditorSidebar } from '../molecules/FormEditorSidebar';
import { FormPreviewPanel } from '../molecules/FormPreviewPanel';
import { ErrorBoundary } from '../molecules/ErrorBoundary';
import { Settings } from '../molecules/Settings';
import { SessionHistory } from '../molecules/SessionHistory';
import { ImportJsonModal } from '../molecules/ImportJsonModal';
import { DeploymentOverlay } from '../molecules/DeploymentOverlay';
import { useAppState } from '../molecules/AppStateManager';
import { FormGenerationService } from '../../services/form-generation.service';
import { UISchema } from '../../types/ui-schema';
import schemaJson from '@schema';
import { formatJsonForDisplay, parseJsonSafely } from '../../utils/json-utils';
import { FormSession, FormSessionService } from '../../services/indexeddb';
import { evaluateAndRerunIfNeeded } from '../../services/prompt-eval';
import { deployWithNetlify } from '../../utils/netlify-deploy';
import { createFormZip, downloadZip } from '../../utils/zip-utils';
import { blobToBase64 } from '../../utils/blob-to-base64';
import {
  generateJsonSchema,
  downloadJsonSchema,
} from '../../utils/schema-generator';
import { getSystemPrompt } from '../../prompt-library/system-prompt';
import { getCurrentAPIConfig } from '../../services/llm-api';

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

interface MainAppPageProps {
  onNavigateToFormFlow: (formDefinition: any) => void;
  updatedFormDefinition?: any;
}

export function MainAppPage({
  onNavigateToFormFlow,
  updatedFormDefinition,
}: MainAppPageProps) {
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
    transitionToInitial,
    setCurrentLanguage,
  } = useAppState();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);
  const [isImportJsonOpen, setIsImportJsonOpen] = useState(false);
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [deploymentOverlay, setDeploymentOverlay] = useState({
    isVisible: false,
    message: '',
    isSuccess: false,
    siteUrl: '',
  });

  // Handle updated form definition from flow page
  useEffect(() => {
    console.log(
      'MainAppPage: useEffect triggered with updatedFormDefinition:',
      !!updatedFormDefinition
    );
    if (updatedFormDefinition) {
      console.log('MainAppPage: Processing updated form definition');
      // Update the form data with the changes from the flow editor
      const formattedJson = formatJsonForDisplay(updatedFormDefinition);
      setGeneratedJson(formattedJson, updatedFormDefinition);

      // Clear the updated form definition to prevent re-processing
      // Note: This is a simplified approach - in a real app you might want to use a more sophisticated state management
    } else {
      console.log('MainAppPage: No updated form definition to process');
    }
  }, [updatedFormDefinition]);

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
                formattedJson,
                'evaluate'
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
      // Use the form generation service's updateForm method which uses JSON-patch
      const formGenerationService = new FormGenerationService(uiSchema, true);
      const result = await formGenerationService.updateForm(
        state.generatedJson,
        updatePrompt,
        state.currentSessionId || undefined
      );

      if (result.success && result.updatedJson) {
        // Parse the updated JSON to update the parsed state
        const parsedJson = parseJsonSafely(result.updatedJson);
        if (parsedJson) {
          setGeneratedJson(result.updatedJson, parsedJson);
        } else {
          setGeneratedJson(result.updatedJson);
        }

        // Clear the update prompt after successful update
        setUpdatePrompt('');
      } else {
        setError(result.error || 'Failed to update form');
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

    console.log('🚀 Starting deployment process...');
    console.log('📦 Current session ID:', state.currentSessionId);
    console.log('📄 Form JSON length:', state.generatedJson.length);

    setIsDeploying(true);
    setDeploymentOverlay({
      isVisible: true,
      message: 'Preparing deployment...',
      isSuccess: false,
      siteUrl: '',
    });

    try {
      // Store current session ID and form JSON for post-authentication restoration
      if (state.currentSessionId) {
        console.log(
          '💾 Storing session data for post-authentication restoration...'
        );
        // Note: These functions need to be imported from local-storage utils
        // saveSessionIdToLocalStorage(state.currentSessionId);
        // saveFormJsonToLocalStorage(state.generatedJson);
        console.log('✅ Session data stored in localStorage');
      } else {
        console.log(
          '⚠️ No session ID available, skipping localStorage storage'
        );
      }

      const zipBlob = await createFormZip(state.generatedJson);
      const base64 = await blobToBase64(zipBlob);

      setDeploymentOverlay((prev) => ({
        ...prev,
        message: 'Deploying to Netlify...',
      }));

      deployWithNetlify(
        base64,
        (url) => {
          console.log('🎉 Deployment successful! URL:', url);
          setSiteUrl(url);

          // Update session with Netlify site ID
          if (state.currentSessionId) {
            // Extract site ID from URL
            const siteId = url.split('/').pop()?.split('.')[0];
            if (siteId) {
              console.log('🔗 Updating session with Netlify site ID:', siteId);
              FormSessionService.updateSession(
                state.currentSessionId,
                state.generatedJson,
                siteId
              );
            }
          }

          // Clear stored data after successful deployment
          console.log(
            '🧹 Clearing localStorage data after successful deployment'
          );
          // clearFormJsonFromLocalStorage();
          // clearSessionIdFromLocalStorage();

          setIsDeploying(false);
          setDeploymentOverlay({
            isVisible: true,
            message: 'Your form has been successfully deployed to Netlify!',
            isSuccess: true,
            siteUrl: url,
          });
        },
        () => {
          // Success callback - handled in the URL callback
        },
        (errorMessage) => {
          console.error('❌ Deployment failed:', errorMessage);
          setError('Failed to deploy to Netlify');
          setIsDeploying(false);
          setDeploymentOverlay({
            isVisible: true,
            message: `Deployment failed: ${errorMessage}`,
            isSuccess: false,
            siteUrl: '',
          });
        }
      );
    } catch (err) {
      console.error('❌ Deployment failed:', err);
      setError('Failed to deploy to Netlify');
      setIsDeploying(false);
      setDeploymentOverlay({
        isVisible: true,
        message: 'Failed to prepare deployment',
        isSuccess: false,
        siteUrl: '',
      });
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
      downloadZip(zip, `react-form.zip?v=${Date.now()}`);
    } catch (err) {
      setError('Failed to create zip file');
      console.error(err);
    } finally {
      setIsZipDownloading(false);
    }
  };

  const handleExportSchema = () => {
    if (!state.generatedJson || !state.parsedJson) {
      setError('No form generated to export schema');
      return;
    }

    try {
      const schema = generateJsonSchema(state.parsedJson);
      const filename = `${state.parsedJson.app.title
        .toLowerCase()
        .replace(/\s+/g, '-')}-schema.json`;
      downloadJsonSchema(schema, filename);
    } catch (error) {
      console.error('Error generating JSON schema:', error);
      setError('Failed to generate JSON schema');
    }
  };

  const handleLoadSession = async (session: FormSession) => {
    try {
      console.log('Loading session:', session.id);

      // Set the original prompt from the session
      setPrompt(session.prompt);
      setCurrentSessionId(session.id);

      // Get the session with the most recent JSON (including updates)
      const sessionWithLatestJson =
        await FormSessionService.getSessionWithLatestJson(session.id);
      if (!sessionWithLatestJson) {
        throw new Error('Session not found');
      }

      const { latestJson } = sessionWithLatestJson;
      console.log('Latest JSON length:', latestJson.length);

      // Parse the latest JSON - it should be valid JSON string
      const parsedJson = parseJsonSafely(latestJson);
      if (parsedJson) {
        console.log('Successfully parsed JSON:', parsedJson);
        setGeneratedJson(latestJson, parsedJson);
      } else {
        console.log('⚠️ JSON parsing failed, setting string version only');
        setGeneratedJson(latestJson);
      }

      transitionToEditor();
      setIsSessionHistoryOpen(false);
      console.log('Session loaded successfully with latest updates');
    } catch (err) {
      setError('Failed to load session');
      console.error('Error loading session:', err);
    }
  };

  const handleStartNewSession = () => {
    // Reset to initial state using the proper transition function
    transitionToInitial();
    setUpdatePrompt('');
    setIsSessionHistoryOpen(false);
  };

  const handleImportJson = async (json: string, prompt?: string) => {
    try {
      // Parse the JSON to validate it
      const parsedJson = parseJsonSafely(json);
      if (!parsedJson) {
        setError('Invalid JSON format');
        return;
      }

      // Format the JSON for display
      const formattedJson = formatJsonForDisplay(parsedJson);

      // Set the form data
      setPrompt(prompt || 'Imported form');
      setGeneratedJson(formattedJson, parsedJson);

      // Create a new session for the imported form
      const sessionId = await FormSessionService.createSession(
        prompt || 'Imported form',
        formattedJson
      );
      setCurrentSessionId(sessionId);

      // Transition to editor view
      transitionToEditor();
      setError(null);
    } catch (err) {
      setError('Failed to import JSON form');
      console.error(err);
    }
  };

  const handleNavigateToFormFlow = () => {
    if (state.parsedJson) {
      onNavigateToFormFlow(state.parsedJson);
    } else {
      setError('No form data available to view in form flow');
    }
  };

  // Show initial state or editor based on current view
  if (state.currentView === 'initial') {
    return (
      <ErrorBoundary>
        <InitialStateLayout
          onSettingsClick={() => setIsSettingsOpen(true)}
          onHistoryClick={() => setIsSessionHistoryOpen(true)}
          onImportJsonClick={() => setIsImportJsonOpen(true)}
        >
          <AgentStateProvider
            onFormGenerated={(result) => {
              if (result.success && result.parsedJson) {
                const formattedJson = formatJsonForDisplay(result.parsedJson);
                setGeneratedJson(formattedJson, result.parsedJson);

                if (result.sessionId) {
                  setCurrentSessionId(result.sessionId);
                }

                transitionToEditor();
              } else {
                setError(result.error || 'Failed to generate form');
              }
            }}
            onError={setError}
          >
            <AgentPromptInput
              onGenerate={handleGenerate}
              onLoadJson={handleImportJson}
              onFormGenerated={(result) => {
                if (result.success && result.parsedJson) {
                  const formattedJson = formatJsonForDisplay(result.parsedJson);
                  setGeneratedJson(formattedJson, result.parsedJson);

                  if (result.sessionId) {
                    setCurrentSessionId(result.sessionId);
                  }

                  transitionToEditor();
                } else {
                  setError(result.error || 'Failed to generate form');
                }
              }}
              onError={setError}
              isLoading={state.isLoading}
              error={state.error}
              enableAgent={true}
            />
          </AgentStateProvider>
        </InitialStateLayout>

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

        <ImportJsonModal
          isOpen={isImportJsonOpen}
          onClose={() => setIsImportJsonOpen(false)}
          onImport={handleImportJson}
        />

        <DeploymentOverlay
          isVisible={deploymentOverlay.isVisible}
          message={deploymentOverlay.message}
          isSuccess={deploymentOverlay.isSuccess}
          siteUrl={deploymentOverlay.siteUrl}
          onClose={() =>
            setDeploymentOverlay({ ...deploymentOverlay, isVisible: false })
          }
        />
      </ErrorBoundary>
    );
  }

  // Show editor view
  return (
    <ErrorBoundary>
      <MainLayout
        onSettingsClick={() => setIsSettingsOpen(true)}
        onHistoryClick={() => setIsSessionHistoryOpen(true)}
        onImportJsonClick={() => setIsImportJsonOpen(true)}
        onFormFlowClick={handleNavigateToFormFlow}
        showFormFlowButton={!!state.parsedJson}
      >
        <div className="grid grid-rows-[1fr] h-full min-h-0">
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
                  onExportSchema={handleExportSchema}
                  isZipDownloading={isZipDownloading}
                  siteUrl={siteUrl}
                  currentLanguage={state.currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                />
              </Suspense>
            }
            sidebarCollapsed={state.sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!state.sidebarCollapsed)}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onHistoryClick={() => setIsSessionHistoryOpen(true)}
            onImportJsonClick={() => setIsImportJsonOpen(true)}
            showNavbar={false}
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

      <ImportJsonModal
        isOpen={isImportJsonOpen}
        onClose={() => setIsImportJsonOpen(false)}
        onImport={handleImportJson}
      />

      <DeploymentOverlay
        isVisible={deploymentOverlay.isVisible}
        message={deploymentOverlay.message}
        isSuccess={deploymentOverlay.isSuccess}
        siteUrl={deploymentOverlay.siteUrl}
        onClose={() =>
          setDeploymentOverlay({ ...deploymentOverlay, isVisible: false })
        }
      />
    </ErrorBoundary>
  );
}
