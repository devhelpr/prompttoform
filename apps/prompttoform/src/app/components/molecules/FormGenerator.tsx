import { useState, useEffect, useLayoutEffect } from 'react';
import Ajv2020 from 'ajv/dist/2020';
import { UISchema } from '../../types/ui-schema';

import { Settings } from './Settings';
import { evaluateAndRerunIfNeeded } from '../../services/prompt-eval';
import { getCurrentAPIConfig } from '../../services/llm-api';
import { getSystemPrompt } from '../../prompt-library/system-prompt';
import schemaJson from '@schema';
import { Alert } from './Alert';
import FormFlow from './FormFlow';
import FormFlowMermaid from './FormFlowMermaid';
import { exampleForm } from './example-form-definitions/example-form';
import { multiStepForm } from './example-form-definitions/multi-step-form';

import { FormRenderer } from '@devhelpr/react-forms';
import { createFormZip, downloadZip } from '../../utils/zip-utils';
import { saveFormJsonToLocalStorage } from '../../utils/local-storage';
import { deployWithNetlify } from '../../utils/netlify-deploy';
import { blobToBase64 } from '../../utils/blob-to-base64';
import { FormSessionService, FormSession } from '../../services/indexeddb';
import { SessionHistory } from './SessionHistory';
import {
  ViewMode,
  EvaluationResult,
  UIJson,
} from '../../types/form-generator.types';
import {
  formatJsonForDisplay,
  getRawJsonForStorage,
  parseJsonSafely,
} from '../../utils/json-utils';
import { FormGenerationService } from '../../services/form-generation.service';

import { PIIValidationService } from '../../services/pii-validation.service';

// Cast schema to unknown first, then to UISchema
const uiSchema = schemaJson as unknown as UISchema;

// Skip validation for now to avoid schema issues
const skipValidation = true;

// Initialize services
const formGenerationService = new FormGenerationService(
  uiSchema,
  skipValidation
);
const piiValidationService = new PIIValidationService();

