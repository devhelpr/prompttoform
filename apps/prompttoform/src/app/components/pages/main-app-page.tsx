import React, { useState, Suspense, useEffect, useCallback } from 'react';
import { MainLayout } from '../templates/MainLayout';
import { InitialStateLayout } from '../templates/InitialStateLayout';
import { FormEditorLayout } from '../templates/FormEditorLayout';
// InitialPromptInput removed - not used in this component
import { AgentPromptInput } from '../molecules/AgentPromptInput';
import { AgentStateProvider } from '../molecules/AgentStateManager';
import { FormEditorSidebar } from '../molecules/FormEditorSidebar';
import { FormPreviewPanel } from '../molecules/FormPreviewPanel';
import { ErrorBoundary } from '../molecules/ErrorBoundary';
import { Settings } from '../molecules/Settings';
import { SessionHistory } from '../molecules/SessionHistory';
import { ImportJsonModal } from '../molecules/ImportJsonModal';
import { DeploymentOverlay } from '../molecules/DeploymentOverlay';
import { useAppStore } from '../../store/use-app-store';
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
import {
  saveSessionIdToLocalStorage,
  saveFormJsonToLocalStorage,
  loadFormJsonFromLocalStorage,
  loadSessionIdFromLocalStorage,
} from '../../utils/local-storage';

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
  onNavigateToFormFlow: (formDefinition: unknown) => void;
  updatedFormDefinition?: unknown;
}

