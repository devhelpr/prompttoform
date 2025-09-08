import { useState, useRef } from 'react';
import { Menu } from '@headlessui/react';
import { READY_MADE_FORMS } from './example-form-definitions/ready-made-forms';
import { PdfUploadButton } from '../atoms/PdfUploadButton';

interface InitialPromptInputProps {
  onGenerate: (prompt: string) => void;
  onLoadJson: (json: string, prompt?: string) => void;
  onError?: (error: string) => void;
  isLoading: boolean;
  error?: string | null;
}

const EXAMPLE_PROMPTS = [
  {
    name: 'Contact Form',
    prompt:
      'A simple contact form with name, email, subject, and message fields',
  },
  {
    name: 'Registration Form',
    prompt:
      'A user registration form with name, email, password, confirm password, and terms acceptance',
  },
  {
    name: 'Health Check Wizard',
    prompt:
      'A health check wizard asking questions and branching based on user answers. Make sure that if no doctor visit is needed that this is shown with a disclaimer',
  },
  {
    name: 'Job Application',
    prompt:
      'A 3-step job application form with personal details, work experience, and references',
  },
  {
    name: 'Contact List Manager',
    prompt:
      'A form with an array field-type for maintaining a list of contacts',
  },
  {
    name: 'Age-based Consent',
    prompt: 'Show age field and if age < 18 show a parent consent field',
  },
  {
    name: 'Complex Health Decision Tree',
    prompt:
      'Make a form that is complex, has branches at least 4 layers deep... so a real decision tree.. make it about health and just make something up.. this is just for testing',
  },
];

export function InitialPromptInput({
  onGenerate,
  onLoadJson,
  onError,
  isLoading,
  error,
}: InitialPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [piiWarning, setPiiWarning] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>(
    'top'
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const handleGenerate = () => {
    if (prompt.trim()) {
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
    // Append the PDF-generated prompt to the existing prompt
    const newPrompt = prompt ? `${prompt}\n\n${pdfPrompt}` : pdfPrompt;
    setPrompt(newPrompt);
  };

  const handlePdfError = (error: string) => {
    onError?.(error);
  };

  // const calculateDropdownPosition = () => {
  //   if (!buttonRef.current) return 'bottom';

  //   const buttonRect = buttonRef.current.getBoundingClientRect();
  //   const dropdownHeight = 384; // max-h-96 = 24rem = 384px
  //   const viewportHeight = window.innerHeight;
  //   const spaceBelow = viewportHeight - buttonRect.bottom;
  //   const spaceAbove = buttonRect.top;

  //   // If there's not enough space below but enough space above, position above
  //   if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
  //     return 'top';
  //   }
  //   return 'bottom';
  // };

  return (
    <div className="space-y-6">
      {/* Main textarea */}
      <div>
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-zinc-700 mb-3"
        >
          Describe your form
        </label>

        <textarea
          id="prompt"
          rows={8}
          className={`w-full rounded-xl border-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 p-6 text-base resize-none transition-all duration-200 ${
            piiWarning ? 'border-amber-300' : 'border-zinc-200'
          } ${error ? 'border-red-300' : ''}`}
          placeholder="Describe the form you want to create... For example: 'A contact form with name, email, and message fields' or 'A multi-step registration form with validation'"
          value={prompt}
          onChange={handlePromptChange}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
        />

        {/* Character count and shortcuts */}
        <div className="flex justify-between items-center mt-2 text-sm text-zinc-500">
          <span>{prompt.length} characters</span>
          <span className="hidden sm:inline">Press ⌘+Enter to generate</span>
        </div>

        {/* PII Warning */}
        {piiWarning && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">{piiWarning}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* PDF Upload button */}
        <PdfUploadButton
          onPdfParsed={handlePdfParsed}
          onError={handlePdfError}
          disabled={isLoading}
        />

        {/* Examples dropdown */}
        <div className="relative">
          <Menu as="div" className="relative inline-block text-left">
            {({ open }) => {
              // Calculate position when menu opens
              // if (open && dropdownPosition === 'bottom') {
              //   // Use setTimeout to ensure this runs after the menu is rendered
              //   setTimeout(() => {
              //     setDropdownPosition(calculateDropdownPosition());
              //   }, 0);
              // }

              return (
                <>
                  <Menu.Button
                    ref={buttonRef}
                    disabled={isLoading}
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
                            onClick={() => handleExampleSelect(example.prompt)}
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
          disabled={isLoading || !prompt.trim()}
          className={`flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative overflow-hidden ${
            isLoading ? 'cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
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
              Generating...
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
              Generate Form
            </>
          )}
        </button>
      </div>
    </div>
  );
}
