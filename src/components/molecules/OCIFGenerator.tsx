import { useState } from 'react';
import Ajv2020 from "ajv/dist/2020"
import { OCIFSchema } from '../../types/schema';
import { generateOCIFFromPrompt } from '../../services/llm';
import { Settings } from './Settings';
import { evaluateAndRerunIfNeeded } from '../../services/prompt-eval';
import { getCurrentAPIConfig } from '../../services/llm-api';

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
type ViewMode = 'json' | 'form';

// Import the schema
import schemaJson from '../../../schema.json';
import { getSystemPrompt } from '../../prompt-library/system-prompt';
const schema = schemaJson as OCIFSchema;

// Initialize Ajv
const ajv = new Ajv2020();
const validate = ajv.compile(schema);

export function OCIFGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedOCIF, setGeneratedOCIF] = useState('');
  const [parsedOCIF, setParsedOCIF] = useState<OCIFJson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('json');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setError(null);
    setEvaluation(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    
    if (mode === 'form' && parsedOCIF) {
      //TODO: Implement form generation 
    }
  };
    

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    setParsedOCIF(null);

    try {
      // Check if API key is set
      const apiConfig = getCurrentAPIConfig();
      if (!apiConfig.apiKey) {
        setError(`No API key set for ${apiConfig.name}. Please configure it in the Settings.`);
        setIsLoading(false);
        return;
      }

      // Call the LLM API to generate the OCIF file
      const response = await generateOCIFFromPrompt(prompt, schema);
      
      // Try to parse the response as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        setError('Failed to parse the generated JSON. Please try again.');
        setGeneratedOCIF(response);
        setIsLoading(false);
        return;
      }


      // Validate against the schema
      const valid = validate(parsedResponse);
      
      if (!valid) {
        setError(`Validation failed: ${ajv.errorsText(validate.errors)}`);
      }

      // Store string version
      setGeneratedOCIF(JSON.stringify(parsedResponse, null, 2));
      
      // Create SVG-compatible JSON
      
      // Generate SVG if in SVG view mode
    } catch (err) {
      setError('An error occurred while generating the OCIF file.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateAndRerun = async () => {
    if (!generatedOCIF) {
      setError('Generate OCIF content first before evaluating');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      // Create a system message - same as used for generation
      const systemMessage = getSystemPrompt(schema);

      const apiConfig = getCurrentAPIConfig();
      
      // Check if API key is set
      if (!apiConfig.apiKey) {
        setError(`No API key set for ${apiConfig.name}. Please configure it in the Settings.`);
        setIsEvaluating(false);
        return;
      }
      
      // Evaluate the output and rerun if needed
      const result = await evaluateAndRerunIfNeeded(
        prompt,
        systemMessage,
        generatedOCIF,
        apiConfig
      );
      
      setEvaluation(result.evaluation);
      
      // If the prompt was rerun and improved output was generated
      if (result.wasRerun && result.improvedOutput) {
        try {
          // Set the improved output
          setGeneratedOCIF(JSON.stringify(result.improvedOutput, null, 2));

          
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
      navigator.clipboard.writeText(generatedOCIF);
    }
  };

  const handleDownload = () => {
    let blob;
    let filename;
    
    if (viewMode === 'json') {
      blob = new Blob([generatedOCIF], { type: 'application/json' });
      filename = 'ocif-file.json';
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900">Generate OCIF</h2>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Settings
        </button>
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-zinc-700 mb-2">
          Enter your prompt to generate a ui/form
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
        <div className="mt-4 flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate UI/Form'}
          </button>
          
          {generatedOCIF && (
            <button
              type="button"
              onClick={handleEvaluateAndRerun}
              disabled={isEvaluating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isEvaluating ? 'Evaluating...' : 'Evaluate & Improve'}
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

      {evaluation && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3 w-full">
              <h3 className="text-sm font-medium text-blue-800">Evaluation Results</h3>
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
                      {evaluation.missingElements.map((element: string, index: number) => (
                        <li key={index}>{element}</li>
                      ))}
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
      
      {(generatedOCIF) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-zinc-900">
                {viewMode === 'json' ? 'Generated OCIF' : 'OCIF Diagram'}
              </h3>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('json')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    viewMode === 'json' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  JSON
                </button>
                
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyToClipboard}
                className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download
              </button>
            </div>
          </div>

          {viewMode === 'json' ? (
            <pre className="bg-zinc-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {generatedOCIF}
            </pre>
          ) : (
            <div className="bg-white p-4 rounded-lg overflow-auto max-h-[500px] border border-zinc-300">
              
            </div>
          )}
        </div>
      )}

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
} 


