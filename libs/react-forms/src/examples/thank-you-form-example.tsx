import { FormDefinition } from '../lib/interfaces/form-interfaces';

export const thankYouFormExample: FormDefinition = {
  app: {
    title: 'Customer Feedback Form with Thank You Page',
    pages: [
      {
        id: 'feedback-page',
        title: 'Share Your Experience',
        route: '/feedback',
        layout: 'vertical',
        isEndPage: true,
        components: [
          {
            type: 'text',
            id: 'intro-text',
            props: {
              content:
                'We value your feedback. Please take a moment to complete this form and help us improve our services.',
            },
          },
          {
            type: 'form',
            id: 'feedback-form',
            label: 'Feedback Form',
            children: [
              {
                type: 'section',
                id: 'personal-info',
                label: 'Personal Information',
                children: [
                  {
                    type: 'input',
                    id: 'name',
                    label: 'Full Name',
                    props: {
                      placeholder: 'John Doe',
                    },
                    validation: {
                      required: true,
                      minLength: 2,
                    },
                  },
                  {
                    type: 'input',
                    id: 'email',
                    label: 'Email Address',
                    props: {
                      inputType: 'email',
                      placeholder: 'john.doe@example.com',
                      helperText:
                        "We'll never share your email with anyone else.",
                    },
                    validation: {
                      required: true,
                      pattern:
                        '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                    },
                  },
                ],
              },
              {
                type: 'section',
                id: 'feedback-details',
                label: 'Your Feedback',
                children: [
                  {
                    type: 'select',
                    id: 'service-type',
                    label: 'Which service are you providing feedback for?',
                    props: {
                      options: [
                        { label: 'Customer Support', value: 'support' },
                        { label: 'Product Quality', value: 'product' },
                        { label: 'Website Experience', value: 'website' },
                        { label: 'Billing & Payments', value: 'billing' },
                        { label: 'Other', value: 'other' },
                      ],
                    },
                    validation: {
                      required: true,
                    },
                  },
                  {
                    type: 'radio',
                    id: 'satisfaction',
                    label: 'How satisfied are you with our service?',
                    props: {
                      options: [
                        { label: 'Very Satisfied', value: '5' },
                        { label: 'Satisfied', value: '4' },
                        { label: 'Neutral', value: '3' },
                        { label: 'Dissatisfied', value: '2' },
                        { label: 'Very Dissatisfied', value: '1' },
                      ],
                    },
                    validation: {
                      required: true,
                    },
                  },
                  {
                    type: 'textarea',
                    id: 'comments',
                    label: 'Please share any additional comments',
                    props: {
                      placeholder: 'Share your thoughts here...',
                      rows: 4,
                    },
                    validation: {
                      minLength: 10,
                      maxLength: 500,
                    },
                  },
                  {
                    type: 'checkbox',
                    id: 'contact-permission',
                    label: 'You may contact me about my feedback',
                    validation: {
                      required: true,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    thankYouPage: {
      title: 'Thank You for Your Feedback!',
      message:
        'Your feedback has been successfully submitted. We appreciate you taking the time to share your experience with us. Our team will review your comments and use them to improve our services.',
      components: [
        {
          type: 'text',
          id: 'next-steps',
          props: {
            content:
              "What happens next? We'll review your feedback and may reach out to you if you provided contact permission.",
          },
        },
        {
          type: 'html',
          id: 'contact-info',
          props: {
            content: `
              <div class="bg-blue-50 p-4 rounded-md">
                <h3 class="font-semibold text-blue-800 mb-2">Need immediate assistance?</h3>
                <p class="text-blue-700">Contact our support team at <a href="mailto:support@example.com" class="underline">support@example.com</a> or call us at <a href="tel:+1-555-123-4567" class="underline">+1 (555) 123-4567</a></p>
              </div>
            `,
          },
        },
      ],
      showRestartButton: true,
      customActions: [
        {
          label: 'Visit Our Website',
          action: 'custom',
          customAction: 'visit-website',
          className: 'bg-green-600 text-white hover:bg-green-700',
        },
        {
          label: 'Download Receipt',
          action: 'custom',
          customAction: 'download-receipt',
          className: 'bg-gray-600 text-white hover:bg-gray-700',
        },
      ],
    },
  },
};
