import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

// Example matching the user's JSON structure with template variables in text components
const healthQuestionnaireExample: FormDefinition = {
  app: {
    title: 'Health Questionnaire - Insurance Application',
    pages: [
      {
        id: 'personal-info',
        title: 'Personal Information',
        route: '/personal',
        components: [
          {
            id: 'fullName',
            type: 'input',
            label: 'Full Name',
            props: {
              placeholder: 'Enter your full name',
              inputType: 'text',
            },
            validation: {
              required: true,
              minLength: 2,
              maxLength: 100,
            },
          },
          {
            id: 'email',
            type: 'input',
            label: 'Email Address',
            props: {
              placeholder: 'you@example.com',
              inputType: 'email',
            },
            validation: {
              required: true,
              pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            },
          },
        ],
        nextPage: 'health-questions',
      },
      {
        id: 'health-questions',
        title: 'Health Questions',
        route: '/health',
        components: [
          {
            id: 'smokerRadio',
            type: 'radio',
            label: 'Do you currently smoke?',
            props: {
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
              helperText: 'Includes cigarettes, cigars, vaping',
            },
            validation: { required: true },
          },
          {
            id: 'preExisting',
            type: 'radio',
            label: 'Do you have any pre-existing medical conditions?',
            props: {
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
              helperText: 'Examples: diabetes, heart disease, cancer',
            },
            validation: { required: true },
          },
          {
            id: 'takingMedication',
            type: 'checkbox',
            label: 'Are you currently taking any prescription medications?',
            props: {
              helperText: 'Tick if you take prescribed drugs regularly',
            },
          },
        ],
        nextPage: 'review',
      },
      {
        id: 'review',
        title: 'Review & Submit',
        route: '/review',
        components: [
          {
            id: 'summarySection',
            type: 'section',
            label: 'Application Summary',
            children: [
              {
                id: 'summaryName',
                type: 'text',
                label: 'Name',
                props: {
                  helperText: '{{fullName}}',
                },
              },
              {
                id: 'summaryEmail',
                type: 'text',
                label: 'Email',
                props: {
                  helperText: '{{email}}',
                },
              },
              {
                id: 'summaryHealth',
                type: 'text',
                label: 'Health Overview',
                props: {
                  helperText:
                    'Smoking: {{smokerRadio}} • Pre-existing: {{preExisting}} • Medications: {{takingMedication}}',
                },
              },
            ],
          },
        ],
        isEndPage: true,
      },
    ],
    thankYouPage: {
      title: 'Application Received',
      message:
        'Thank you — your health questionnaire has been submitted. Our underwriting team will review your information and contact you if we need more details.',
      showRestartButton: true,
    },
  },
};

export const HealthQuestionnaireExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Health questionnaire submitted with values:', formValues);
    alert(
      'Health questionnaire submitted successfully! Check the console for details.'
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Health Questionnaire Example
        </h3>
        <p className="text-blue-700 text-sm">
          This example demonstrates template variables in text components'
          helperText properties. On the review page, the summary will show
          actual form values replacing <code>{'{{fullName}}'}</code>,{' '}
          <code>{'{{email}}'}</code>, etc.
        </p>
      </div>

      <FormRenderer
        formJson={healthQuestionnaireExample}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default HealthQuestionnaireExample;
