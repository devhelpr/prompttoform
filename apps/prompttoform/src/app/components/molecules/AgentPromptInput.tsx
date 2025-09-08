import React, { useState, useRef } from 'react';
import { Menu } from '@headlessui/react';
import { READY_MADE_FORMS } from './example-form-definitions/ready-made-forms';
import { PdfUploadButton } from '../atoms/PdfUploadButton';
import { AgentConversation } from './AgentConversation';
import { FormGenerationView } from './FormGenerationView';
import { useAgentState } from './AgentStateManager';
import { FormGenerationResult } from '../../services/form-generation.service';

interface AgentPromptInputProps {
  onGenerate: (prompt: string) => void;
  onLoadJson: (json: string, prompt?: string) => void;
  onFormGenerated?: (result: FormGenerationResult) => void;
  onError?: (error: string) => void;
  isLoading: boolean;
  error?: string | null;
  enableAgent?: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    name: 'Contact Form',
    prompt:
      'Create a contact form with fields for name, email, phone number, and message. Include validation for email format and make all fields required.',
  },
  {
    name: 'Registration Form',
    prompt:
      'Build a user registration form with first name, last name, email, password, confirm password, and terms acceptance checkbox. Add password strength validation.',
  },
  {
    name: 'Survey Form',
    prompt:
      'Design a customer satisfaction survey with rating scales, multiple choice questions, and open-ended feedback sections.',
  },
  {
    name: 'Order Form',
    prompt:
      'Create an order form for an e-commerce site with product selection, quantity, shipping address, and payment information.',
  },
  {
    name: 'Event Registration',
    prompt:
      'Build an event registration form with attendee information, dietary preferences, emergency contact, and workshop selections.',
  },
  {
    name: 'Job Application',
    prompt:
      'Design a job application form with personal information, work experience, education, skills, and file upload for resume.',
  },
];