export function FormGenerator({
  formJson,
  triggerDeploy,
}: {
  formJson: string;
  triggerDeploy: boolean;
}) {
  const [prompt, setPrompt] = useState('');
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState(formJson || '');
  const [parsedJson, setParsedJson] = useState<UIJson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showApiKeyHint, setShowApiKeyHint] = useState(false);
  const [piiErrors, setPiiErrors] = useState<{
    prompt?: string;
    updatePrompt?: string;
  }>({});
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);

  useLayoutEffect(() => {
    // Check for API key on mount
    const apiConfig = getCurrentAPIConfig();
    if (!apiConfig.apiKey && !apiConfig.systemKey) {
      setShowApiKeyHint(true);
    }
    if (triggerDeploy && generatedJson) {
      setIsLoading(true);
      handleDeployToNetlify();
    }
  }, []);

  // Check for API key when settings dialog closes
  useEffect(() => {
    if (!isSettingsOpen) {
      const apiConfig = getCurrentAPIConfig();
      setShowApiKeyHint(!apiConfig.apiKey && !apiConfig.systemKey);
    }
  }, [isSettingsOpen]);

  const validatePII = (text: string, field: 'prompt' | 'updatePrompt') => {
    const piiResult = piiValidationService.validatePII(text);
    if (piiResult.hasPII) {
      setPiiErrors((prev) => ({ ...prev, [field]: piiResult.warningMessage }));
      return true; // Always return true since we're not blocking
    }
    setPiiErrors((prev) => ({ ...prev, [field]: undefined }));
    return true;
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    setError(null);
    setEvaluation(null);
    validatePII(newValue, 'prompt');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const setAndPersistGeneratedJson = (json: string, parsed?: UIJson | null) => {
    setGeneratedJson(json);
    if (parsed) setParsedJson(parsed);
    saveFormJsonToLocalStorage(json);
  };

  const loadExampleForm = () => {
    const formattedJson = JSON.stringify(exampleForm, null, 2);
    setAndPersistGeneratedJson(formattedJson, exampleForm as UIJson);
    setViewMode('form');
    setEvaluation(null);
  };

  const loadMultiStepExample = () => {
    const formattedJson = JSON.stringify(multiStepForm, null, 2);
    setAndPersistGeneratedJson(formattedJson, multiStepForm as UIJson);
    setViewMode('form');
    setEvaluation(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    setParsedJson(null);

    try {
      // Check if API key is set
      const apiConfig = getCurrentAPIConfig();
      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        setError(
          `No API key set for ${apiConfig.name}. Please configure it in the Settings.`
        );
        setIsLoading(false);
        return;
      }

      // Use the form generation service
      const result = await formGenerationService.generateForm(prompt);

      if (result.success && result.parsedJson) {
        // Store parsed response
        setParsedJson(result.parsedJson);

        // Format and store string version with proper newlines
        const formattedJson = formatJsonForDisplay(result.parsedJson);
        setAndPersistGeneratedJson(formattedJson, result.parsedJson);

        // Set the session ID from the service (it already created the session)
        if (result.sessionId) {
          setCurrentSessionId(result.sessionId);
          console.log('Session created with ID:', result.sessionId);

          // Refresh session history if it's open
          if (isSessionHistoryOpen) {
            // The session history will reload when the dialog opens
          }
        }
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
      setIsLoading(false);
    }
  };

  const handleEvaluateAndRerun = async () => {
    if (!generatedJson) {
      setError('Generate content first before evaluating');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      // Create a system message - same as used for generation
      const systemMessage = getSystemPrompt(uiSchema);

      const apiConfig = getCurrentAPIConfig();

      // Check if API key is set
      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        setError(
          `No API key set for ${apiConfig.name}. Please configure it in the Settings.`
        );
        setIsEvaluating(false);
        return;
      }

      // Evaluate the output and rerun if needed
      const result = await evaluateAndRerunIfNeeded(
        prompt,
        systemMessage,
        generatedJson,
        apiConfig
      );

      setEvaluation(result.evaluation);

      // If the prompt was rerun and improved output was generated
      if (result.wasRerun && result.improvedOutput) {
        try {
          // Parse the improved output string into a proper UIJson object
          const parsedOutput = parseJsonSafely(result.improvedOutput) as UIJson;

          if (parsedOutput) {
            // Format the improved output with proper newlines
            const formattedJson = formatJsonForDisplay(parsedOutput);

            setAndPersistGeneratedJson(formattedJson, parsedOutput);

            // Update the session with the new JSON
            if (currentSessionId) {
              await FormSessionService.updateSession(
                currentSessionId,
                getRawJsonForStorage(parsedOutput)
              );

              // Refresh session history if it's open
              if (isSessionHistoryOpen) {
                // The session history will reload when the dialog opens
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing improved output:', parseError);
          // Keep original output if parsing fails
        }
      }
    } catch (err) {
      setError('An error occurred during evaluation.');
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (viewMode === 'json') {
      navigator.clipboard.writeText(generatedJson);
    }
  };

  const handleDownload = () => {
    let blob: Blob;
    let filename = '';

    if (viewMode === 'json' && generatedJson) {
      blob = new Blob([generatedJson], { type: 'application/json' });
      filename = 'ui-schema.json';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadZip = async () => {
    if (!generatedJson) {
      setError('No form generated to download');
      return;
    }

    setIsZipDownloading(true);
    setError(null);

    try {
      const zipBlob = await createFormZip(generatedJson);
      downloadZip(zipBlob, 'react-form.zip');
    } catch (error) {
      console.error('Error downloading zip:', error);
      setError('Failed to create zip file. Please try again.');
    } finally {
      setIsZipDownloading(false);
    }
  };

  const handleJsonChange = (newJson: string) => {
    try {
      // First try to parse the JSON to validate it
      const parsed = parseJsonSafely(newJson) as UIJson;

      if (parsed) {
        // If parsing succeeds, format it nicely with actual newlines
        const formattedJson = formatJsonForDisplay(parsed);

        setAndPersistGeneratedJson(formattedJson, parsed);
        setJsonError(null);
      } else {
        setJsonError('Invalid JSON format');
        setGeneratedJson(newJson); // Keep the invalid JSON in the textarea
      }
    } catch (error) {
      setJsonError('Invalid JSON format');
      setGeneratedJson(newJson); // Keep the invalid JSON in the textarea
      console.error('JSON parsing error:', error);
    }
  };

  const validateAndUpdatePreview = () => {
    if (!skipValidation) {
      try {
        const ajv = new Ajv2020({
          allErrors: true,
          strict: false,
          validateSchema: false,
        });

        const validate = ajv.compile(uiSchema);
        const valid = validate(parsedJson);

        if (!valid && validate.errors) {
          setError(`Validation failed: ${ajv.errorsText(validate.errors)}`);
          return;
        }
      } catch (validationErr) {
        console.error('Schema validation error:', validationErr);
        setError('Schema validation error occurred');
        return;
      }
    }

    setError(null);
    setViewMode('form');
  };

  const handleUpdateForm = async () => {
    if (!updatePrompt.trim()) {
      setUpdateError('Please enter an update prompt');
      return;
    }

    if (!generatedJson) {
      setUpdateError('Please generate a form first before updating');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Use the form generation service for updates
      // Pass the raw JSON (not formatted) to avoid JSON parsing issues
      let rawJson: string;

      console.log('Update form - parsedJson exists:', !!parsedJson);
      console.log('Update form - generatedJson length:', generatedJson?.length);

      if (parsedJson) {
        rawJson = getRawJsonForStorage(parsedJson);
        console.log(
          'Using parsedJson for update, rawJson length:',
          rawJson.length
        );
      } else if (generatedJson) {
        // If we don't have parsedJson but have generatedJson, try to parse it first
        console.log('Attempting to parse generatedJson for update');
        const parsed = parseJsonSafely(generatedJson);
        if (parsed) {
          rawJson = getRawJsonForStorage(parsed);
          console.log(
            'Successfully parsed generatedJson, rawJson length:',
            rawJson.length
          );
        } else {
          console.error('Failed to parse generatedJson for update');
          setUpdateError('Invalid JSON format in generated form');
          return;
        }
      } else {
        setUpdateError('No form data available for update');
        return;
      }
      const result = await formGenerationService.updateForm(
        rawJson,
        updatePrompt,
        currentSessionId || undefined
      );

      if (result.success && result.updatedJson) {
        // Parse the updated JSON
        const updatedForm = parseJsonSafely(result.updatedJson) as UIJson;
        if (updatedForm) {
          setAndPersistGeneratedJson(result.updatedJson, updatedForm);

          // The update is already stored in IndexedDB by the formGenerationService
          // No need to store it again here
          console.log('Update completed successfully');

          // Refresh session history if it's open
          if (isSessionHistoryOpen) {
            // The session history will reload when the dialog opens
          }
        }
      } else {
        setUpdateError(result.error || 'Failed to update form');
      }
    } catch (error) {
      console.error('Error updating form:', error);
      setUpdateError(
        error instanceof Error ? error.message : 'Failed to update form'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setUpdatePrompt(newValue);
    setError(null);
    setEvaluation(null);
    validatePII(newValue, 'updatePrompt');
  };

  async function handleDeployToNetlify(): Promise<void> {
    setIsDeploying(true);
    const zipBlob = await createFormZip(generatedJson);
    console.log('zipBlob', zipBlob);
    const base64 = await blobToBase64(zipBlob);
    console.log('base64', base64);
    deployWithNetlify(base64, (siteUrl) => {
      setSiteUrl(siteUrl);
      setIsLoading(false);
      setIsDeploying(false);

      // Store Netlify site ID in the current session
      if (currentSessionId && siteUrl) {
        const siteId = siteUrl.split('/').pop() || siteUrl; // Extract site ID from URL
        // Store the raw JSON (not the formatted one)
        const rawJson = parsedJson
          ? getRawJsonForStorage(parsedJson)
          : generatedJson;
        FormSessionService.updateSession(currentSessionId, rawJson, siteId)
          .then(() => {
            console.log(
              'Netlify site ID stored for session:',
              currentSessionId
            );

            // Refresh session history if it's open
            if (isSessionHistoryOpen) {
              // The session history will reload when the dialog opens
            }
          })
          .catch((error: Error) =>
            console.error('Failed to store Netlify site ID:', error)
          );
      }
    });
  }

  const handleLoadSession = async (session: FormSession) => {
    try {
      console.log('Loading session:', session.id);

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
      const parsedJson = parseJsonSafely(latestJson) as UIJson;
      if (parsedJson) {
        console.log('Successfully parsed JSON:', parsedJson);
        setParsedJson(parsedJson);

        // Format the JSON for display (with proper newlines)
        const formattedJson = formatJsonForDisplay(parsedJson);
        setGeneratedJson(formattedJson);

        setViewMode('form');
        setIsSessionHistoryOpen(false);
        setError(null);
        setEvaluation(null);

        console.log('Session loaded successfully with latest updates');
      } else {
        throw new Error('Failed to parse JSON');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load session: Invalid JSON format');
    }
  };

  const handleStartNewSession = () => {
    setPrompt('');
    setGeneratedJson('');
    setParsedJson(null);
    setCurrentSessionId(null);
    setViewMode('form');
    setIsSessionHistoryOpen(false);
    setError(null);
    setEvaluation(null);
    setUpdatePrompt('');
    setUpdateError(null);
    setSiteUrl('');

    // Refresh session history if it's open
    if (isSessionHistoryOpen) {
      // The session history will reload when the dialog opens
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900">Create a Form</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsSessionHistoryOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Show History
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Settings
          </button>
        </div>
      </div>

      {showApiKeyHint && (
        <Alert>
          No API key configured. Please go to Settings to configure your
          preferred LLM API key to start generating forms.
        </Alert>
      )}

      <SessionHistory
        isOpen={isSessionHistoryOpen}
        onClose={() => setIsSessionHistoryOpen(false)}
        onLoadSession={handleLoadSession}
        onStartNewSession={handleStartNewSession}
      />

      <div>
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-zinc-700 mb-2"
        >
          Describe your form (e.g., 'Contact form with name, email, and
          message')
        </label>

        <textarea
          id="prompt"
          rows={5}
          className={`w-full rounded-lg border ${
            piiErrors.prompt ? 'border-amber-300' : 'border-zinc-200'
          } shadow-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 p-4 mt-2 text-base`}
          placeholder="A registration form with name, email, password, and a submit button"
          value={prompt}
          onChange={handlePromptChange}
        />
        {piiErrors.prompt && (
          <p className="mt-2 text-sm text-amber-600">{piiErrors.prompt}</p>
        )}
        <div className="mt-4 flex justify-end md:space-x-2 flex-col md:flex-row gap-2 md:gap-0 ">
          <button
            type="button"
            onClick={loadExampleForm}
            disabled={isLoading || isEvaluating}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 text-center md:text-left"
          >
            Load Sample Form
          </button>
          <button
            type="button"
            onClick={loadMultiStepExample}
            disabled={isLoading || isEvaluating}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 text-center md:text-left"
          >
            Load Multi-Step Form
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || isEvaluating}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 text-center md:text-left relative overflow-hidden`}
          >
            <span
              className={`relative z-10 ${
                isLoading ? 'loading-gradient-text-dark' : ''
              }`}
            >
              {isLoading ? 'Generating...' : 'Create Form'}
            </span>
          </button>

          {generatedJson && (
            <button
              type="button"
              onClick={handleEvaluateAndRerun}
              disabled={isEvaluating || isLoading}
              className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 text-center md:text-left relative overflow-hidden`}
            >
              <span
                className={`relative z-10 ${
                  isEvaluating ? 'loading-gradient-text-light' : ''
                }`}
              >
                {isEvaluating ? 'Evaluating...' : 'Evaluate & Improve'}
              </span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {evaluation && !isEvaluating && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3 w-full">
              <h3 className="text-sm font-medium text-blue-800">
                Evaluation Results
              </h3>
              <div className="mt-2 text-sm text-blue-700 space-y-2">
                <div className="flex justify-between">
                  <span>Matches Prompt:</span>
                  <span>{evaluation.matchesPrompt ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Matches System Prompt:</span>
                  <span>{evaluation.matchesSystemPrompt ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span>{evaluation.score}/10</span>
                </div>
                {evaluation.missingElements.length > 0 && (
                  <div>
                    <span className="font-medium">Missing Elements:</span>
                    <ul className="list-disc pl-4 mt-1">
                      {evaluation.missingElements.map(
                        (element: string, index: number) => (
                          <li key={index}>{element}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
                {evaluation.reasoning && (
                  <div>
                    <span className="font-medium">Reasoning:</span>
                    <p className="mt-1">{evaluation.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {generatedJson && !isLoading && (
        <div
          className={`space-y-4 ${
            isEvaluating ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-zinc-900">
                Generated UI/Form
              </h3>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('form')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    viewMode === 'form'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  Form Preview
                </button>
                {/* <button
                  type="button"
                  onClick={() => handleViewModeChange("flow")}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === "flow"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } border-t border-b border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  Flow
                </button> */}
                <button
                  type="button"
                  onClick={() => handleViewModeChange('mermaid-flow')}
                  className={`px-4 py-2 text-sm font-medium  ${
                    viewMode === 'mermaid-flow'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  Visual Flow
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('json')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md  ${
                    viewMode === 'json'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  JSON
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'json' ? (
            <div className="space-y-4">
              <textarea
                value={generatedJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                spellCheck={false}
              />
              {jsonError && (
                <div className="text-red-500 text-sm">{jsonError}</div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={validateAndUpdatePreview}
                  disabled={!!jsonError}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Preview
                </button>
              </div>
            </div>
          ) : viewMode === 'form' ? (
            parsedJson &&
            parsedJson.app && (
              <div className="bg-white p-4 rounded-lg overflow-auto max-h-[800px] border border-zinc-300">
                <FormRenderer formJson={parsedJson} />
              </div>
            )
          ) : viewMode === 'flow' ? (
            parsedJson &&
            parsedJson.app && (
              <div className="bg-white p-4 rounded-lg overflow-auto max-h-[800px] border border-zinc-300">
                <FormFlow formJson={parsedJson} />
              </div>
            )
          ) : (
            parsedJson &&
            parsedJson.app && (
              <div className="bg-white p-4 rounded-lg overflow-auto max-h-[800px] border border-zinc-300">
                <FormFlowMermaid formJson={parsedJson} />
              </div>
            )
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 group relative"
              title="Copy to Clipboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                />
              </svg>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Copy to Clipboard
              </span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 group relative"
              title="Download"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Download
              </span>
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isZipDownloading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 group relative disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download React Form Zip"
            >
              {isZipDownloading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              )}
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isZipDownloading
                  ? 'Creating Zip...'
                  : 'Download React Form Zip'}
              </span>
            </button>
            <button
              onClick={handleDeployToNetlify}
              disabled={isDeploying}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 group relative disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deploy to Netlify
            </button>
            {siteUrl && (
              <div className="flex flex-row items-center">
                <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                  {siteUrl}
                </a>
              </div>
            )}
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-zinc-900 mb-4">
              Update Form
            </h3>
            <div className="space-y-4">
              <textarea
                value={updatePrompt}
                onChange={handleUpdatePromptChange}
                className={`w-full rounded-lg border ${
                  piiErrors.updatePrompt
                    ? 'border-amber-300'
                    : 'border-zinc-200'
                } shadow-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 p-4 text-base`}
                placeholder="Describe the changes you want to make to the form..."
                rows={4}
              />
              {piiErrors.updatePrompt && (
                <p className="mt-2 text-sm text-amber-600">
                  {piiErrors.updatePrompt}
                </p>
              )}
              {updateError && (
                <div className="text-red-500 text-sm">{updateError}</div>
              )}
              <button
                onClick={handleUpdateForm}
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Form'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
