import React, { useState } from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

// Example form definitions
const singlePageForm: FormDefinition = {
  app: {
    title: 'Single Page Form Example',
    pages: [
      {
        id: 'page1',
        title: 'Personal Information',
        route: '/personal-info',
        components: [
          {
            type: 'input',
            id: 'name',
            label: 'Full Name',
            validation: { required: true },
            props: { placeholder: 'Enter your full name' },
          },
          {
            type: 'input',
            id: 'email',
            label: 'Email Address',
            validation: { required: true },
            props: { type: 'email', placeholder: 'Enter your email' },
          },
          {
            type: 'textarea',
            id: 'bio',
            label: 'Bio',
            props: { placeholder: 'Tell us about yourself', rows: 4 },
          },
        ],
      },
    ],
  },
};

const multiPageForm: FormDefinition = {
  app: {
    title: 'Multi Page Form Example',
    pages: [
      {
        id: 'page1',
        title: 'Personal Information',
        route: '/personal-info',
        components: [
          {
            type: 'input',
            id: 'name',
            label: 'Full Name',
            validation: { required: true },
            props: { placeholder: 'Enter your full name' },
          },
          {
            type: 'input',
            id: 'email',
            label: 'Email Address',
            validation: { required: true },
            props: { type: 'email', placeholder: 'Enter your email' },
          },
        ],
      },
      {
        id: 'page2',
        title: 'Preferences',
        route: '/preferences',
        components: [
          {
            type: 'select',
            id: 'country',
            label: 'Country',
            props: {
              options: [
                { label: 'United States', value: 'us' },
                { label: 'Canada', value: 'ca' },
                { label: 'United Kingdom', value: 'uk' },
              ],
            },
          },
          {
            type: 'checkbox',
            id: 'newsletter',
            label: 'Subscribe to newsletter',
          },
        ],
      },
      {
        id: 'page3',
        title: 'Confirmation',
        route: '/confirmation',
        components: [
          {
            type: 'text',
            id: 'confirmation',
            label: 'Thank you for your submission!',
            props: { content: 'Your form has been submitted successfully.' },
          },
        ],
        isEndPage: true,
      },
    ],
  },
};

export const DisabledFormExample: React.FC = () => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [currentForm, setCurrentForm] = useState<'single' | 'multi'>('single');

  const handleSubmit = (formValues: any) => {
    console.log('Form submitted:', formValues);
    alert('Form submitted successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">FormRenderer Examples</h1>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDisabled}
                onChange={(e) => setIsDisabled(e.target.checked)}
                className="mr-2"
              />
              Disable Form
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <label className="font-medium">Form Type:</label>
            <select
              value={currentForm}
              onChange={(e) =>
                setCurrentForm(e.target.value as 'single' | 'multi')
              }
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="single">Single Page Form</option>
              <option value="multi">Multi Page Form</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-6">
          <FormRenderer
            formJson={currentForm === 'single' ? singlePageForm : multiPageForm}
            onSubmit={handleSubmit}
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Features Demonstrated:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <strong>Disabled State:</strong> When checked, all form fields are
            disabled and navigation buttons are hidden
          </li>
          <li>
            <strong>Step Indicator:</strong> Only shows for multi-page forms
            (hidden for single-page forms)
          </li>
          <li>
            <strong>Form Types:</strong> Switch between single-page and
            multi-page forms to see different behaviors
          </li>
        </ul>
      </div>
    </div>
  );
};
