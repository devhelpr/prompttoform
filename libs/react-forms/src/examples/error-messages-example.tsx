import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

// Example demonstrating configurable WCAG-compatible error messages
const errorMessagesExample: FormDefinition = {
  app: {
    title: 'Error Messages Demo - WCAG Compatible',
    pages: [
      {
        id: 'validation-test',
        title: 'Validation Test with Custom Error Messages',
        route: '/test',
        components: [
          {
            id: 'fullName',
            type: 'input',
            label: 'Full Name',
            props: {
              placeholder: 'Enter your full name',
              inputType: 'text',
              helperText:
                'This field demonstrates custom required and length validation messages',
            },
            validation: {
              required: true,
              minLength: 2,
              maxLength: 50,
              errorMessages: {
                required: 'Please enter your full name to continue',
                minLength:
                  'Your name must be at least {minLength} characters long',
                maxLength: 'Your name cannot exceed {maxLength} characters',
              },
            },
          },
          {
            id: 'email',
            type: 'input',
            label: 'Email Address',
            props: {
              placeholder: 'you@example.com',
              inputType: 'email',
              helperText:
                'This field demonstrates custom email validation messages',
            },
            validation: {
              required: true,
              errorMessages: {
                required: 'Please provide your email address',
                invalidEmail:
                  'Please enter a valid email address (e.g., user@domain.com)',
              },
            },
          },
          {
            id: 'age',
            type: 'input',
            label: 'Age',
            props: {
              placeholder: 'Enter your age',
              inputType: 'number',
              helperText:
                'This field demonstrates custom number validation messages',
            },
            validation: {
              required: true,
              min: 18,
              max: 120,
              errorMessages: {
                required: 'Please enter your age',
                invalidNumber: 'Please enter a valid number',
                min: 'You must be at least {min} years old to use this form',
                max: 'Please enter a realistic age (maximum {max} years)',
              },
            },
          },
          {
            id: 'birthDate',
            type: 'date',
            label: 'Date of Birth',
            props: {
              placeholder: 'YYYY-MM-DD',
              helperText:
                'This field demonstrates custom date validation messages',
            },
            validation: {
              required: true,
              minDate: '1900-01-01',
              maxDate: '2020-12-31',
              errorMessages: {
                required: 'Please select your date of birth',
                invalidDate: 'Please enter a valid date in YYYY-MM-DD format',
                minDate: 'Date of birth must be on or after {minDate}',
                maxDate: 'Date of birth must be before {maxDate}',
              },
            },
          },
          {
            id: 'phone',
            type: 'input',
            label: 'Phone Number',
            props: {
              placeholder: '+1-555-123-4567',
              inputType: 'text',
              helperText:
                'This field demonstrates custom pattern validation messages',
            },
            validation: {
              required: true,
              pattern: '^\\+?[1-9]\\d{1,14}$',
              errorMessages: {
                required: 'Please enter your phone number',
                pattern:
                  'Please enter a valid phone number (e.g., +1-555-123-4567)',
              },
            },
          },
          {
            id: 'interests',
            type: 'checkbox',
            label: 'Interests (Select 2-4 options)',
            props: {
              options: [
                { label: 'Technology', value: 'tech' },
                { label: 'Sports', value: 'sports' },
                { label: 'Music', value: 'music' },
                { label: 'Reading', value: 'reading' },
                { label: 'Travel', value: 'travel' },
                { label: 'Cooking', value: 'cooking' },
              ],
              helperText:
                'This field demonstrates custom array validation messages',
            },
            validation: {
              required: true,
              minItems: 2,
              maxItems: 4,
              errorMessages: {
                required: 'Please select at least some interests',
                minItems: 'Please select at least {minItems} interests',
                maxItems: 'Please select no more than {maxItems} interests',
              },
            },
          },
          {
            id: 'bio',
            type: 'textarea',
            label: 'Bio',
            props: {
              placeholder: 'Tell us about yourself...',
              rows: 4,
              helperText:
                'This field demonstrates custom length validation messages',
            },
            validation: {
              required: true,
              minLength: 10,
              maxLength: 500,
              errorMessages: {
                required: 'Please tell us about yourself',
                minLength:
                  'Your bio must be at least {minLength} characters long',
                maxLength: 'Your bio cannot exceed {maxLength} characters',
              },
            },
          },
        ],
        nextPage: 'summary',
      },
      {
        id: 'summary',
        title: 'Form Summary',
        route: '/summary',
        components: [
          {
            id: 'summarySection',
            type: 'section',
            label: 'Your Information',
            children: [
              {
                id: 'nameSummary',
                type: 'text',
                label: 'Name',
                props: {
                  helperText: '{{fullName}}',
                },
              },
              {
                id: 'emailSummary',
                type: 'text',
                label: 'Email',
                props: {
                  helperText: '{{email}}',
                },
              },
              {
                id: 'ageSummary',
                type: 'text',
                label: 'Age',
                props: {
                  helperText: '{{age}}',
                },
              },
            ],
          },
        ],
        isEndPage: true,
      },
    ],
    thankYouPage: {
      title: 'Thank You!',
      message:
        'Your form has been submitted successfully. The error messages you saw were WCAG-compatible and configurable.',
      showRestartButton: true,
    },
  },
};

export const ErrorMessagesExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Error messages demo submitted with values:', formValues);
    alert('Form submitted! Check the console to see the submitted values.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          WCAG-Compatible Error Messages Demo
        </h3>
        <p className="text-blue-700 text-sm mb-3">
          This form demonstrates configurable, accessible error messages that
          follow WCAG guidelines.
        </p>
        <div className="text-blue-700 text-sm space-y-1">
          <p>
            <strong>Features demonstrated:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Custom error messages for each validation rule</li>
            <li>
              Placeholder replacement (e.g., {'{minLength}'} → actual value)
            </li>
            <li>WCAG-compatible language and tone</li>
            <li>Specific error messages for different input types</li>
            <li>Accessible error descriptions</li>
          </ul>
        </div>
      </div>

      <FormRenderer formJson={errorMessagesExample} onSubmit={handleSubmit} />
    </div>
  );
};

export default ErrorMessagesExample;
