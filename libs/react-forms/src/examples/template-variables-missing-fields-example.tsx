import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

// Example demonstrating dash replacement for missing template variables
const templateVariablesMissingFieldsExample: FormDefinition = {
  app: {
    title: 'Template Variables - Missing Fields Demo',
    pages: [
      {
        id: 'basic-info',
        title: 'Basic Information',
        route: '/basic',
        components: [
          {
            id: 'name',
            type: 'input',
            label: 'Name',
            props: {
              placeholder: 'Enter your name',
              inputType: 'text',
            },
            validation: { required: true },
          },
          {
            id: 'email',
            type: 'input',
            label: 'Email (Optional)',
            props: {
              placeholder: 'Enter your email',
              inputType: 'email',
            },
          },
        ],
        nextPage: 'summary',
      },
      {
        id: 'summary',
        title: 'Summary',
        route: '/summary',
        components: [
          {
            id: 'summarySection',
            type: 'section',
            label: 'Information Summary',
            children: [
              {
                id: 'basicInfo',
                type: 'text',
                label: 'Basic Information',
                props: {
                  helperText:
                    'Name: {{name}} | Email: {{email}} | Phone: {{phone}}',
                },
              },
              {
                id: 'contactInfo',
                type: 'text',
                label: 'Contact Details',
                props: {
                  helperText:
                    'Primary: {{email}} | Secondary: {{alternateEmail}} | Mobile: {{mobile}}',
                },
              },
              {
                id: 'nestedExample',
                type: 'text',
                label: 'Nested Path Example',
                props: {
                  helperText:
                    'User: {{user.fullName}} | Address: {{user.address.city}}, {{user.address.state}}',
                },
              },
            ],
          },
        ],
        isEndPage: true,
      },
    ],
    thankYouPage: {
      title: 'Demo Complete',
      message:
        'This demo shows how missing template variables are replaced with "-" for a clean appearance.',
      showRestartButton: true,
    },
  },
};

export const TemplateVariablesMissingFieldsExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Template variables demo submitted with values:', formValues);
    alert(
      'Demo completed! Notice how missing fields show as "-" in the summary.'
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Missing Fields Demo
        </h3>
        <p className="text-gray-700 text-sm mb-2">
          This example shows how template variables behave when referenced
          fields don't exist or are empty.
        </p>
        <ul className="text-gray-600 text-sm space-y-1">
          <li>
            • <code>{'{{name}}'}</code> - Will show the entered name
          </li>
          <li>
            • <code>{'{{email}}'}</code> - Will show email if entered, or "-" if
            empty
          </li>
          <li>
            • <code>{'{{phone}}'}</code> - Will show "-" (field doesn't exist)
          </li>
          <li>
            • <code>{'{{user.fullName}}'}</code> - Will show "-" (nested path
            doesn't exist)
          </li>
        </ul>
      </div>

      <FormRenderer
        formJson={templateVariablesMissingFieldsExample}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default TemplateVariablesMissingFieldsExample;
