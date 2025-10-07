import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

// Simple form definition for testing
const testForm: FormDefinition = {
  app: {
    title: 'Split Classes Example',
    pages: [
      {
        id: 'page1',
        title: 'Test Form',
        route: '/page1',
        components: [
          {
            id: 'name',
            type: 'input',
            label: 'Your Name',
            validation: { required: true },
            props: {
              placeholder: 'Enter your name',
              helperText: 'This is a test form to demonstrate split classes',
            },
          },
          {
            id: 'email',
            type: 'input',
            label: 'Email Address',
            validation: { required: true },
            props: {
              inputType: 'email',
              placeholder: 'Enter your email',
            },
          },
        ],
      },
    ],
  },
};

export const SplitClassesExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Split classes example submitted:', formValues);
    alert('Form submitted! Check the console to see the submitted values.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <h3 className="text-lg font-medium text-green-800 mb-2">
          Split Classes Example
        </h3>
        <p className="text-green-700 text-sm">
          This example demonstrates the new split class structure. You can now
          use just colorClasses to override colors while keeping default styles,
          or just styleClasses to override layout while keeping default colors,
          or both together.
        </p>
      </div>

      <FormRenderer
        formJson={testForm}
        onSubmit={handleSubmit}
        settings={{
          showFormSubmissions: true,
          // You can now use just colorClasses to override colors while keeping default styles:
          // colorClasses: {
          //   fieldLabel: 'text-blue-600',
          //   fieldInput: 'border-blue-300 focus:border-blue-500',
          //   fieldError: 'text-red-600',
          // },
          // Or just styleClasses to override layout while keeping default colors:
          // styleClasses: {
          //   fieldLabel: 'font-bold mb-2',
          //   fieldInput: 'p-3 rounded-lg',
          //   fieldError: 'mt-2 text-sm',
          // },
          // Or both together (as shown below):
          colorClasses: {
            // Color-related classes
            container: 'bg-green-50',
            header: 'bg-green-100',
            headerTitle: 'text-green-800',
            nextButton: 'bg-green-600 hover:bg-green-700 text-white',
            previousButton: 'border-green-300 text-green-700',
            fieldLabel: 'text-gray-800',
            fieldInput: 'border-green-300 focus:border-green-500',
            fieldError: 'text-red-600',
            fieldHelperText: 'text-green-600',
          },
          styleClasses: {
            // Style and layout classes
            container: 'w-full',
            header: 'p-4 rounded-lg',
            headerTitle: 'text-2xl font-bold',
            nextButton: 'px-6 py-3 rounded-lg font-medium',
            previousButton: 'px-6 py-3 border rounded-lg font-medium',
            field: 'mb-6',
            fieldLabel: 'block text-sm font-semibold mb-2',
            fieldInput:
              'w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-200',
            fieldError: 'mt-2 text-sm',
            fieldHelperText: 'mt-2 text-sm',
          },
          texts: {
            nextButton: 'Submit Form',
            submitButton: 'Submit Form',
          },
        }}
      />
    </div>
  );
};
