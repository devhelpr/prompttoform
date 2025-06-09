import { useState, useEffect } from "react";
import Ajv2020 from "ajv/dist/2020";
import { UISchema } from "../../types/ui-schema";
import { generateUIFromPrompt, updateFormWithPatch } from "../../services/llm";
import { Settings } from "./Settings";
import { evaluateAndRerunIfNeeded } from "../../services/prompt-eval";
import { getCurrentAPIConfig } from "../../services/llm-api";
import FormRenderer from "./FormRenderer";
import { getSystemPrompt } from "../../prompt-library/system-prompt";
import schemaJson from "../../../schema.json";
import { Alert } from "./Alert";
import FormFlow from "./FormFlow";
import FormFlowMermaid from "./FormFlowMermaid";
import { FieldType } from "../../types/field-types";
import { exampleForm } from "./example-form-definitions/example-form";
import { multiStepForm } from "./example-form-definitions/multi-step-form";

// Define the evaluation result type
interface EvaluationResult {
  matchesPrompt: boolean;
  matchesSystemPrompt: boolean;
  missingElements: string[];
  suggestedHints: string[];
  score: number;
  reasoning: string;
}

// Define view modes
type ViewMode = "json" | "form" | "flow" | "mermaid-flow";

// Cast schema to unknown first, then to UISchema
const uiSchema = schemaJson as unknown as UISchema;

// Skip validation for now to avoid schema issues
const skipValidation = true;

// Define interface for visibility conditions
interface VisibilityCondition {
  field: string;
  operator:
    | "=="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "equals"
    | "notEquals"
    | "greaterThan"
    | "lessThan";
  value: string | number | boolean;
}

// Define interface for component properties
interface ComponentProps {
  type: FieldType;
  id: string;
  label?: string;
  props?: Record<string, unknown>;
  children?: ComponentProps[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
    minDate?: string;
    maxDate?: string;
    min?: number;
    max?: number;
  };
  visibilityConditions?: VisibilityCondition[];
  eventHandlers?: Record<string, unknown>;
  arrayItems?: Array<{
    id: string;
    components: ComponentProps[];
  }>;
}

// Define interface for JSON types
interface UIJson {
  app: {
    title: string;
    pages: Array<{
      id: string;
      title: string;
      route: string;
      layout?: string;
      components: ComponentProps[];
      isEndPage?: boolean;
    }>;
    dataSources?: Array<{
      type: string;
      [key: string]: unknown;
    }>;
  };
}

