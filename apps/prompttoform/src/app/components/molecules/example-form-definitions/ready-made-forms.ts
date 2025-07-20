import { FormDefinition } from '@devhelpr/react-forms';

export interface ReadyMadeForm {
  name: string;
  description: string;
  json: FormDefinition;
  prompt?: string;
}

export const READY_MADE_FORMS: ReadyMadeForm[] = [
  {
    name: 'Simple Contact Form',
    description: 'Basic contact form with name, email, and message',
    prompt:
      'A simple contact form with name, email, subject, and message fields',
    json: {
      app: {
        title: 'Contact Us',
        pages: [
          {
            id: 'contact-page',
            title: 'Contact Us',
            route: '/contact',
            layout: 'vertical',
            components: [
              {
                id: 'contact-form',
                type: 'form',
                label: 'Contact Form',
                children: [
                  {
                    id: 'name',
                    type: 'input',
                    label: 'Full Name',
                    props: {
                      placeholder: 'Enter your full name',
                      inputType: 'text',
                    },
                    validation: {
                      required: true,
                      minLength: 2,
                    },
                  },
                  {
                    id: 'email',
                    type: 'input',
                    label: 'Email Address',
                    props: {
                      placeholder: 'Enter your email address',
                      inputType: 'email',
                    },
                    validation: {
                      required: true,
                      pattern: '^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
                    },
                  },
                  {
                    id: 'subject',
                    type: 'input',
                    label: 'Subject',
                    props: {
                      placeholder: 'What is this about?',
                      inputType: 'text',
                    },
                    validation: {
                      required: true,
                      minLength: 2,
                    },
                  },
                  {
                    id: 'message',
                    type: 'textarea',
                    label: 'Message',
                    props: {
                      placeholder: 'Enter your message here...',
                      rows: 4,
                    },
                    validation: {
                      required: true,
                      minLength: 5,
                    },
                  },
                  {
                    id: 'submit-btn',
                    type: 'button',
                    label: 'Send Message',
                    props: {
                      className: 'primary',
                    },
                  },
                ],
              },
            ],
            isEndPage: true,
          },
        ],
        dataSources: [
          {
            id: 'contactFormSubmit',
            type: 'rest',
            url: 'https://api.example.com/contact',
            method: 'POST',
            responseMapping: {},
          },
        ],
      },
    },
  },
  {
    name: 'User Registration Form',
    description: 'Multi-step registration with validation',
    prompt:
      'A user registration form with name, email, password, confirm password, and terms acceptance',
    json: {
      app: {
        title: 'User Registration',
        pages: [
          {
            id: 'personal-info',
            title: 'Personal Information',
            route: '/personal-info',
            layout: 'vertical',
            components: [
              {
                id: 'firstName',
                type: 'input',
                label: 'First Name',
                props: {
                  placeholder: 'Enter your first name',
                },
                validation: {
                  required: true,
                  minLength: 1,
                },
              },
              {
                id: 'lastName',
                type: 'input',
                label: 'Last Name',
                props: {
                  placeholder: 'Enter your last name',
                },
                validation: {
                  required: true,
                  minLength: 1,
                },
              },
              {
                id: 'email',
                type: 'input',
                label: 'Email Address',
                props: {
                  placeholder: 'Enter your email address',
                  inputType: 'email',
                },
                validation: {
                  required: true,
                  pattern: '^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
                },
              },
              {
                id: 'phone',
                type: 'input',
                label: 'Phone Number',
                props: {
                  placeholder: 'Enter your phone number',
                  inputType: 'text',
                },
              },
              {
                id: 'next-personal-info',
                type: 'button',
                label: 'Next',
                props: {
                  className: 'primary',
                },
              },
            ],
            nextPage: 'account-setup',
          },
          {
            id: 'account-setup',
            title: 'Account Setup',
            route: '/account-setup',
            layout: 'vertical',
            components: [
              {
                id: 'username',
                type: 'input',
                label: 'Username',
                props: {
                  placeholder: 'Choose a username',
                },
                validation: {
                  required: true,
                  minLength: 3,
                },
              },
              {
                id: 'password',
                type: 'input',
                label: 'Password',
                props: {
                  placeholder: 'Create a strong password',
                  inputType: 'password',
                },
                validation: {
                  required: true,
                  minLength: 8,
                },
              },
              {
                id: 'confirmPassword',
                type: 'input',
                label: 'Confirm Password',
                props: {
                  placeholder: 'Confirm your password',
                  inputType: 'password',
                },
                validation: {
                  required: true,
                  minLength: 8,
                },
              },
              {
                id: 'next-account-setup',
                type: 'button',
                label: 'Next',
                props: {
                  className: 'primary',
                },
              },
            ],
            nextPage: 'terms',
          },
          {
            id: 'terms',
            title: 'Terms & Conditions',
            route: '/terms',
            layout: 'vertical',
            components: [
              {
                id: 'termsText',
                type: 'text',
                label: 'Terms and Conditions',
                props: {
                  helperText:
                    'Please read and accept our terms and conditions to proceed.',
                },
              },
              {
                id: 'termsAccepted',
                type: 'checkbox',
                label: 'I agree to the Terms and Conditions',
                validation: {
                  required: true,
                },
              },
              {
                id: 'newsletter',
                type: 'checkbox',
                label: 'Subscribe to our newsletter',
              },
              {
                id: 'submit-registration',
                type: 'button',
                label: 'Submit',
                props: {
                  className: 'primary',
                },
              },
            ],
            isEndPage: true,
          },
        ],
        dataSources: [
          {
            id: 'submitRegistration',
            type: 'rest',
            url: 'https://api.example.com/register',
            method: 'POST',
            params: {},
            responseMapping: {},
          },
        ],
      },
    },
  },
  {
    name: 'Health Check Wizard',
    description: 'Interactive health assessment with branching logic',
    prompt:
      'A health check wizard asking questions and branching based on user answers. Make sure that if no doctor visit is needed that this is shown with a disclaimer',
    json: {
      app: {
        title: 'Health Check Wizard',
        pages: [
          {
            id: 'start',
            title: 'Welcome',
            route: '/',
            layout: 'vertical',
            components: [
              {
                id: 'welcomeText',
                type: 'text',
                label: 'Welcome',
                props: {
                  helperText:
                    'This wizard will help you determine if you need to see a doctor based on your symptoms.',
                },
              },
              {
                id: 'startButton',
                type: 'button',
                label: 'Start Health Check',
                props: {},
              },
            ],
            nextPage: 'symptom',
          },
          {
            id: 'symptom',
            title: 'Do you have any of these symptoms?',
            route: '/symptom',
            layout: 'vertical',
            components: [
              {
                id: 'symptomRadio',
                type: 'radio',
                label: 'Select your symptom',
                props: {
                  options: [
                    {
                      label: 'Fever',
                      value: 'fever',
                    },
                    {
                      label: 'Cough',
                      value: 'cough',
                    },
                    {
                      label: 'Shortness of breath',
                      value: 'breath',
                    },
                    {
                      label: 'None of the above',
                      value: 'none',
                    },
                  ],
                },
                validation: {
                  required: true,
                },
              },
            ],
            branches: [
              {
                condition: {
                  field: 'symptomRadio',
                  operator: '==',
                  value: 'none',
                },
                nextPage: 'noDoctor',
              },
            ],
            nextPage: 'duration',
          },
          {
            id: 'duration',
            title: 'How long have you had this symptom?',
            route: '/duration',
            layout: 'vertical',
            components: [
              {
                id: 'durationSelect',
                type: 'select',
                label: 'Duration',
                props: {
                  options: [
                    {
                      label: 'Less than 3 days',
                      value: 'short',
                    },
                    {
                      label: '3 days or more',
                      value: 'long',
                    },
                  ],
                },
                validation: {
                  required: true,
                },
              },
            ],
            branches: [
              {
                condition: {
                  field: 'durationSelect',
                  operator: '==',
                  value: 'long',
                },
                nextPage: 'doctor',
              },
            ],
            nextPage: 'severity',
          },
          {
            id: 'severity',
            title: 'How severe is your symptom?',
            route: '/severity',
            layout: 'vertical',
            components: [
              {
                id: 'severityRadio',
                type: 'radio',
                label: 'Severity',
                props: {
                  options: [
                    {
                      label: 'Mild',
                      value: 'mild',
                    },
                    {
                      label: 'Moderate',
                      value: 'moderate',
                    },
                    {
                      label: 'Severe',
                      value: 'severe',
                    },
                  ],
                },
                validation: {
                  required: true,
                },
              },
            ],
            branches: [
              {
                condition: {
                  field: 'severityRadio',
                  operator: '==',
                  value: 'severe',
                },
                nextPage: 'doctor',
              },
            ],
            nextPage: 'noDoctor',
          },
          {
            id: 'doctor',
            title: 'Doctor Visit Recommended',
            route: '/doctor',
            layout: 'vertical',
            components: [
              {
                id: 'doctorText',
                type: 'text',
                label: 'Doctor Visit Needed',
                props: {
                  helperText:
                    'Based on your answers, it is recommended that you visit a doctor for further evaluation.',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'noDoctor',
            title: 'No Doctor Visit Needed',
            route: '/no-doctor',
            layout: 'vertical',
            components: [
              {
                id: 'noDoctorText',
                type: 'text',
                label: 'No Doctor Visit Needed',
                props: {
                  helperText:
                    'Based on your answers, a doctor visit is not necessary at this time.',
                },
              },
              {
                id: 'disclaimerText',
                type: 'text',
                label: 'Disclaimer',
                props: {
                  helperText:
                    'This tool does not provide medical advice. If your symptoms worsen or you are concerned, please consult a healthcare professional.',
                },
              },
            ],
            isEndPage: true,
          },
        ],
      },
    },
  },
  {
    name: 'Job Application Form',
    description: 'Professional job application with multiple sections',
    prompt:
      'A 3-step job application form with personal details, work experience, and references',
    json: {
      app: {
        title: 'Job Application Form',
        pages: [
          {
            id: 'personal-details',
            title: 'Personal Details',
            route: '/personal-details',
            layout: 'vertical',
            components: [
              {
                id: 'fullName',
                type: 'input',
                label: 'Full Name',
                props: {
                  placeholder: 'Enter your full name',
                  inputType: 'text',
                },
                validation: {
                  required: true,
                  minLength: 2,
                },
              },
              {
                id: 'email',
                type: 'input',
                label: 'Email Address',
                props: {
                  placeholder: 'Enter your email address',
                  inputType: 'email',
                },
                validation: {
                  required: true,
                  pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
                },
              },
              {
                id: 'phone',
                type: 'input',
                label: 'Phone Number',
                props: {
                  placeholder: 'Enter your phone number',
                  inputType: 'text',
                },
                validation: {
                  required: true,
                  pattern: '^\\+?[0-9\\-\\s]{7,15}$',
                },
              },
              {
                id: 'address',
                type: 'textarea',
                label: 'Current Address',
                props: {
                  placeholder: 'Enter your current address',
                  rows: 3,
                },
                validation: {
                  required: true,
                  minLength: 5,
                },
              },
              {
                id: 'nextBtnPersonal',
                type: 'button',
                label: 'Next',
                props: {
                  className: 'primary',
                },
              },
            ],
            nextPage: 'work-experience',
          },
          {
            id: 'work-experience',
            title: 'Work Experience',
            route: '/work-experience',
            layout: 'vertical',
            components: [
              {
                id: 'currentPosition',
                type: 'input',
                label: 'Current/Last Position',
                props: {
                  placeholder: 'Enter your current or last job title',
                  inputType: 'text',
                },
                validation: {
                  required: true,
                  minLength: 2,
                },
              },
              {
                id: 'company',
                type: 'input',
                label: 'Company',
                props: {
                  placeholder: 'Enter company name',
                  inputType: 'text',
                },
                validation: {
                  required: true,
                  minLength: 2,
                },
              },
              {
                id: 'experience',
                type: 'textarea',
                label: 'Describe your relevant experience',
                props: {
                  placeholder: 'Describe your experience and achievements...',
                  rows: 4,
                },
                validation: {
                  required: true,
                  minLength: 10,
                },
              },
              {
                id: 'skills',
                type: 'textarea',
                label: 'Key Skills',
                props: {
                  placeholder: 'List your key skills and competencies',
                  rows: 3,
                },
                validation: {
                  required: true,
                  minLength: 5,
                },
              },
              {
                id: 'nextBtnWork',
                type: 'button',
                label: 'Next',
                props: {
                  className: 'primary',
                },
              },
            ],
            nextPage: 'references',
          },
          {
            id: 'references',
            title: 'References',
            route: '/references',
            layout: 'vertical',
            components: [
              {
                id: 'reference1',
                type: 'input',
                label: 'Reference 1 - Name',
                props: {
                  placeholder: 'Enter reference name',
                  inputType: 'text',
                },
                validation: {
                  required: true,
                  minLength: 2,
                },
              },
              {
                id: 'reference1Contact',
                type: 'input',
                label: 'Reference 1 - Contact',
                props: {
                  placeholder: 'Enter reference contact information',
                  inputType: 'text',
                },
                validation: {
                  required: true,
                  minLength: 5,
                },
              },
              {
                id: 'reference2',
                type: 'input',
                label: 'Reference 2 - Name',
                props: {
                  placeholder: 'Enter reference name (optional)',
                  inputType: 'text',
                },
              },
              {
                id: 'reference2Contact',
                type: 'input',
                label: 'Reference 2 - Contact',
                props: {
                  placeholder: 'Enter reference contact information (optional)',
                  inputType: 'text',
                },
              },
              {
                id: 'submitBtn',
                type: 'button',
                label: 'Submit Application',
                props: {
                  className: 'primary',
                },
              },
            ],
            isEndPage: true,
          },
        ],
      },
    },
  },
];
