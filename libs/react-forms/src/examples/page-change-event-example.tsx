import React, { useState } from 'react';
import { FormRenderer } from '../lib/molecules/FormRenderer';
import {
  FormDefinition,
  PageChangeEvent,
} from '../lib/interfaces/form-interfaces';

const multiStepForm: FormDefinition = {
  app: {
    title: 'Multi-Step Form with Page Change Events',
    pages: [
      {
        id: 'personal-info',
        title: 'Personal Information',
        route: '/personal-info',
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
              inputType: 'email',
              placeholder: 'Enter your email address',
            },
          },
        ],
      },
      {
        id: 'contact-info',
        title: 'Contact Information',
        route: '/contact-info',
        components: [
          {
            type: 'input',
            id: 'phone',
            label: 'Phone Number',
            validation: { required: true },
            props: {
              inputType: 'tel',
              placeholder: 'Enter your phone number',
            },
          },
          {
            type: 'textarea',
            id: 'address',
            label: 'Address',
            validation: { required: true },
            props: {
              placeholder: 'Enter your full address',
              rows: 3,
            },
          },
        ],
      },
      {
        id: 'preferences',
        title: 'Preferences',
        route: '/preferences',
        components: [
          {
            type: 'select',
            id: 'newsletter',
            label: 'Newsletter Subscription',
            validation: { required: true },
            props: {
              options: [
                { label: 'Yes, subscribe me', value: 'yes' },
                { label: 'No, thanks', value: 'no' },
              ],
            },
          },
          {
            type: 'checkbox',
            id: 'notifications',
            label: 'Notification Preferences',
            props: {
              options: [
                { label: 'Email notifications', value: 'email' },
                { label: 'SMS notifications', value: 'sms' },
                { label: 'Push notifications', value: 'push' },
              ],
            },
          },
        ],
      },
      {
        id: 'confirmation',
        title: 'Review & Confirm',
        route: '/confirmation',
        isConfirmationPage: true,
        components: [
          {
            type: 'confirmation',
            id: 'summary',
            label: 'Form Summary',
            props: {
              confirmationSettings: {
                showSummary: true,
                groupBySection: true,
              },
            },
          },
        ],
      },
    ],
    thankYouPage: {
      title: 'Thank You!',
      message: 'Your information has been submitted successfully.',
      showRestartButton: true,
    },
  },
};

export const PageChangeEventExample: React.FC = () => {
  const [pageChangeLog, setPageChangeLog] = useState<PageChangeEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<PageChangeEvent | null>(
    null
  );

  const handlePageChange = (event: PageChangeEvent) => {
    console.log('Page change event:', event);
    setCurrentEvent(event);
    setPageChangeLog((prev) => [...prev, event]);
  };

  const handleSubmit = (formValues: Record<string, unknown>) => {
    console.log('Form submitted:', formValues);
    alert('Form submitted successfully! Check the console for form data.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Page Change Event Example</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Multi-Step Form</h2>
          <FormRenderer
            formJson={multiStepForm}
            onSubmit={handleSubmit}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Event Log Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Page Change Events</h2>

          {/* Current Event Display */}
          {currentEvent && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                Current Page:
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Page ID:</strong> {currentEvent.pageId}
                </p>
                <p>
                  <strong>Title:</strong> {currentEvent.pageTitle}
                </p>
                <p>
                  <strong>Index:</strong> {currentEvent.pageIndex + 1} of{' '}
                  {currentEvent.totalPages}
                </p>
                <p>
                  <strong>Type:</strong>
                  {currentEvent.isFirstPage && ' (First Page)'}
                  {currentEvent.isLastPage && ' (Last Page)'}
                  {currentEvent.isEndPage && ' (End Page)'}
                  {currentEvent.isConfirmationPage && ' (Confirmation Page)'}
                </p>
                {currentEvent.previousPageId && (
                  <p>
                    <strong>Previous:</strong> {currentEvent.previousPageId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Event History */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Event History:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pageChangeLog.map((event, index) => (
                <div
                  key={index}
                  className="text-xs bg-white p-2 rounded border"
                >
                  <div className="font-medium">
                    {event.pageTitle} (Step {event.pageIndex + 1})
                  </div>
                  <div className="text-gray-600">
                    {event.previousPageId
                      ? `From: ${event.previousPageId}`
                      : 'Initial page'}
                  </div>
                </div>
              ))}
            </div>
            {pageChangeLog.length === 0 && (
              <p className="text-gray-500 italic">No page changes yet</p>
            )}
          </div>

          {/* Event Details */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Event Object Structure:</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {`interface PageChangeEvent {
  pageId: string;
  pageIndex: number;
  pageTitle: string;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  isEndPage: boolean;
  isConfirmationPage: boolean;
  previousPageId?: string;
  previousPageIndex?: number;
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
