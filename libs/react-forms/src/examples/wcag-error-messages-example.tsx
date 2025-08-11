import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

// Example demonstrating WCAG-compliant error messages with field-specific context
const wcagErrorMessagesExample: FormDefinition = {
  app: {
    title: 'WCAG-Compliant Error Messages Demo',
    pages: [
      {
        id: 'wcag-test',
        title: 'WCAG Error Messages Test',
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
                'This field demonstrates field-specific error messages',
            },
            validation: {
              required: true,
              minLength: 2,
              maxLength: 50,
              errorMessages: {
                required: 'Full Name is required to continue',
                minLength:
                  'Full Name must be at least {minLength} characters long',
                maxLength: 'Full Name cannot exceed {maxLength} characters',
              },
            },
          },
          {
            id: 'emailAddress',
            type: 'input',
            label: 'Email Address',
            props: {
              placeholder: 'you@example.com',
              inputType: 'email',
              helperText:
                'This field demonstrates email-specific error messages',
            },
            validation: {
              required: true,
              errorMessages: {
                required: 'Email Address is required for account creation',
                invalidEmail:
                  'Please enter a valid Email Address (e.g., user@domain.com)',
              },
            },
          },
          {
            id: 'userAge',
            type: 'input',
            label: 'Age',
            props: {
              placeholder: 'Enter your age',
              inputType: 'number',
              helperText:
                'This field demonstrates number-specific error messages',
            },
            validation: {
              required: true,
              min: 18,
              max: 120,
              errorMessages: {
                required: 'Age is required for age verification',
                invalidNumber: 'Please enter a valid number for Age',
                min: 'You must be at least {min} years old to use this form',
                max: 'Please enter a realistic Age (maximum {max} years)',
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
                'This field demonstrates date-specific error messages',
            },
            validation: {
              required: true,
              minDate: '1900-01-01',
              maxDate: '2020-12-31',
              errorMessages: {
                required: 'Date of Birth is required for verification',
                invalidDate:
                  'Please enter a valid Date of Birth in YYYY-MM-DD format',
                minDate: 'Date of Birth must be on or after {minDate}',
                maxDate: 'Date of Birth must be before {maxDate}',
              },
            },
          },
          {
            id: 'phoneNumber',
            type: 'input',
            label: 'Phone Number',
            props: {
              placeholder: '+1-555-123-4567',
              inputType: 'text',
              helperText:
                'This field demonstrates pattern validation with field context',
            },
            validation: {
              required: true,
              pattern: '^\\+?[1-9]\\d{1,14}$',
              errorMessages: {
                required: 'Phone Number is required for contact purposes',
                pattern:
                  'Please enter a valid Phone Number (e.g., +1-555-123-4567)',
              },
            },
          },
          {
            id: 'userInterests',
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
                'This field demonstrates array validation with field context',
            },
            validation: {
              required: true,
              minItems: 2,
              maxItems: 4,
              errorMessages: {
                required: 'Please select at least some Interests',
                minItems: 'Please select at least {minItems} Interests',
                maxItems: 'Please select no more than {maxItems} Interests',
              },
            },
          },
          {
            id: 'userBio',
            type: 'textarea',
            label: 'Bio',
            props: {
              placeholder: 'Tell us about yourself...',
              rows: 4,
              helperText:
                'This field demonstrates length validation with field context',
            },
            validation: {
              required: true,
              minLength: 10,
              maxLength: 500,
              errorMessages: {
                required: 'Bio is required to complete your profile',
                minLength: 'Bio must be at least {minLength} characters long',
                maxLength: 'Bio cannot exceed {maxLength} characters',
              },
            },
          },
          {
            id: 'userRole',
            type: 'radio',
            label: 'Role',
            props: {
              options: [
                { label: 'Student', value: 'student' },
                { label: 'Professional', value: 'professional' },
                { label: 'Retired', value: 'retired' },
                { label: 'Other', value: 'other' },
              ],
              helperText: 'This field demonstrates radio button validation',
            },
            validation: {
              required: true,
              errorMessages: {
                required: 'Role selection is required',
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
                  helperText: '{{emailAddress}}',
                },
              },
              {
                id: 'ageSummary',
                type: 'text',
                label: 'Age',
                props: {
                  helperText: '{{userAge}}',
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
        'Your form has been submitted successfully. All error messages were WCAG-compliant with field-specific context and proper ARIA attributes.',
      showRestartButton: true,
    },
  },
};

export const WCAGErrorMessagesExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('WCAG error messages demo submitted with values:', formValues);
    alert('Form submitted! Check the console to see the submitted values.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <h3 className="text-lg font-medium text-green-800 mb-2">
          WCAG-Compliant Error Messages Demo
        </h3>
        <p className="text-green-700 text-sm mb-3">
          This form demonstrates fully WCAG-compliant error messages with
          field-specific context and proper ARIA attributes.
        </p>
        <div className="text-green-700 text-sm space-y-1">
          <p>
            <strong>WCAG Features demonstrated:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>
              <strong>Field-specific context</strong>: "Email Address is
              required" instead of "This field is required"
            </li>
            <li>
              <strong>ARIA attributes</strong>: aria-required, aria-invalid,
              aria-describedby
            </li>
            <li>
              <strong>Live regions</strong>: role="alert" and aria-live="polite"
              for dynamic announcements
            </li>
            <li>
              <strong>Proper associations</strong>: Error messages linked to
              their fields
            </li>
            <li>
              <strong>Screen reader friendly</strong>: Required indicators
              hidden from screen readers
            </li>
            <li>
              <strong>Group semantics</strong>: Radio and checkbox groups with
              proper ARIA roles
            </li>
          </ul>
        </div>
        <div className="mt-3 p-3 bg-green-100 rounded text-green-800 text-sm">
          <p>
            <strong>Test with screen reader:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 mt-1">
            <li>Try leaving required fields empty and tabbing away</li>
            <li>Notice how error messages include the field name</li>
            <li>Observe that asterisks (*) are not announced</li>
            <li>
              Check that error messages are properly associated with fields
            </li>
          </ul>
        </div>
      </div>

      <FormRenderer
        formJson={wcagErrorMessagesExample}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default WCAGErrorMessagesExample;
