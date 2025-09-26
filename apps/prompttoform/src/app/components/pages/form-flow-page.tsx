import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FormFlow from '../molecules/FormFlow';

interface FormDefinition {
  app?: {
    title?: string;
  };
  [key: string]: unknown;
}

interface FormFlowPageProps {
  formDefinition?: FormDefinition;
}

export function FormFlowPage({ formDefinition }: FormFlowPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Get form definition from location state if not passed as prop
  const formData = formDefinition || location.state?.formDefinition;

  const handleBackToEditor = () => {
    navigate('/');
  };

  if (!formData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            No Form Data
          </h2>
          <p className="text-zinc-600 mb-6">
            No form definition was provided to the form flow page.
          </p>
          <button
            onClick={handleBackToEditor}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToEditor}
            className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Editor
          </button>
          <h1 className="text-xl font-semibold text-zinc-900">
            Form Flow: {formData.app?.title || 'Untitled Form'}
          </h1>
        </div>
      </div>

      {/* Form Flow Content */}
      <div className="flex-1 overflow-hidden">
        <FormFlow formJson={formData} />
      </div>
    </div>
  );
}
