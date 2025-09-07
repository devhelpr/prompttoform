import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ConversationMessage } from '../atoms/ConversationMessage';
import { AgentQuestionInput } from '../atoms/AgentQuestionInput';
import type { ConversationState, AgentQuestion } from '../../types/agent.types';

interface AgentConversationProps {
  conversationState: ConversationState;
  onFormGenerated: (formResult: any) => void;
  onError: (error: string) => void;
  onSkipToForm: () => void;
  isLoading: boolean;
  conversationManager: any; // Add the conversation manager as a prop
}

export const AgentConversation: React.FC<AgentConversationProps> = ({
  conversationState,
  onFormGenerated,
  onError,
  onSkipToForm,
  isLoading,
  conversationManager,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isProcessingResponse, setIsProcessingResponse] = React.useState(false);
  const [userResponses, setUserResponses] = useState<
    Record<string, string | string[]>
  >({});

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === 'function'
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationState.messages]);

  // Handle individual question responses (no submit, just store the value)
  const handleQuestionResponse = useCallback(
    (value: string | string[], questionId: string) => {
      setUserResponses((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    },
    []
  );

  // Submit all responses at once and generate form
  const handleSubmitAllResponses = useCallback(async () => {
    try {
      setIsProcessingResponse(true);

      // Use the passed conversation manager instead of creating a new one

      // Process all responses sequentially
      let currentState = conversationState;

      for (const question of conversationState.currentQuestions) {
        const response = userResponses[question.id] || '';
        const stringValue = Array.isArray(response)
          ? response.join(', ')
          : response;

        currentState = await conversationManager.processUserResponse(
          stringValue,
          question.id
        );
      }

      // Generate the form directly
      const { FormGenerationAgent } = await import('../../services/agents');
      const formGenerationAgent = new FormGenerationAgent({} as any);

      const formResult = await formGenerationAgent.generateFormFromConversation(
        currentState
      );
      onFormGenerated(formResult);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessingResponse(false);
    }
  }, [conversationState, userResponses, onFormGenerated, onError]);

  const handleSkipToFormGeneration = useCallback(async () => {
    try {
      setIsProcessingResponse(true);

      // Use the passed conversation manager instead of creating a new one

      const updatedState = await conversationManager.skipToFormGeneration();

      const { FormGenerationAgent } = await import('../../services/agents');
      const schemaJson = await import('@schema');
      const formGenerationAgent = new FormGenerationAgent(
        schemaJson.default as any,
        true
      );

      const formResult = await formGenerationAgent.generateFormFromConversation(
        updatedState
      );
      onFormGenerated(formResult);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessingResponse(false);
    }
  }, [onFormGenerated, onError]);

  const handleGenerateForm = useCallback(async () => {
    try {
      setIsProcessingResponse(true);

      const { FormGenerationAgent } = await import('../../services/agents');
      const schemaJson = await import('@schema');
      const formGenerationAgent = new FormGenerationAgent(
        schemaJson.default as any,
        true
      );

      const formResult = await formGenerationAgent.generateFormFromConversation(
        conversationState
      );
      onFormGenerated(formResult);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessingResponse(false);
    }
  }, [conversationState, onFormGenerated, onError]);

  const isProcessing = isLoading || isProcessingResponse;

  return (
    <div className="agent-conversation max-w-4xl mx-auto">
      {/* Conversation Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Agent Conversation
            </h2>
            <p className="text-sm text-gray-600">
              {conversationState.isComplete
                ? 'Ready to generate form'
                : 'Answer the questions below, then click "Generate Form" to create your form'}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Session: {conversationState.sessionId}
          </div>
        </div>
      </div>

      {/* Conversation Messages */}
      <div className="bg-gray-50 p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {conversationState.messages.map((message) => (
            <ConversationMessage key={message.id} message={message} />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Current Questions */}
      {!conversationState.isComplete &&
        conversationState.currentQuestions.length > 0 && (
          <div className="bg-white p-4 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3">
              Answer these questions to help create your form (
              {conversationState.currentQuestions.length})
            </h3>
            <div className="space-y-4">
              {conversationState.currentQuestions.map((question) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {question.category && (
                    <p className="text-xs text-gray-500 mb-2">
                      Category: {question.category}
                    </p>
                  )}

                  {question.inputType === 'text' && (
                    <input
                      type="text"
                      value={(userResponses[question.id] as string) || ''}
                      onChange={(e) =>
                        handleQuestionResponse(e.target.value, question.id)
                      }
                      placeholder="Enter your answer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {question.inputType === 'textarea' && (
                    <textarea
                      value={(userResponses[question.id] as string) || ''}
                      onChange={(e) =>
                        handleQuestionResponse(e.target.value, question.id)
                      }
                      placeholder="Enter your answer..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    />
                  )}

                  {question.inputType === 'select' && question.options && (
                    <select
                      value={(userResponses[question.id] as string) || ''}
                      onChange={(e) =>
                        handleQuestionResponse(e.target.value, question.id)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select an option...</option>
                      {question.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {question.inputType === 'multiselect' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(
                              (userResponses[question.id] as string[]) || []
                            ).includes(option)}
                            onChange={(e) => {
                              const currentValues =
                                (userResponses[question.id] as string[]) || [];
                              const newValues = e.target.checked
                                ? [...currentValues, option]
                                : currentValues.filter((v) => v !== option);
                              handleQuestionResponse(newValues, question.id);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Single Submit Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubmitAllResponses}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? 'Generating Form...'
                    : 'Generate Form with These Answers'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* No Questions State */}
      {!conversationState.isComplete &&
        conversationState.currentQuestions.length === 0 && (
          <div className="bg-white p-4 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              No questions to answer at the moment.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              The agent is processing your responses...
            </p>
          </div>
        )}

      {/* Complete State - This should rarely be shown now since we generate forms directly */}
      {conversationState.isComplete && (
        <div className="bg-white p-4 border-t border-gray-200">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Ready to Generate Form
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              All information has been collected. Ready to generate your form.
            </p>
            <button
              onClick={handleGenerateForm}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Generating Form...' : 'Generate Form'}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={onSkipToForm}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip to Form Generation
          </button>

          {isProcessing && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
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
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Gathered Information Summary */}
      {Object.keys(conversationState.context).length > 0 && (
        <div className="bg-white p-4 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-2">
            Gathered Information
          </h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(conversationState.context, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
