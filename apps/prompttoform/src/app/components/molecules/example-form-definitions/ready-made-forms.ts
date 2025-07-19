export interface ReadyMadeForm {
  name: string;
  description: string;
  json: string;
  prompt?: string;
}

export const READY_MADE_FORMS: ReadyMadeForm[] = [
  {
    name: 'Simple Contact Form',
    description: 'Basic contact form with name, email, and message',
    prompt:
      'A simple contact form with name, email, subject, and message fields',
    json: JSON.stringify(
      {
        app: {
          pages: [
            {
              id: 'contact-page',
              title: 'Contact Us',
              fields: [
                {
                  id: 'name',
                  type: 'text',
                  label: 'Full Name',
                  required: true,
                  placeholder: 'Enter your full name',
                },
                {
                  id: 'email',
                  type: 'email',
                  label: 'Email Address',
                  required: true,
                  placeholder: 'Enter your email address',
                },
                {
                  id: 'subject',
                  type: 'text',
                  label: 'Subject',
                  required: true,
                  placeholder: 'What is this about?',
                },
                {
                  id: 'message',
                  type: 'textarea',
                  label: 'Message',
                  required: true,
                  placeholder: 'Enter your message here...',
                  rows: 4,
                },
              ],
            },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    name: 'User Registration Form',
    description: 'Multi-step registration with validation',
    prompt:
      'A user registration form with name, email, password, confirm password, and terms acceptance',
    json: JSON.stringify(
      {
        app: {
          pages: [
            {
              id: 'personal-info',
              title: 'Personal Information',
              fields: [
                {
                  id: 'firstName',
                  type: 'text',
                  label: 'First Name',
                  required: true,
                  placeholder: 'Enter your first name',
                },
                {
                  id: 'lastName',
                  type: 'text',
                  label: 'Last Name',
                  required: true,
                  placeholder: 'Enter your last name',
                },
                {
                  id: 'email',
                  type: 'email',
                  label: 'Email Address',
                  required: true,
                  placeholder: 'Enter your email address',
                },
                {
                  id: 'phone',
                  type: 'tel',
                  label: 'Phone Number',
                  placeholder: 'Enter your phone number',
                },
              ],
            },
            {
              id: 'account-setup',
              title: 'Account Setup',
              fields: [
                {
                  id: 'username',
                  type: 'text',
                  label: 'Username',
                  required: true,
                  placeholder: 'Choose a username',
                },
                {
                  id: 'password',
                  type: 'password',
                  label: 'Password',
                  required: true,
                  placeholder: 'Create a strong password',
                },
                {
                  id: 'confirmPassword',
                  type: 'password',
                  label: 'Confirm Password',
                  required: true,
                  placeholder: 'Confirm your password',
                },
              ],
            },
            {
              id: 'terms',
              title: 'Terms & Conditions',
              fields: [
                {
                  id: 'termsAccepted',
                  type: 'checkbox',
                  label: 'I agree to the Terms and Conditions',
                  required: true,
                },
                {
                  id: 'newsletter',
                  type: 'checkbox',
                  label: 'Subscribe to our newsletter',
                  required: false,
                },
              ],
            },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    name: 'Health Check Wizard',
    description: 'Interactive health assessment with branching logic',
    prompt:
      'A health check wizard asking questions and branching based on user answers. Make sure that if no doctor visit is needed that this is shown with a disclaimer',
    json: JSON.stringify(
      {
        app: {
          pages: [
            {
              id: 'symptoms',
              title: 'Health Assessment',
              fields: [
                {
                  id: 'age',
                  type: 'number',
                  label: 'What is your age?',
                  required: true,
                  placeholder: 'Enter your age',
                },
                {
                  id: 'symptoms',
                  type: 'select',
                  label: 'What symptoms are you experiencing?',
                  required: true,
                  options: [
                    { value: 'none', label: 'No symptoms' },
                    { value: 'mild', label: 'Mild symptoms (cough, fever)' },
                    {
                      value: 'severe',
                      label:
                        'Severe symptoms (difficulty breathing, chest pain)',
                    },
                  ],
                },
                {
                  id: 'duration',
                  type: 'select',
                  label: 'How long have you had these symptoms?',
                  required: true,
                  options: [
                    { value: 'less-than-24h', label: 'Less than 24 hours' },
                    { value: '1-3-days', label: '1-3 days' },
                    { value: 'more-than-3-days', label: 'More than 3 days' },
                  ],
                },
              ],
            },
            {
              id: 'recommendation',
              title: 'Health Recommendation',
              fields: [
                {
                  id: 'recommendation',
                  type: 'section',
                  label: 'Based on your symptoms, here is our recommendation:',
                  content:
                    'This is a dynamic recommendation that will be shown based on your answers.',
                },
              ],
            },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    name: 'Job Application Form',
    description: 'Professional job application with multiple sections',
    prompt:
      'A 3-step job application form with personal details, work experience, and references',
    json: JSON.stringify(
      {
        app: {
          pages: [
            {
              id: 'personal-details',
              title: 'Personal Details',
              fields: [
                {
                  id: 'fullName',
                  type: 'text',
                  label: 'Full Name',
                  required: true,
                  placeholder: 'Enter your full name',
                },
                {
                  id: 'email',
                  type: 'email',
                  label: 'Email Address',
                  required: true,
                  placeholder: 'Enter your email address',
                },
                {
                  id: 'phone',
                  type: 'tel',
                  label: 'Phone Number',
                  required: true,
                  placeholder: 'Enter your phone number',
                },
                {
                  id: 'address',
                  type: 'textarea',
                  label: 'Current Address',
                  required: true,
                  placeholder: 'Enter your current address',
                  rows: 3,
                },
              ],
            },
            {
              id: 'work-experience',
              title: 'Work Experience',
              fields: [
                {
                  id: 'currentPosition',
                  type: 'text',
                  label: 'Current/Last Position',
                  required: true,
                  placeholder: 'Enter your current or last job title',
                },
                {
                  id: 'company',
                  type: 'text',
                  label: 'Company',
                  required: true,
                  placeholder: 'Enter company name',
                },
                {
                  id: 'experience',
                  type: 'textarea',
                  label: 'Describe your relevant experience',
                  required: true,
                  placeholder: 'Describe your experience and achievements...',
                  rows: 4,
                },
                {
                  id: 'skills',
                  type: 'textarea',
                  label: 'Key Skills',
                  required: true,
                  placeholder: 'List your key skills and competencies',
                  rows: 3,
                },
              ],
            },
            {
              id: 'references',
              title: 'References',
              fields: [
                {
                  id: 'reference1',
                  type: 'text',
                  label: 'Reference 1 - Name',
                  required: true,
                  placeholder: 'Enter reference name',
                },
                {
                  id: 'reference1Contact',
                  type: 'text',
                  label: 'Reference 1 - Contact',
                  required: true,
                  placeholder: 'Enter reference contact information',
                },
                {
                  id: 'reference2',
                  type: 'text',
                  label: 'Reference 2 - Name',
                  placeholder: 'Enter reference name (optional)',
                },
                {
                  id: 'reference2Contact',
                  type: 'text',
                  label: 'Reference 2 - Contact',
                  placeholder: 'Enter reference contact information (optional)',
                },
              ],
            },
          ],
        },
      },
      null,
      2
    ),
  },
];
