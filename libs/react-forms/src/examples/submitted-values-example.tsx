import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

const submittedValuesExample: FormDefinition = {
  app: {
    title: 'Submitted Values Example',
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
            id: 'lastName',
            label: 'Last Name',
            validation: {
              required: true,
              errorMessages: {
                required: 'Last name is required',
              },
            },
            props: {
              placeholder: 'Enter your last name',
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
              { label: 'Yellow', value: 'yellow' },
            ],
            validation: {
              required: true,
              errorMessages: {
                required: 'Please select your favorite color',
              },
            },
          },
          {
            type: 'checkbox',
            id: 'newsletter',
            label: 'Subscribe to newsletter',
            props: {
              helperText: 'Receive updates about new features',
            },
          },
        ],
        isEndPage: true,
      },
    ],
  },
};

export const SubmittedValuesExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Submitted values example submitted with values:', formValues);
    alert('Form submitted! Check the console to see the submitted values.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Form Settings Demo
        </h3>
        <p className="text-blue-700 text-sm mb-3">
          This form demonstrates the settings object with showFormSubmissions
          enabled. When you submit the form, the submitted values will be
          displayed below the form.
        </p>
        <div className="text-blue-700 text-sm space-y-1">
          <p>
            <strong>Features demonstrated:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Multi-step form with validation</li>
            <li>Settings object configuration</li>
            <li>Submitted values display after form submission</li>
            <li>Form resets after submission</li>
            <li>All form data is captured and displayed</li>
          </ul>
        </div>
      </div>

      <FormRenderer
        formJson={submittedValuesExample}
        onSubmit={handleSubmit}
        settings={{ showFormSubmissions: true }}
      />
    </div>
  );
};
