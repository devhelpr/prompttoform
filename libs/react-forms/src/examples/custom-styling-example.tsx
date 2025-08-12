import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

const customStylingExample: FormDefinition = {
  app: {
    title: 'Custom Styling Demo',
    pages: [
      {
        id: 'page1',
        title: 'Personal Information',
        route: '/personal',
        components: [
          {
            type: 'input',
            id: 'firstName',
            label: 'First Name',
            validation: {
              required: true,
              errorMessages: {
                required: 'First name is required',
              },
            },
            props: {
              placeholder: 'Enter your first name',
            },
          },
          {
            type: 'input',
            id: 'email',
            label: 'Email',
            validation: {
              required: true,
              pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
              errorMessages: {
                required: 'Email is required',
                pattern: 'Please enter a valid email address',
              },
            },
            props: {
              placeholder: 'Enter your email',
              inputType: 'email',
            },
          },
        ],
        nextPage: 'page2',
      },
      {
        id: 'page2',
        title: 'Preferences',
        route: '/preferences',
        components: [
          {
            type: 'select',
            id: 'favoriteColor',
            label: 'Favorite Color',
            options: [
              { label: 'Red', value: 'red' },
              { label: 'Blue', value: 'blue' },
              { label: 'Green', value: 'green' },
            ],
            validation: {
              required: true,
              errorMessages: {
                required: 'Please select your favorite color',
              },
            },
          },
        ],
        isEndPage: true,
      },
    ],
  },
};

// Example 1: Simple class overrides
const simpleOverrideSettings = {
  showFormSubmissions: true,
  classes: {
    container: 'w-full bg-blue-50 p-4 rounded-lg',
    header: 'bg-blue-100 p-4 rounded-md',
    nextButton: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md',
    previousButton:
      'bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md',
  },
  texts: {
    nextButton: 'Continue',
    previousButton: 'Go Back',
    submitButton: 'Send Form',
    stepIndicator: 'Page {currentStep} of {totalSteps}',
  },
};

// Example 2: Bootstrap-style classes
const bootstrapSettings = {
  showFormSubmissions: true,
  classes: {
    container: 'container-fluid',
    header: 'alert alert-info',
    page: 'card',
    field: 'form-group',
    fieldLabel: 'form-label',
    fieldInput: 'form-control',
    fieldError: 'invalid-feedback',
    fieldHelperText: 'form-text',
    nextButton: 'btn btn-primary',
    previousButton: 'btn btn-secondary',
    stepIndicator: 'progress',
    stepIndicatorActive: 'progress-bar',
  },
  texts: {
    nextButton: 'Next',
    previousButton: 'Previous',
    submitButton: 'Submit Form',
    stepIndicator: 'Step {currentStep} of {totalSteps}',
    submissionsTitle: 'Submitted Data',
    multiPageInfo: 'This form contains {pageCount} pages',
  },
};

// Example 3: Theme-based styling
const themeSettings = {
  showFormSubmissions: true,
  theme: {
    colors: {
      primary: '#8b5cf6',
      secondary: '#64748b',
      error: '#ef4444',
      success: '#10b981',
      background: '#f8fafc',
      text: '#1e293b',
      border: '#e2e8f0',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
    },
  },
  classes: {
    container: 'w-full p-6',
    header:
      'bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-lg',
    nextButton:
      'bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold',
    previousButton:
      'bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold',
  },
  texts: {
    nextButton: 'Continue →',
    previousButton: '← Back',
    submitButton: 'Submit ✨',
    stepIndicator: 'Step {currentStep} / {totalSteps}',
    thankYouTitle: '🎉 Success!',
    restartButton: 'Submit Another Response',
    submissionsTitle: '📋 Form Data',
  },
};

export const CustomStylingExample: React.FC = () => {
  const [currentStyle, setCurrentStyle] = React.useState<
    'default' | 'simple' | 'bootstrap' | 'theme'
  >('default');

  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Custom styling demo submitted with values:', formValues);
    alert('Form submitted! Check the console to see the submitted values.');
  };

  const getCurrentSettings = () => {
    switch (currentStyle) {
      case 'simple':
        return simpleOverrideSettings;
      case 'bootstrap':
        return bootstrapSettings;
      case 'theme':
        return themeSettings;
      default:
        return { showFormSubmissions: true };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Custom Styling Demo
        </h3>
        <p className="text-blue-700 text-sm mb-3">
          This form demonstrates the new custom styling system with class
          overrides, theme support, and configurable text labels.
        </p>
        <div className="text-blue-700 text-sm space-y-1">
          <p>
            <strong>Features demonstrated:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Class-based styling overrides</li>
            <li>Theme-based CSS variable customization</li>
            <li>Configurable text labels and messages</li>
            <li>Complete style replacement (Bootstrap example)</li>
            <li>Partial style customization</li>
            <li>Responsive design preservation</li>
          </ul>
        </div>
      </div>

      {/* Style Selector */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-md font-medium text-gray-800 mb-3">
          Choose Styling:
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentStyle('default')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentStyle === 'default'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Default Tailwind
          </button>
          <button
            onClick={() => setCurrentStyle('simple')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentStyle === 'simple'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Simple Override
          </button>
          <button
            onClick={() => setCurrentStyle('bootstrap')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentStyle === 'bootstrap'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Bootstrap Style
          </button>
          <button
            onClick={() => setCurrentStyle('theme')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentStyle === 'theme'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Theme Custom
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <FormRenderer
          formJson={customStylingExample}
          onSubmit={handleSubmit}
          settings={getCurrentSettings()}
        />
      </div>

      {/* Code Example */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-md font-medium text-gray-800 mb-3">
          Current Settings:
        </h4>
        <pre className="bg-white p-4 rounded-md text-sm overflow-x-auto">
          {JSON.stringify(getCurrentSettings(), null, 2)}
        </pre>
      </div>
    </div>
  );
};
