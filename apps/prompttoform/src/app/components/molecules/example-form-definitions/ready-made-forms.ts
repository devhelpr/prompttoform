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
  {
    name: 'Complex Health Form',
    description: 'A form that has many steps and branches',
    prompt: 'A health check-up form with many steps and branches',
    json: {
      app: {
        title: 'Health Decision Tree',
        pages: [
          {
            id: 'page1',
            title: 'Initial Health Screening',
            route: '/screening',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'welcomeText',
                label: '',
                props: {
                  content:
                    'Welcome to the Health Symptom Checker. Please answer the following questions.',
                },
              },
              {
                type: 'radio',
                id: 'symptomsQuestion',
                label: 'Are you currently experiencing any symptoms?',
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'symptomsQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page2',
              },
              {
                condition: {
                  field: 'symptomsQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page3',
              },
            ],
          },
          {
            id: 'page2',
            title: 'Symptom Severity',
            route: '/symptoms/severity',
            layout: 'vertical',
            components: [
              {
                type: 'radio',
                id: 'severityQuestion',
                label: 'How would you rate the severity of your symptoms?',
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
                  field: 'severityQuestion',
                  operator: '==',
                  value: 'mild',
                },
                nextPage: 'page4',
              },
              {
                condition: {
                  field: 'severityQuestion',
                  operator: '==',
                  value: 'moderate',
                },
                nextPage: 'page5',
              },
              {
                condition: {
                  field: 'severityQuestion',
                  operator: '==',
                  value: 'severe',
                },
                nextPage: 'page6',
              },
            ],
          },
          {
            id: 'page3',
            title: 'General Wellness',
            route: '/wellness',
            layout: 'vertical',
            components: [
              {
                type: 'radio',
                id: 'wellnessInterestQuestion',
                label: 'Are you interested in improving your general wellness?',
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'wellnessInterestQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page7',
              },
              {
                condition: {
                  field: 'wellnessInterestQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page8',
              },
            ],
          },
          {
            id: 'page4',
            title: 'Mild Symptoms Advice',
            route: '/symptoms/mild-advice',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'mildSymptomsText',
                label: '',
                props: {
                  content:
                    'For mild symptoms, rest and hydration are recommended. Monitor your symptoms.',
                },
              },
              {
                type: 'radio',
                id: 'symptomsPersistQuestion',
                label: 'Have your symptoms persisted for more than 3 days?',
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'symptomsPersistQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page9',
              },
              {
                condition: {
                  field: 'symptomsPersistQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page10',
              },
            ],
          },
          {
            id: 'page5',
            title: 'Moderate Symptoms Advice',
            route: '/symptoms/moderate-advice',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'moderateSymptomsText',
                label: '',
                props: {
                  content:
                    'For moderate symptoms, consider consulting a healthcare professional.',
                },
              },
              {
                type: 'radio',
                id: 'preexistingConditionQuestion',
                label:
                  'Do you have a pre-existing condition that might be affected?',
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'preexistingConditionQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page11',
              },
              {
                condition: {
                  field: 'preexistingConditionQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page12',
              },
            ],
          },
          {
            id: 'page6',
            title: 'Severe Symptoms Advice',
            route: '/symptoms/severe-advice',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'severeSymptomsText',
                label: '',
                props: {
                  content:
                    'For severe symptoms, please seek immediate medical attention.',
                },
              },
              {
                type: 'button',
                id: 'emergencyButton',
                label: 'Find Emergency Services',
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page7',
            title: 'Wellness Goals',
            route: '/wellness/goals',
            layout: 'vertical',
            components: [
              {
                type: 'select',
                id: 'wellnessAreaQuestion',
                label: 'What area of wellness are you most interested in?',
                props: {
                  options: [
                    {
                      label: 'Diet and Nutrition',
                      value: 'diet',
                    },
                    {
                      label: 'Exercise and Fitness',
                      value: 'exercise',
                    },
                    {
                      label: 'Mental Health and Stress Management',
                      value: 'mental_health',
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
                  field: 'wellnessAreaQuestion',
                  operator: '==',
                  value: 'diet',
                },
                nextPage: 'page13',
              },
              {
                condition: {
                  field: 'wellnessAreaQuestion',
                  operator: '==',
                  value: 'exercise',
                },
                nextPage: 'page14',
              },
              {
                condition: {
                  field: 'wellnessAreaQuestion',
                  operator: '==',
                  value: 'mental_health',
                },
                nextPage: 'page15',
              },
            ],
          },
          {
            id: 'page8',
            title: 'End - No Action',
            route: '/end/no-action',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'noActionText',
                label: '',
                props: {
                  content: 'Thank you for your time. Stay healthy!',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page9',
            title: 'Persistent Mild Symptoms',
            route: '/symptoms/mild-persistent',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'persistentMildSymptomsText',
                label: '',
                props: {
                  content:
                    "If mild symptoms persist, it's advisable to consult a healthcare professional.",
                },
              },
              {
                type: 'radio',
                id: 'seeDoctorQuestion',
                label: 'Are you able to see a doctor within the next 48 hours?',
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'seeDoctorQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page16',
              },
              {
                condition: {
                  field: 'seeDoctorQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page17',
              },
            ],
          },
          {
            id: 'page10',
            title: 'End - Monitor Symptoms',
            route: '/end/monitor-symptoms',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'monitorSymptomsText',
                label: '',
                props: {
                  content:
                    'Continue monitoring your symptoms. If they worsen or do not improve, seek medical advice.',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page11',
            title: 'Consult Doctor - Pre-existing Condition',
            route: '/symptoms/moderate-preexisting',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'consultDoctorPreexistingText',
                label: '',
                props: {
                  content:
                    'Given your pre-existing condition, it is highly recommended to consult your doctor regarding your current symptoms.',
                },
              },
              {
                type: 'radio',
                id: 'doctorContactQuestion',
                label:
                  "Do you have your doctor's contact information readily available?",
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'doctorContactQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page18',
              },
              {
                condition: {
                  field: 'doctorContactQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page19',
              },
            ],
          },
          {
            id: 'page12',
            title: 'Consider Consultation',
            route: '/symptoms/moderate-consider-consultation',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'considerConsultationText',
                label: '',
                props: {
                  content:
                    "Consider scheduling a consultation with a healthcare provider if your symptoms don't improve or if you have concerns.",
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page13',
            title: 'Diet Advice',
            route: '/wellness/diet-advice',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'dietAdviceText',
                label: '',
                props: {
                  content:
                    'Focus on a balanced diet with plenty of fruits, vegetables, lean proteins, and whole grains.',
                },
              },
              {
                type: 'radio',
                id: 'dietPlansQuestion',
                label:
                  'Are you interested in specific diet plans or resources?',
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'dietPlansQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page20',
              },
              {
                condition: {
                  field: 'dietPlansQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page21',
              },
            ],
          },
          {
            id: 'page14',
            title: 'Exercise Advice',
            route: '/wellness/exercise-advice',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'exerciseAdviceText',
                label: '',
                props: {
                  content:
                    'Regular physical activity is beneficial. Aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity activity per week, plus muscle-strengthening activities on 2 or more days a week.',
                },
              },
              {
                type: 'radio',
                id: 'workoutPreferenceQuestion',
                label: 'Do you prefer home workouts or gym sessions?',
                props: {
                  options: [
                    {
                      label: 'Home Workouts',
                      value: 'home',
                    },
                    {
                      label: 'Gym Sessions',
                      value: 'gym',
                    },
                    {
                      label: 'Both/No Preference',
                      value: 'both',
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
                  field: 'workoutPreferenceQuestion',
                  operator: '==',
                  value: 'home',
                },
                nextPage: 'page22',
              },
              {
                condition: {
                  field: 'workoutPreferenceQuestion',
                  operator: '==',
                  value: 'gym',
                },
                nextPage: 'page23',
              },
              {
                condition: {
                  field: 'workoutPreferenceQuestion',
                  operator: '==',
                  value: 'both',
                },
                nextPage: 'page22',
              },
            ],
          },
          {
            id: 'page15',
            title: 'Mental Health Advice',
            route: '/wellness/mental-health-advice',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'mentalHealthAdviceText',
                label: '',
                props: {
                  content:
                    'Prioritizing mental well-being is crucial. Consider mindfulness, meditation, or relaxation techniques. Ensure you get enough sleep and connect with supportive people.',
                },
              },
              {
                type: 'radio',
                id: 'mentalHealthResourcesQuestion',
                label: 'Would you like resources for mental health support?',
                props: {
                  options: [
                    {
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      label: 'No',
                      value: 'no',
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
                  field: 'mentalHealthResourcesQuestion',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page24',
              },
              {
                condition: {
                  field: 'mentalHealthResourcesQuestion',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page25',
              },
            ],
          },
          {
            id: 'page16',
            title: 'Schedule Appointment',
            route: '/action/schedule-appointment',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'scheduleAppointmentText',
                label: '',
                props: {
                  content:
                    'Please schedule an appointment with your doctor soon to discuss your persistent symptoms.',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page17',
            title: 'Alternative Care Options',
            route: '/action/alternative-care',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'alternativeCareText',
                label: '',
                props: {
                  content:
                    "If you cannot see a doctor promptly, consider telehealth services for a remote consultation or visit an urgent care clinic if your symptoms warrant it and it's appropriate for your situation.",
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page18',
            title: 'Contact Doctor Now',
            route: '/action/contact-doctor',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'contactDoctorText',
                label: '',
                props: {
                  content:
                    'Please contact your doctor as soon as possible to discuss your symptoms, especially considering your pre-existing condition.',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page19',
            title: 'Find Doctor Info',
            route: '/action/find-doctor-info',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'findDoctorInfoText',
                label: '',
                props: {
                  content:
                    "Please locate your doctor's contact information. You can check your insurance provider's directory, previous medical records, or the clinic's website.",
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page20',
            title: 'Diet Plan Resources',
            route: '/wellness/diet-resources',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'dietResourcesText',
                label: '',
                props: {
                  content:
                    "Here are some general resources for healthy eating: MyPlate.gov, EatRight.org. For specific diet plans, it's best to consult a registered dietitian or your healthcare provider.",
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page21',
            title: 'General Diet Tips',
            route: '/wellness/diet-tips',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'generalDietTipsText',
                label: '',
                props: {
                  content:
                    'Remember to drink plenty of water, limit processed foods and sugary drinks, and focus on portion control. Small, consistent changes can make a big difference.',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page22',
            title: 'Home Workout Ideas',
            route: '/wellness/home-workouts',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'homeWorkoutsText',
                label: '',
                props: {
                  content:
                    'Explore online videos for bodyweight exercises, yoga, pilates, or dance workouts that you can do at home. Many apps also offer guided home fitness programs.',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page23',
            title: 'Gym Routine Tips',
            route: '/wellness/gym-tips',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'gymTipsText',
                label: '',
                props: {
                  content:
                    "At the gym, consider a mix of cardiovascular exercises (like treadmill, elliptical, cycling) and strength training (weights, resistance machines). If you're new, a session with a personal trainer can help you create a safe and effective plan.",
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page24',
            title: 'Mental Health Resources',
            route: '/wellness/mental-health-resources',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'mentalHealthResourcesText',
                label: '',
                props: {
                  content:
                    'Here are some general resources: National Alliance on Mental Illness (NAMI), MentalHealth.gov. If you are in crisis, please contact a crisis hotline or emergency services.',
                },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page25',
            title: 'Self-Care Reminders',
            route: '/wellness/self-care',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'selfCareText',
                label: '',
                props: {
                  content:
                    'Remember to incorporate self-care into your routine. This can include taking breaks, engaging in hobbies you enjoy, spending time in nature, and connecting with loved ones.',
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
    name: 'Question Loop Form',
    description: 'A form that has a loop in the definition',
    prompt:
      'create a form that asks a question, and in the next step if the answer is wrong and you press "next" that it sends you back to the previous step (i want a loop in the definition).. this feedback should occur in the next step which shows a message that it answer was wrong',
    json: {
      app: {
        title: 'Question Loop Form',
        pages: [
          {
            id: 'questionPage',
            title: 'Question',
            route: '/question',
            layout: 'vertical',
            components: [
              {
                id: 'questionText',
                type: 'text',
                label: 'Question',
                props: {
                  helperText: 'Please answer the following question:',
                },
              },
              {
                id: 'answerInput',
                type: 'input',
                label: 'What is 2 + 2?',
                props: {
                  placeholder: 'Enter your answer',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'nextButton',
                type: 'button',
                label: 'Next',
                props: {
                  className: 'primary',
                },
              },
            ],
            branches: [
              {
                condition: {
                  field: 'answerInput',
                  operator: '==',
                  value: '4',
                },
                nextPage: 'successPage',
              },
              {
                condition: {
                  field: 'answerInput',
                  operator: '!=',
                  value: '4',
                },
                nextPage: 'wrongAnswerPage',
              },
            ],
          },
          {
            id: 'wrongAnswerPage',
            title: 'Incorrect Answer',
            route: '/wrong',
            layout: 'vertical',
            components: [
              {
                id: 'wrongMessage',
                type: 'text',
                label: 'Incorrect',
                props: {
                  helperText:
                    'Sorry, your answer was incorrect. Please try again.',
                },
              },
              {
                id: 'backButton',
                type: 'button',
                label: 'Back to Question',
                props: {
                  className: 'secondary',
                },
              },
            ],
            nextPage: 'questionPage',
          },
          {
            id: 'successPage',
            title: 'Correct Answer',
            route: '/success',
            layout: 'vertical',
            components: [
              {
                id: 'successMessage',
                type: 'text',
                label: 'Congratulations!',
                props: {
                  helperText: 'You answered correctly!',
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
    name: 'Customer Feedback Form with Thank You Page',
    description:
      'Feedback form with customizable thank you page after submission',
    prompt:
      'A customer feedback form with name, email, service type, satisfaction rating, and a thank you page that shows after submission',
    json: {
      app: {
        title: 'Customer Feedback Form',
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
                        label: 'Additional Comments',
                        props: {
                          placeholder:
                            'Please share any additional comments or suggestions...',
                          rows: 4,
                        },
                      },
                      {
                        type: 'checkbox',
                        id: 'contact-permission',
                        label: 'I would like to be contacted for follow-up',
                      },
                      {
                        type: 'button',
                        id: 'submit-feedback',
                        label: 'Submit Feedback',
                        props: {
                          className: 'primary',
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
            'Your feedback has been submitted successfully. We appreciate you taking the time to help us improve our services.',
          showRestartButton: true,
          showBackButton: false,
          customActions: [
            {
              label: 'Visit Our Website',
              action: 'custom',
              customAction: 'openWebsite',
              className: 'bg-blue-600 text-white hover:bg-blue-700',
            },
            {
              label: 'Contact Support',
              action: 'custom',
              customAction: 'contactSupport',
              className: 'bg-green-600 text-white hover:bg-green-700',
            },
          ],
        },
      },
    },
  },
];