export function FormGenerator() {
  const [prompt, setPrompt] = useState("");
  const [updatePrompt, setUpdatePrompt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState("");
  const [parsedJson, setParsedJson] = useState<UIJson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showApiKeyHint, setShowApiKeyHint] = useState(false);

  useEffect(() => {
    // Check for API key on mount
    const apiConfig = getCurrentAPIConfig();
    if (!apiConfig.apiKey && !apiConfig.systemKey) {
      setShowApiKeyHint(true);
    }
  }, []);

  // Check for API key when settings dialog closes
  useEffect(() => {
    if (!isSettingsOpen) {
      const apiConfig = getCurrentAPIConfig();
      setShowApiKeyHint(!apiConfig.apiKey && !apiConfig.systemKey);
    }
  }, [isSettingsOpen]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setError(null);
    setEvaluation(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const loadExampleForm = () => {
    setGeneratedJson(JSON.stringify(exampleForm, null, 2));
    setParsedJson(exampleForm as UIJson);

    // If example form is loaded, switch to form view automatically
    setViewMode("form");
  };

  const loadMultiStepExample = () => {
    setGeneratedJson(JSON.stringify(multiStepForm, null, 2));
    setParsedJson(multiStepForm as UIJson);

    // If example form is loaded, switch to form view automatically
    setViewMode("form");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
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

      // Call the UI generation API
      const response = await generateUIFromPrompt(prompt, uiSchema);

      // Try to parse the response as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response) as UIJson;
      } catch {
        setError("Failed to parse the generated JSON. Please try again.");
        setGeneratedJson(response);
        setIsLoading(false);
        return;
      }

      // Skip validation for now to avoid schema issues
      if (!skipValidation) {
        try {
          // Initialize Ajv only when validation is needed
          const ajv = new Ajv2020({
            allErrors: true,
            strict: false,
            validateSchema: false,
          });

          // Compile schema
          const validate = ajv.compile(uiSchema);
          const valid = validate(parsedResponse);
          if (!valid && validate.errors) {
            console.warn("UI validation errors:", validate.errors);
            setError(`Validation failed: ${ajv.errorsText(validate.errors)}`);
          }
        } catch (validationErr) {
          console.error("Schema validation error:", validationErr);
          // Continue despite validation errors
        }
      }

      // Store parsed response
      setParsedJson(parsedResponse);

      // Format and store string version with proper newlines
      const formattedJson = JSON.stringify(parsedResponse, null, 2)
        .replace(/\\n/g, "\n")
        .replace(/\\\\/g, "\\");
      setGeneratedJson(formattedJson);
    } catch (err) {
      setError(`An error occurred while generating the UI/Form.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateAndRerun = async () => {
    if (!generatedJson) {
      setError("Generate content first before evaluating");
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
          const parsedOutput = JSON.parse(result.improvedOutput) as UIJson;

          // Format the improved output with proper newlines
          const formattedJson = JSON.stringify(parsedOutput, null, 2)
            .replace(/\\n/g, "\n")
            .replace(/\\\\/g, "\\");

          setGeneratedJson(formattedJson);
          setParsedJson(parsedOutput);
        } catch (parseError) {
          console.error("Error parsing improved output:", parseError);
          // Keep original output if parsing fails
        }
      }
    } catch (err) {
      setError("An error occurred during evaluation.");
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (viewMode === "json") {
      navigator.clipboard.writeText(generatedJson);
    }
  };

  const handleDownload = () => {
    let blob: Blob;
    let filename = "";

    if (viewMode === "json" && generatedJson) {
      blob = new Blob([generatedJson], { type: "application/json" });
      filename = "ui-schema.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleJsonChange = (newJson: string) => {
    try {
      // First try to parse the JSON to validate it
      const parsed = JSON.parse(newJson) as UIJson;

      // If parsing succeeds, format it nicely with actual newlines
      const formattedJson = JSON.stringify(parsed, null, 2)
        .replace(/\\n/g, "\n") // Replace escaped newlines with actual newlines
        .replace(/\\\\/g, "\\"); // Replace double backslashes with single backslashes

      setGeneratedJson(formattedJson);
      setParsedJson(parsed);
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format");
      setGeneratedJson(newJson); // Keep the invalid JSON in the textarea
      console.error("JSON parsing error:", error);
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
        console.error("Schema validation error:", validationErr);
        setError("Schema validation error occurred");
        return;
      }
    }

    setError(null);
    setViewMode("form");
  };

  const handleUpdateForm = async () => {
    if (!updatePrompt.trim() || !generatedJson || !parsedJson) {
      setUpdateError(
        "Please enter an update prompt and make sure a form is generated"
      );
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Before sending to updateFormWithPatch, convert newlines back to escaped form
      const jsonForUpdate = generatedJson.replace(/\n/g, "\\n");
      const patch = await updateFormWithPatch(jsonForUpdate, updatePrompt);

      // First parse the patch operations
      let patchOperations = JSON.parse(patch);
      if (!Array.isArray(patchOperations)) {
        patchOperations = [patchOperations];
      }

      // Parse the current form, ensuring we're working with a clean object
      const updatedForm = { ...parsedJson } as UIJson;

      // Apply the patch operations to the current form
      for (const operation of patchOperations) {
        const { op, path, value } = operation;
        const pathParts = path.split("/").filter(Boolean);
        let current: unknown = updatedForm;

        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (part.match(/^\d+$/)) {
            if (Array.isArray(current)) {
              current = current[parseInt(part)];
            }
          } else {
            if (typeof current === "object" && current !== null) {
              current = (current as Record<string, unknown>)[part];
            }
          }
        }

        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart.match(/^\d+$/)) {
          const index = parseInt(lastPart);
          if (op === "add") {
            if (Array.isArray(current)) {
              current.splice(index, 0, value);
            }
          } else if (op === "remove") {
            if (Array.isArray(current)) {
              current.splice(index, 1);
            }
          } else if (op === "replace") {
            if (Array.isArray(current)) {
              current[index] = value;
            }
          }
        } else {
          if (op === "add" || op === "replace") {
            if (typeof current === "object" && current !== null) {
              (current as Record<string, unknown>)[lastPart] = value;
            }
          } else if (op === "remove") {
            if (typeof current === "object" && current !== null) {
              delete (current as Record<string, unknown>)[lastPart];
            }
          }
        }
      }

      // Format the updated form with proper newlines
      const formattedJson = JSON.stringify(updatedForm, null, 2)
        .replace(/\\n/g, "\n")
        .replace(/\\\\/g, "\\");

      setGeneratedJson(formattedJson);
      setParsedJson(updatedForm as UIJson);
    } catch (error) {
      console.error("Error updating form:", error);
      setUpdateError(
        error instanceof Error ? error.message : "Failed to update form"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900">
          Generate Form/UI
        </h2>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Settings
        </button>
      </div>

      {showApiKeyHint && (
        <Alert>
          No API key configured. Please go to Settings to configure your
          preferred LLM API key to start generating forms.
        </Alert>
      )}

      <div>
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-zinc-700 mb-2"
        >
          Enter your prompt
        </label>
        <p className="text-sm text-zinc-500 mb-4">
          Describe a UI / Form / Layout / etc.
        </p>
        <textarea
          id="prompt"
          rows={5}
          className="w-full rounded-lg border border-zinc-200 shadow-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 p-4 mt-2 text-base"
          placeholder=""
          value={prompt}
          onChange={handlePromptChange}
        />
        <div className="mt-4 flex justify-end md:space-x-2 flex-col md:flex-row gap-2 md:gap-0 ">
          <button
            type="button"
            onClick={loadExampleForm}
            disabled={isLoading || isEvaluating}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center md:text-left"
          >
            Load Example Form
          </button>
          <button
            type="button"
            onClick={loadMultiStepExample}
            disabled={isLoading || isEvaluating}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center md:text-left"
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
                isLoading ? "loading-gradient-text-dark" : ""
              }`}
            >
              {isLoading ? "Generating..." : "Generate UI/Form"}
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
                  isEvaluating ? "loading-gradient-text-light" : ""
                }`}
              >
                {isEvaluating ? "Evaluating..." : "Evaluate & Improve"}
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
                  <span>{evaluation.matchesPrompt ? "✓" : "✗"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Matches System Prompt:</span>
                  <span>{evaluation.matchesSystemPrompt ? "✓" : "✗"}</span>
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
            isEvaluating ? "opacity-50 pointer-events-none" : ""
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
                  onClick={() => handleViewModeChange("form")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    viewMode === "form"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
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
                  onClick={() => handleViewModeChange("mermaid-flow")}
                  className={`px-4 py-2 text-sm font-medium  ${
                    viewMode === "mermaid-flow"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  Visual Flow
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("json")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md  ${
                    viewMode === "json"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  JSON
                </button>
              </div>
            </div>
          </div>

          {viewMode === "json" ? (
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
          ) : viewMode === "form" ? (
            parsedJson &&
            parsedJson.app && (
              <div className="bg-white p-4 rounded-lg overflow-auto max-h-[800px] border border-zinc-300">
                <FormRenderer formJson={parsedJson} />
              </div>
            )
          ) : viewMode === "flow" ? (
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
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-zinc-900 mb-4">
              Update Form
            </h3>
            <div className="space-y-4">
              <textarea
                value={updatePrompt}
                onChange={(e) => setUpdatePrompt(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 shadow-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 p-4 text-base"
                placeholder="Describe the changes you want to make to the form..."
                rows={4}
              />
              {updateError && (
                <div className="text-red-500 text-sm">{updateError}</div>
              )}
              <button
                onClick={handleUpdateForm}
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Update Form"}
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

const styles = `
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .loading-gradient-text-dark {
    background: linear-gradient(
      90deg,
      #ffffff 0%,
      #7e19a6 50%,
      #ffffff 100%
    );
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient 1.5s ease infinite;
  }

  .loading-gradient-text-light {
    background: linear-gradient(
      90deg,
      #1e40af 0%,
      #c0d7fc 50%,
      #1e40af 100%
    );
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient 1.5s ease infinite;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
