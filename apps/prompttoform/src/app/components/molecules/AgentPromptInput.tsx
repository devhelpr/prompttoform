import React, { useState, useRef } from 'react';
import { Menu } from '@headlessui/react';
import { READY_MADE_FORMS } from './example-form-definitions/ready-made-forms';
import { PdfUploadButton } from '../atoms/PdfUploadButton';
import { AgentConversation } from './AgentConversation';
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
    startAgentConversation,
    processUserResponse,
    skipToFormGeneration,
    generateFormFromConversation,
    resetAgentState,
    setError: setAgentError,
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
          isLoading={agentState.isLoading}
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Generating Form
          </h3>
          <p className="text-gray-600">
            Creating your form based on the conversation...
          </p>
          <button
            onClick={generateFormFromConversation}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Generate Form Now
          </button>
        </div>
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
          <button
            ref={buttonRef}
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading || agentState.isLoading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading || agentState.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {useAgent ? 'Starting Conversation...' : 'Generating...'}
              </>
            ) : (
              <>{useAgent ? 'Start AI Conversation' : 'Generate Form'}</>
            )}
          </button>

          <div className="relative">
            <Menu>
              <Menu.Button className="bg-gray-100 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center">
                Load Example
                <svg
                  className="ml-2 h-4 w-4"
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
              </Menu.Button>
              <Menu.Items
                className={`absolute ${
                  dropdownPosition === 'top'
                    ? 'bottom-full mb-2'
                    : 'top-full mt-2'
                } right-0 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto`}
              >
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <Menu.Item key={index}>
                    {({ active }) => (
                      <button
                        onClick={() => handleExampleSelect(example.prompt)}
                        className={`${
                          active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                        } block w-full text-left px-4 py-2 text-sm hover:bg-blue-50`}
                      >
                        <div className="font-medium">{example.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {example.prompt}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <PdfUploadButton
            onPdfParsed={handlePdfParsed}
            onError={handlePdfError}
            disabled={isLoading || agentState.isLoading}
          />
        </div>

        {/* Ready-made Forms */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Or start with a ready-made form:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {READY_MADE_FORMS.map((form, index) => (
              <button
                key={index}
                onClick={() =>
                  onLoadJson(JSON.stringify(form.json, null, 2), form.name)
                }
                disabled={isLoading || agentState.isLoading}
                className="p-3 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-sm text-gray-900">
                  {form.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {form.json.app?.pages?.length || 0} page(s)
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