export function MainAppPage({
  onNavigateToFormFlow,
  updatedFormDefinition,
}: MainAppPageProps) {
  const {
    currentView,
    isLoading,
    error,
    parsedJson,
    prompt,
    generatedJson,
    currentSessionId,
    activeTab,
    sidebarCollapsed,
    currentLanguage,
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
  } = useAppStore();

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

  // Define handleDeploy with useCallback to prevent dependency issues
  const handleDeploy = useCallback(async () => {
    if (!generatedJson) {
      setError('No form generated to deploy');
      return;
    }

    console.log('🚀 Starting deployment process...');
    console.log('📦 Current session ID:', currentSessionId);
    console.log('📄 Form JSON length:', generatedJson.length);

    setIsDeploying(true);
    setDeploymentOverlay({
      isVisible: true,
      message: 'Preparing deployment...',
      isSuccess: false,
      siteUrl: '',
    });

    try {
      // Store current session ID and form JSON for post-authentication restoration
      if (currentSessionId) {
        console.log(
          '💾 Storing session data for post-authentication restoration...'
        );
        saveSessionIdToLocalStorage(currentSessionId);
        saveFormJsonToLocalStorage(generatedJson);
        console.log('✅ Session data stored in localStorage');
      } else {
        console.log(
          '⚠️ No session ID available, skipping localStorage storage'
        );
      }

      const zipBlob = await createFormZip(generatedJson);
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
          if (currentSessionId) {
            // Extract site ID from URL
            const siteId = url.split('/').pop()?.split('.')[0];
            if (siteId) {
              console.log('🔗 Updating session with Netlify site ID:', siteId);
              FormSessionService.updateSession(
                currentSessionId,
                generatedJson,
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
  }, [
    generatedJson,
    currentSessionId,
    setError,
    setSiteUrl,
    setIsDeploying,
    setDeploymentOverlay,
  ]);

  // Handle updated form definition from flow page
  useEffect(() => {
    console.log(
      'MainAppPage: useEffect triggered with updatedFormDefinition:',
      !!updatedFormDefinition
    );
    if (updatedFormDefinition) {
      console.log('MainAppPage: Processing updated form definition');
      console.log(
        'MainAppPage: Updated form title:',
        (updatedFormDefinition as any)?.app?.title
      );
      console.log(
        'MainAppPage: First page title:',
        (updatedFormDefinition as any)?.app?.pages?.[0]?.title
      );

      // Update the form data with the changes from the flow editor
      const formattedJson = formatJsonForDisplay(updatedFormDefinition as any);
      console.log('MainAppPage: Calling setGeneratedJson with formatted JSON');
      setGeneratedJson(formattedJson, updatedFormDefinition as any);

      // Clear the updated form definition to prevent re-processing
      // Note: This is a simplified approach - in a real app you might want to use a more sophisticated state management
    } else {
      console.log('MainAppPage: No updatedFormDefinition to process');
    }
  }, [updatedFormDefinition, setGeneratedJson]);

  // Handle session restoration after Netlify authentication
  useEffect(() => {
    // Check URL parameters for triggerDeploy flag
    const urlParams = new URLSearchParams(window.location.search);
    const triggerDeploy = urlParams.get('triggerDeploy') === 'true';

    console.log('🔍 MainAppPage useEffect - triggerDeploy:', triggerDeploy);
    console.log('🔍 MainAppPage useEffect - currentView:', currentView);

    if (triggerDeploy) {
      console.log('🔄 TriggerDeploy: Detected post-authentication redirect');

      // Get stored data from localStorage
      const formJson = loadFormJsonFromLocalStorage();
      const storedSessionId = loadSessionIdFromLocalStorage();

      console.log('📦 Stored session ID:', storedSessionId);
      console.log(
        '📄 Form JSON from localStorage:',
        formJson ? 'Present' : 'Missing'
      );

      if (formJson && storedSessionId) {
        // Restore session data and trigger deployment
        handlePostAuthenticationRestoration(storedSessionId, formJson);
      } else {
        console.log(
          '⚠️ Missing stored data for post-authentication restoration'
        );
      }
    }
  }, [currentView, handlePostAuthenticationRestoration]);

  const handlePostAuthenticationRestoration = useCallback(
    async (sessionId: string, formJson: string) => {
      try {
        console.log('🔄 Loading session data from IndexedDB...');

        // Load session data from IndexedDB
        const sessionData = await FormSessionService.getSessionWithLatestJson(
          sessionId
        );

        if (sessionData) {
          console.log('✅ Session data loaded from IndexedDB');
          console.log('📝 Session prompt:', sessionData.session.prompt);
          console.log('📄 Session JSON length:', sessionData.latestJson.length);

          // Parse the JSON to validate it
          const parsedJson = parseJsonSafely(sessionData.latestJson);
          if (parsedJson) {
            console.log('✅ JSON parsed successfully');

            // Set the restored data directly in the component state
            setCurrentSessionId(sessionId);
            setPrompt(sessionData.session.prompt);
            setGeneratedJson(sessionData.latestJson, parsedJson);

            // Transition to editor view
            transitionToEditor();

            console.log('🔄 Called transitionToEditor()');
            console.log('✅ Session restoration completed');

            // Trigger deployment after a short delay to ensure state is set
            setTimeout(() => {
              console.log(
                '🚀 Auto-triggering deployment after session restoration...'
              );
              handleDeploy();
            }, 500);
          } else {
            console.log('⚠️ JSON parsing failed, using localStorage data');
            // Fallback to localStorage data
            const fallbackParsedJson = parseJsonSafely(formJson);
            if (fallbackParsedJson) {
              setCurrentSessionId(sessionId);
              setPrompt('');
              setGeneratedJson(formJson, fallbackParsedJson);
              transitionToEditor();

              setTimeout(() => {
                console.log(
                  '🚀 Auto-triggering deployment after fallback restoration...'
                );
                handleDeploy();
              }, 500);
            }
          }
        } else {
          console.log(
            '❌ Session not found in IndexedDB, using localStorage data'
          );
          // Fallback to localStorage data
          const parsedJson = parseJsonSafely(formJson);
          if (parsedJson) {
            setCurrentSessionId(sessionId);
            setPrompt('');
            setGeneratedJson(formJson, parsedJson);
            transitionToEditor();

            setTimeout(() => {
              console.log(
                '🚀 Auto-triggering deployment after localStorage fallback...'
              );
              handleDeploy();
            }, 500);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load session data from IndexedDB:', error);
        console.log('🔄 Falling back to localStorage data...');

        // Fallback to localStorage data
        const parsedJson = parseJsonSafely(formJson);
        if (parsedJson) {
          setCurrentSessionId(sessionId);
          setPrompt('');
          setGeneratedJson(formJson, parsedJson);
          transitionToEditor();

          setTimeout(() => {
            console.log(
              '🚀 Auto-triggering deployment after error fallback...'
            );
            handleDeploy();
          }, 500);
        }
      }
    },
    [
      setCurrentSessionId,
      setPrompt,
      setGeneratedJson,
      transitionToEditor,
      handleDeploy,
    ]
  );

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
    if (!updatePrompt.trim() || !generatedJson) {
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
        prompt,
        systemMessage,
        generatedJson,
        apiConfig
      );

      if (result.wasRerun && result.improvedOutput) {
        try {
          const parsedOutput = parseJsonSafely(result.improvedOutput);
          if (parsedOutput) {
            const formattedJson = formatJsonForDisplay(parsedOutput);
            setGeneratedJson(formattedJson, parsedOutput);

            // Store update in session
            if (currentSessionId) {
              await FormSessionService.storeUpdate(
                currentSessionId,
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
    if (!updatePrompt.trim() || !generatedJson) {
      setError('Please enter an update prompt and ensure form is generated');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Use the form generation service's updateForm method which uses JSON-patch
      const formGenerationService = new FormGenerationService(uiSchema, true);
      const result = await formGenerationService.updateForm(
        generatedJson,
        updatePrompt,
        currentSessionId || undefined
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

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedJson);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedJson], { type: 'application/json' });
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
    if (!generatedJson) {
      setError('No form generated to download');
      return;
    }

    setIsZipDownloading(true);
    try {
      const zip = await createFormZip(generatedJson);
      downloadZip(zip, `react-form.zip?v=${Date.now()}`);
    } catch (err) {
      setError('Failed to create zip file');
      console.error(err);
    } finally {
      setIsZipDownloading(false);
    }
  };

  const handleExportSchema = () => {
    if (!generatedJson || !parsedJson) {
      setError('No form generated to export schema');
      return;
    }

    try {
      const schema = generateJsonSchema(parsedJson);
      const filename = `${parsedJson.app.title
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
    if (parsedJson) {
      onNavigateToFormFlow(parsedJson);
    } else {
      setError('No form data available to view in form flow');
    }
  };

  // Debug logging for view determination
  console.log('🔍 MainAppPage render - currentView:', currentView);
  console.log(
    '🔍 MainAppPage render - generatedJson length:',
    generatedJson?.length || 0
  );

  // Show initial state or editor based on current view
  if (currentView === 'initial') {
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
              isLoading={isLoading}
              error={error}
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
        showFormFlowButton={!!parsedJson}
      >
        <div className="grid grid-rows-[1fr] h-full min-h-0">
          <FormEditorLayout
            sidebar={
              <FormEditorSidebar
                originalPrompt={prompt}
                updatePrompt={updatePrompt}
                onUpdatePromptChange={setUpdatePrompt}
                onDeploy={handleDeploy}
                onEvaluate={handleEvaluate}
                onUpdate={handleUpdate}
                isDeploying={isDeploying}
                isEvaluating={isEvaluating}
                isUpdating={isUpdating}
                currentSessionId={currentSessionId}
              />
            }
            mainContent={
              <Suspense fallback={<LoadingSpinner />}>
                <FormPreviewPanel
                  parsedJson={parsedJson}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onJsonChange={setGeneratedJson}
                  generatedJson={generatedJson}
                  onCopyToClipboard={handleCopyToClipboard}
                  onDownload={handleDownload}
                  onDownloadZip={handleDownloadZip}
                  onExportSchema={handleExportSchema}
                  isZipDownloading={isZipDownloading}
                  siteUrl={siteUrl}
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                />
              </Suspense>
            }
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
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
