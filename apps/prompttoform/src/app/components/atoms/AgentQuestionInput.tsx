import React, { useState, useCallback } from 'react';
import type { AgentQuestion } from '../../types/agent.types';

interface AgentQuestionInputProps {
  question: AgentQuestion;
  onSubmit: (value: string | string[], questionId: string) => void;
  onSkip: (questionId: string) => void;
  isLoading: boolean;
}

export const AgentQuestionInput: React.FC<AgentQuestionInputProps> = ({
  question,
  onSubmit,
  onSkip,
  isLoading,
}) => {
  const [value, setValue] = useState<string | string[]>(
    question.inputType === 'multiselect' ? [] : ''
  );
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(() => {
    setError('');

    // Validate required fields
    if (question.required) {
      if (question.inputType === 'multiselect') {
        if (!Array.isArray(value) || value.length === 0) {
          setError('This field is required');
          return;
        }
      } else {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          setError('This field is required');
          return;
        }
      }
    }

    onSubmit(value, question.id);
  }, [value, question.required, question.inputType, question.id, onSubmit]);

  const handleSkip = useCallback(() => {
    onSkip(question.id);
  }, [question.id, onSkip]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
      if (error) setError('');
    },
    [error]
  );

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setValue(e.target.value);
      if (error) setError('');
    },
    [error]
  );

  const handleCheckboxChange = useCallback(
    (option: string) => {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(option)
        ? currentValue.filter((v) => v !== option)
        : [...currentValue, option];
      setValue(newValue);
      if (error) setError('');
    },
    [value, error]
  );

  const inputId = `question-${question.id}`;

  const renderInput = () => {
    switch (question.inputType) {
      case 'text':
        return (
          <input
            id={inputId}
            type="text"
            value={value as string}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your answer..."
            disabled={isLoading}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={inputId}
            value={value as string}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px]"
            placeholder="Enter your answer..."
            disabled={isLoading}
          />
        );

      case 'select':
        return (
          <select
            id={inputId}
            value={value as string}
            onChange={handleSelectChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="mb-3">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="text-xs text-gray-500 mb-2">
          Category: {question.category}
        </div>
      </div>

      {renderInput()}

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>

          {!question.required && (
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
          )}
        </div>

        {question.inputType === 'textarea' && (
          <div className="text-xs text-gray-500">
            Press Ctrl+Enter to submit
          </div>
        )}
      </div>
    </div>
  );
};
