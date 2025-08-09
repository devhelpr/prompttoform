import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

// Example specifically for testing empty value handling with "-" display
const emptyValuesTestExample: FormDefinition = {
  app: {
    title: 'Empty Values Test - Dash Display',
    pages: [
      {
        id: 'test-form',
        title: 'Test Form (some fields optional)',
        route: '/test',
        components: [
          {
            id: 'requiredName',
            type: 'input',
            label: 'Name (Required)',
            props: {
              placeholder: 'Enter your name',
              inputType: 'text',
            },
            validation: { required: true },
          },
          {
            id: 'optionalEmail',
            type: 'input',
            label: 'Email (Optional)',
            props: {
              placeholder: 'Leave empty to test dash display',
              inputType: 'email',
            },
          },
          {
            id: 'optionalPhone',
            type: 'input',
            label: 'Phone (Optional)',
            props: {
              placeholder: 'Leave empty or enter just spaces',
              inputType: 'text',
            },
          },
          {
            id: 'age',
            type: 'input',
            label: 'Age (Optional)',
            props: {
              placeholder: 'Enter a number or 0',
              inputType: 'number',
            },
          },
          {
            id: 'newsletter',
            type: 'checkbox',
            label: 'Subscribe to newsletter? (Optional)',
            props: {
              helperText: 'Booleans are never empty - false shows as "No"',
            },
          },
          {
            id: 'optionalNotes',
            type: 'textarea',
            label: 'Notes (Optional)',
            props: {
              placeholder: 'Leave empty or enter whitespace only',
              rows: 3,
            },
          },
        ],
        nextPage: 'summary',
      },
      {
        id: 'summary',
        title: 'Values Summary',
        route: '/summary',
        components: [
          {
            id: 'summarySection',
            type: 'section',
            label: 'Empty Value Test Results',
            children: [
              {
                id: 'basicInfo',
                type: 'text',
                label: 'Basic Information',
                props: {
                  helperText:
                    'Name: {{requiredName}} | Email: {{optionalEmail}} | Phone: {{optionalPhone}}',
                },
              },
              {
                id: 'numericInfo',
                type: 'text',
                label: 'Numeric Values',
                props: {
                  helperText:
                    'Age: {{age}} (note: 0 should show as "0", not "-")',
                },
              },
              {
                id: 'booleanInfo',
                type: 'text',
                label: 'Boolean Values',
                props: {
                  helperText:
                    'Newsletter: {{newsletter}} (false should show as "No", not "-")',
                },
              },
              {
                id: 'textInfo',
                type: 'text',
                label: 'Text Areas',
                props: {
                  helperText: 'Notes: {{optionalNotes}}',
                },
              },
              {
                id: 'missingFields',
                type: 'text',
                label: 'Non-existent Fields',
                props: {
                  helperText:
                    'Missing Field 1: {{nonExistentField}} | Missing Field 2: {{anotherMissingField}}',
                },
              },
            ],
          },
        ],
        isEndPage: true,
      },
    ],
    thankYouPage: {
      title: 'Test Complete',
      message:
        'Empty value handling test completed. Check the summary to see how different empty states are displayed.',
      showRestartButton: true,
    },
  },
};

export const EmptyValuesTestExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Empty values test submitted with values:', formValues);
    alert(
      'Test completed! Check the console and summary page to see how empty values are handled.'
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <h3 className="text-lg font-medium text-amber-800 mb-2">
          Empty Values Test
        </h3>
        <p className="text-amber-700 text-sm mb-3">
          This form tests how different types of empty values are handled in
          template variables.
        </p>
        <div className="text-amber-700 text-sm space-y-1">
          <p>
            <strong>Expected behavior:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Empty strings → show "-"</li>
            <li>Whitespace-only strings → show "-"</li>
            <li>Missing fields → show "-"</li>
            <li>Number 0 → show "0" (not "-")</li>
            <li>Boolean false → show "No" (not "-")</li>
            <li>Null/undefined → show "-"</li>
          </ul>
        </div>
      </div>

      <FormRenderer formJson={emptyValuesTestExample} onSubmit={handleSubmit} />
    </div>
  );
};

export default EmptyValuesTestExample;
