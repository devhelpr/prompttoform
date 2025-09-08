import React from 'react';
import {
  FormGenerationProgress,
  FormGenerationStep,
} from '../atoms/FormGenerationProgress';
import { useAgentState } from './AgentStateManager';

export const FormGenerationView: React.FC = () => {
  const { state } = useAgentState();

  const getSteps = (): FormGenerationStep[] => {
    const steps: FormGenerationStep[] = [
      {
        id: 'multi-language-detection',
        title: 'Multi-language Detection',
        description: 'Analyzing prompt for multi-language requirements',
        status: 'pending',
      },
      {
        id: 'base-form-generation',
        title: 'Base Form Generation',
        description: 'Generating the core form structure',
        status: 'pending',
      },
      {
        id: 'translation-generation',
        title: 'Translation Generation',
        description: 'Creating translations for all requested languages',
        status: 'pending',
      },
      {
        id: 'finalizing-form',
        title: 'Finalizing Form',
        description: 'Adding multi-language support and finalizing',
        status: 'pending',
      },
      {
        id: 'completing',
        title: 'Complete',
        description: 'Form generation finished successfully',
        status: 'pending',
      },
    ];

    if (!state.generationProgress) {
      return steps;
    }

    const currentStepId = state.generationProgress.step;
    const currentProgress = state.generationProgress.progress;

    return steps.map((step) => {
      const stepIndex = steps.findIndex((s) => s.id === step.id);
      const currentStepIndex = steps.findIndex((s) => s.id === currentStepId);

      if (stepIndex < currentStepIndex) {
        return { ...step, status: 'completed' as const };
      } else if (stepIndex === currentStepIndex) {
        return {
          ...step,
          status: 'in-progress' as const,
          progress: currentProgress,
        };
      } else {
        return { ...step, status: 'pending' as const };
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <FormGenerationProgress
          steps={getSteps()}
          currentStep={state.generationProgress?.message}
          overallProgress={state.generationProgress?.progress || 0}
        />

        {state.error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Generation Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{state.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
