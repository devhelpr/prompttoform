import React from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import { FormDefinition } from '../lib/interfaces/form-interfaces';

const confirmationFormExample: FormDefinition = {
  app: {
    title: 'User Registration with Confirmation',
    pages: [
      {
        id: 'personal-info',
        title: 'Personal Information',
        route: '/personal',
        components: [
          {
            type: 'input',
            id: 'firstName',
            label: 'First Name',
            validation: { required: true },
            props: { placeholder: 'Enter your first name' },
          },
          {
            type: 'input',
            id: 'lastName',
            label: 'Last Name',
            validation: { required: true },
            props: { placeholder: 'Enter your last name' },
          },
          {
            type: 'input',
            id: 'email',
            label: 'Email Address',
            validation: { required: true },
            props: {
              placeholder: 'Enter your email',
              inputType: 'email',
            },
          },
          {
            type: 'date',
            id: 'birthDate',
            label: 'Date of Birth',
            validation: { required: true },
          },
        ],
        nextPage: 'preferences',
      },
      {
        id: 'preferences',
        title: 'Preferences',
        route: '/preferences',
        components: [
          {
            type: 'radio',
            id: 'notifications',
            label: 'Email Notifications',
            validation: { required: true },
            options: [
              { label: 'Yes, send me updates', value: 'yes' },
              { label: 'No, do not send notifications', value: 'no' },
            ],
          },
          {
            type: 'checkbox',
            id: 'interests',
            label: 'Interests',
            options: [
              { label: 'Technology', value: 'tech' },
              { label: 'Sports', value: 'sports' },
              { label: 'Music', value: 'music' },
              { label: 'Travel', value: 'travel' },
            ],
          },
          {
            type: 'select',
            id: 'country',
            label: 'Country',
            validation: { required: true },
            options: [
              { label: 'United States', value: 'us' },
              { label: 'Canada', value: 'ca' },
              { label: 'United Kingdom', value: 'uk' },
              { label: 'Australia', value: 'au' },
            ],
          },
        ],
        nextPage: 'confirmation',
      },
      {
        id: 'confirmation',
        title: 'Review & Confirm',
        route: '/confirmation',
        isConfirmationPage: true,
        components: [
          {
            type: 'confirmation',
            id: 'form-summary',
            label: 'Form Summary',
            props: {
              confirmationSettings: {
                showSummary: true,
                groupBySection: true,
                customTitle: 'Please Review Your Registration Details',
                customMessage:
                  'Please verify that all information is correct before submitting your registration.',
              },
            },
          },
        ],
      },
    ],
    thankYouPage: {
      title: 'Registration Complete!',
      message: 'Thank you for registering. We have received your information.',
      showRestartButton: true,
    },
  },
};

export const ConfirmationFormExample: React.FC = () => {
  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Form submitted with values:', formValues);
    alert('Form submitted successfully! Check the console for details.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <FormRenderer
        formJson={confirmationFormExample}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ConfirmationFormExample;