export function AgentPromptInput({
  onGenerate,
  onLoadJson,
  onFormGenerated,
  onError,
  isLoading,
  error,
  enableAgent = true,
}: AgentPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [piiWarning, setPiiWarning] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>(
    'top'
  );
  const [useAgent, setUseAgent] = useState(enableAgent);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    state: agentState,
    setCurrentView,
    startAgentConversation,
    processUserResponse,
    skipToFormGeneration,
    generateFormFromConversation,
    resetAgentState,
    setError: setAgentError,
    conversationManager,
  } = useAgentState();

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);
    validatePII(value);
  };

  const validatePII = (text: string) => {
    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    };

    for (const [type, pattern] of Object.entries(piiPatterns)) {
      if (pattern.test(text)) {
        setPiiWarning(
          `Warning: This prompt contains ${type} information. Please ensure this is intentional.`
        );
        return;
      }
    }
    setPiiWarning(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (useAgent && enableAgent) {
      // Use agent system
      try {
        await startAgentConversation(prompt.trim());
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to start agent conversation';
        setAgentError(errorMessage);
        onError?.(errorMessage);
      }
    } else {
      // Use direct generation
      onGenerate(prompt.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  const handleExampleSelect = (example: string) => {
    setPrompt(example);
  };

  const handlePdfParsed = (pdfPrompt: string) => {
    const newPrompt = prompt ? `${prompt}\n\n${pdfPrompt}` : pdfPrompt;
    setPrompt(newPrompt);
  };

  const handlePdfError = (error: string) => {
    onError?.(error);
  };

  const handleAgentFormGenerated = async (result: FormGenerationResult) => {
    if (onFormGenerated) {
      onFormGenerated(result);
    }
    // Reset agent state after successful generation
    resetAgentState();
  };

  const handleAgentError = (error: string) => {
    onError?.(error);
  };

  const handleBackToPrompt = () => {
    resetAgentState();
  };

  // Show agent conversation if active
  if (
    agentState.currentView === 'conversation' &&
    agentState.conversationState
  ) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={handleBackToPrompt}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to prompt
          </button>
        </div>
        <AgentConversation
          conversationState={agentState.conversationState}
          onFormGenerated={handleAgentFormGenerated}
          onError={handleAgentError}
          onSkipToForm={skipToFormGeneration}
          onStartGeneration={() => setCurrentView('generating')}
          onGenerateForm={generateFormFromConversation}
          isLoading={agentState.isLoading}
          conversationManager={conversationManager}
        />
      </div>
    );
  }

  // Show generating state
  if (agentState.currentView === 'generating') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={handleBackToPrompt}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to prompt
          </button>
        </div>
        <FormGenerationView />
      </div>
    );
  }

  // Show regular prompt input
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your Form
          </h2>
          <p className="text-gray-600">
            Describe the form you want to create. Be as specific as possible
            about fields, validation, and layout.
          </p>
        </div>

        {/* Agent Toggle */}
        {enableAgent && (
          <div className="mb-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={useAgent}
                onChange={(e) => setUseAgent(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Use AI Assistant to help refine your form requirements
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              The AI assistant will ask clarifying questions to help create a
              better form
            </p>
          </div>
        )}

        {/* Error Display */}
        {(error || agentState.error) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error || agentState.error}</p>
          </div>
        )}

        {/* PII Warning */}
        {piiWarning && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">{piiWarning}</p>
          </div>
        )}

        {/* Prompt Input */}
        <div className="mb-4">
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Form Description
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyPress}
            placeholder="Describe the form you want to create... (e.g., 'Create a contact form with name, email, and message fields')"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[120px]"
            disabled={isLoading || agentState.isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to generate
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* PDF Upload button */}
          <PdfUploadButton
            onPdfParsed={handlePdfParsed}
            onError={handlePdfError}
            disabled={isLoading || agentState.isLoading}
          />

          {/* Examples dropdown */}
          <div className="relative">
            <Menu as="div" className="relative inline-block text-left">
              {({ open }) => {
                return (
                  <>
                    <Menu.Button
                      ref={buttonRef}
                      disabled={isLoading || agentState.isLoading}
                      className="inline-flex items-center justify-center px-4 py-3 border border-zinc-300 shadow-sm text-sm font-medium rounded-lg text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Examples
                    </Menu.Button>

                    <Menu.Items
                      className={`absolute z-50 w-96 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 max-h-96 overflow-y-auto focus:outline-none ${
                        dropdownPosition === 'top'
                          ? 'bottom-full mb-1'
                          : 'top-full mt-1'
                      }`}
                    >
                      {/* Ready-made Forms Section */}
                      <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
                        <h3 className="text-sm font-semibold text-zinc-700">
                          Ready-made Forms
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Load complete form definitions
                        </p>
                      </div>
                      {READY_MADE_FORMS.map((form, index) => (
                        <Menu.Item key={`form-${index}`}>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                onLoadJson(
                                  JSON.stringify(form.json, null, 2),
                                  form.prompt
                                );
                              }}
                              className={`${
                                active ? 'bg-zinc-50' : ''
                              } w-full text-left px-4 py-3 focus:bg-zinc-50 focus:outline-none transition-colors border-b border-zinc-100`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-zinc-900 flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-2 text-green-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    {form.name}
                                  </div>
                                  <div className="text-sm text-zinc-600 mt-1 whitespace-normal">
                                    {form.description}
                                  </div>
                                </div>
                                <div className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                                  Load JSON
                                </div>
                              </div>
                            </button>
                          )}
                        </Menu.Item>
                      ))}

                      {/* Prompts Section */}
                      <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
                        <h3 className="text-sm font-semibold text-zinc-700">
                          Example Prompts
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Generate forms with AI
                        </p>
                      </div>
                      {EXAMPLE_PROMPTS.map((example, index) => (
                        <Menu.Item key={`prompt-${index}`}>
                          {({ active }) => (
                            <button
                              onClick={() =>
                                handleExampleSelect(example.prompt)
                              }
                              className={`${
                                active ? 'bg-zinc-50' : ''
                              } w-full text-left px-4 py-3 focus:bg-zinc-50 focus:outline-none transition-colors border-b border-zinc-100`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-zinc-900 flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-2 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                      />
                                    </svg>
                                    {example.name}
                                  </div>
                                  <div className="text-sm text-zinc-600 mt-1 truncate whitespace-normal">
                                    {example.prompt}
                                  </div>
                                </div>
                                <div className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                                  Generate
                                </div>
                              </div>
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </>
                );
              }}
            </Menu>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || agentState.isLoading || !prompt.trim()}
            className={`flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative overflow-hidden ${
              isLoading || agentState.isLoading ? 'cursor-not-allowed' : ''
            }`}
          >
            {isLoading || agentState.isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                {useAgent ? 'Starting Conversation...' : 'Generating...'}
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {useAgent ? 'Start AI Conversation' : 'Generate Form'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
