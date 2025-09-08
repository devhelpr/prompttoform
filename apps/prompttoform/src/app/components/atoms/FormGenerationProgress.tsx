import React from 'react';

export interface FormGenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number; // 0-100 for in-progress steps
}

interface FormGenerationProgressProps {
  steps: FormGenerationStep[];
  currentStep?: string;
  overallProgress?: number;
}

export const FormGenerationProgress: React.FC<FormGenerationProgressProps> = ({
  steps,
  currentStep,
  overallProgress = 0,
}) => {
  const getStepIcon = (step: FormGenerationStep) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-sm">
            ✓
          </div>
        );
      case 'in-progress':
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm">
            {step.progress ? `${Math.round(step.progress)}%` : '...'}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-sm">
            ✗
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-gray-300 text-gray-600 rounded-full text-sm">
            {steps.indexOf(step) + 1}
          </div>
        );
    }
  };

  const getStepStatusColor = (step: FormGenerationStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Generating Your Form
        </h3>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {Math.round(overallProgress)}% complete
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${
              step.status === 'in-progress'
                ? 'bg-blue-50 border border-blue-200'
                : step.status === 'completed'
                ? 'bg-green-50 border border-green-200'
                : step.status === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium ${getStepStatusColor(step)}`}>
                {step.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              {step.status === 'in-progress' && step.progress && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentStep && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Current step:</strong> {currentStep}
          </p>
        </div>
      )}
    </div>
  );
};
