import { FormDefinition } from '@devhelpr/react-forms';
import { MultiLanguageFormDefinition } from '@devhelpr/react-forms';

export interface ReadyMadeForm {
  name: string;
  description: string;
  json: FormDefinition | MultiLanguageFormDefinition;
  prompt?: string;
}

export const READY_MADE_FORMS: ReadyMadeForm[] = [
  {
    name: 'Simple Slider Test',
    description:
      'Very simple form with 2 sliders and an expression that adds them together',
    prompt:
      'Create a simple form with 2 sliders and a readonly field that shows their sum',
    json: {
      app: {
        title: 'Simple Slider Test',
        version: '1.0.0',
        language: 'en',
        theme: 'default',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
          allowBackNavigation: true,
          submitButtonText: 'Submit',
          nextButtonText: 'Next',
          previousButtonText: 'Previous',
          showRestartButton: true,
          restartButtonText: 'Restart',
        },
        pages: [
          {
            id: 'page1',
            title: 'Slider Addition Test',
            route: '/slider-test',
            components: [
              {
                id: 'slider1',
                type: 'slider-range',
                label: 'First Number',
                props: {
                  min: 0,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Move this slider to change the first number',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'slider2',
                type: 'slider-range',
                label: 'Second Number',
                props: {
                  min: 0,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Move this slider to change the second number',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'sum',
                type: 'input',
                label: 'Sum (Readonly)',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText:
                    'This field shows the sum of the two sliders above',
                },
                expression: {
                  expression: 'slider1.value + slider2.value',
                  mode: 'value',
                  dependencies: ['slider1', 'slider2'],
                  evaluateOnChange: true,
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Test Complete!',
          message: 'Thank you for testing the simple slider addition form.',
          showRestartButton: true,
        },
      },
    },
  },
  {
    name: 'BMI Calculator',
    description:
      'Interactive BMI calculator with weight and height sliders, automatic BMI calculation, and health interpretation',
    prompt:
      'Create a BMI calculator with weight and height sliders, automatic BMI calculation, and health category interpretation',
    json: {
      app: {
        title: 'BMI Calculator',
        pages: [
          {
            id: 'bmi-input',
            title: 'Enter measurements',
            route: '/',
            layout: 'vertical',
            components: [
              {
                type: 'slider-range',
                id: 'weightKg',
                label: 'Body weight (kg)',
                props: {
                  min: 30,
                  max: 250,
                  step: 0.5,
                  mode: 'single',
                  showLabels: true,
                  showValue: true,
                  helperText: 'Select your weight in kilograms',
                },
                validation: {
                  required: true,
                  min: 30,
                  max: 250,
                  errorMessages: {
                    required: 'Please select your weight',
                    min: 'Weight must be at least {min} kg',
                    max: 'Weight cannot exceed {max} kg',
                  },
                },
              },
              {
                type: 'slider-range',
                id: 'heightCm',
                label: 'Height (cm)',
                props: {
                  min: 100,
                  max: 230,
                  step: 0.5,
                  mode: 'single',
                  showLabels: true,
                  showValue: true,
                  helperText: 'Select your height in centimeters',
                },
                validation: {
                  required: true,
                  min: 100,
                  max: 230,
                  errorMessages: {
                    required: 'Please select your height',
                    min: 'Height must be at least {min} cm',
                    max: 'Height cannot exceed {max} cm',
                  },
                },
              },
              {
                type: 'input',
                id: 'bmi',
                label: 'Body Mass Index (BMI)',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Calculated automatically from weight and height',
                  expression: {
                    expression:
                      'round(weightKg.value / pow(heightCm.value/100, 2) * 10) / 10',
                    mode: 'value',
                    dependencies: ['weightKg', 'heightCm'],
                    evaluateOnChange: true,
                    debounceMs: 100,
                  },
                },
                validation: {
                  required: true,
                  min: 5,
                  max: 100,
                  errorMessages: {
                    required: 'BMI is calculated automatically',
                    min: 'Calculated BMI seems too low',
                    max: 'Calculated BMI seems too high',
                    invalidNumber: 'Calculated BMI is not a valid number',
                  },
                },
              },
              {
                type: 'text',
                id: 'bmi-interpretation',
                label: 'BMI interpretation',
                props: {
                  expression: {
                    expression:
                      "(bmi.value < 18.5 ? 'Underweight' : (bmi.value < 25 ? 'Normal weight' : (bmi.value < 30 ? 'Overweight' : 'Obesity')))",
                    mode: 'value',
                    dependencies: ['bmi'],
                    evaluateOnChange: true,
                    debounceMs: 100,
                  },
                },
              },
              {
                type: 'section',
                id: 'summary-section',
                label: 'Summary',
                children: [
                  {
                    type: 'text',
                    id: 'summary-text',
                    label: 'Your measurements',
                    props: {
                      helperText:
                        'Weight: {{weightKg}} kg\nHeight: {{heightCm}} cm\nBMI: {{bmi}}',
                    },
                  },
                ],
              },
            ],
            nextPage: 'thank-you',
          },
          {
            id: 'thank-you',
            title: 'Results',
            route: '/results',
            layout: 'vertical',
            components: [
              {
                type: 'text',
                id: 'results-header',
                label: 'Results',
                props: {
                  helperText: 'Your BMI has been calculated below',
                },
              },
              {
                type: 'text',
                id: 'results-values',
                label: 'Calculated values',
                props: {
                  helperText:
                    'Weight: {{weightKg}} kg\nHeight: {{heightCm}} cm\nBMI: {{bmi}}',
                },
              },
              {
                type: 'text',
                id: 'results-interpretation',
                label: 'Interpretation',
                props: {
                  helperText: '{{bmi}}',
                  expression: {
                    expression:
                      "(bmi.value < 18.5 ? 'Underweight (BMI < 18.5)' : (bmi.value < 25 ? 'Normal weight (BMI 18.5–24.9)' : (bmi.value < 30 ? 'Overweight (BMI 25–29.9)' : 'Obesity (BMI ≥ 30)')))",
                    mode: 'helperText',
                    dependencies: ['bmi'],
                    evaluateOnChange: true,
                    debounceMs: 100,
                  },
                },
              },
            ],
            isEndPage: true,
          },
        ],
        thankYouPage: {
          title: 'Calculation complete',
          message: 'Your BMI has been calculated successfully.',
          showRestartButton: true,
          customActions: [
            {
              label: 'Start Over',
              action: 'restart',
              className: 'bg-gray-800 text-white',
            },
          ],
        },
        dataSources: [],
      },
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      languageDetails: [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
        },
      ],
      translations: {
        en: {
          app: {
            title: 'BMI Calculator',
          },
          pages: [
            {
              id: 'bmi-input',
              title: 'Enter measurements',
              components: [
                {
                  id: 'weightKg',
                  label: 'Body weight (kg)',
                },
                {
                  id: 'heightCm',
                  label: 'Height (cm)',
                },
                {
                  id: 'bmi',
                  label: 'Body Mass Index (BMI)',
                },
              ],
            },
            {
              id: 'thank-you',
              title: 'Results',
            },
          ],
          ui: {
            nextButton: 'Next',
            submitButton: 'Submit',
            restartButton: 'Start Over',
            loadingText: 'Calculating...',
          },
          errorMessages: {
            required: 'This field is required',
            invalidNumber: 'Please enter a valid number',
          },
        },
      },
    },
  },
  {
    name: 'Multi-Language Contact Form',
    description:
      'Simple contact form with Dutch, English, and Swedish language support',
    prompt:
      'Create a contact form with name, email, and message fields in Dutch, English, and Swedish languages',
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
                },
              },
              {
                id: 'message',
                type: 'textarea',
                label: 'Message',
                props: {
                  placeholder: 'Enter your message',
                  rows: 4,
                },
                validation: {
                  required: true,
                  minLength: 10,
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Thank You!',
          message:
            'Your message has been sent successfully. We will get back to you soon.',
        },
      },
      translations: {
        en: {
          app: {
            title: 'Contact Us',
          },
          pages: [
            {
              id: 'contact-page',
              title: 'Contact Us',
              components: [
                {
                  id: 'name',
                  label: 'Full Name',
                  props: {
                    placeholder: 'Enter your full name',
                  },
                  validation: {
                    errorMessages: {
                      required: 'Full name is required',
                      minLength: 'Name must be at least 2 characters long',
                    },
                  },
                },
                {
                  id: 'email',
                  label: 'Email Address',
                  props: {
                    placeholder: 'Enter your email address',
                  },
                  validation: {
                    errorMessages: {
                      required: 'Email address is required',
                      invalidEmail: 'Please enter a valid email address',
                    },
                  },
                },
                {
                  id: 'message',
                  label: 'Message',
                  props: {
                    placeholder: 'Enter your message',
                  },
                  validation: {
                    errorMessages: {
                      required: 'Message is required',
                      minLength: 'Message must be at least 10 characters long',
                    },
                  },
                },
              ],
            },
          ],
          ui: {
            submitButton: 'Send Message',
            thankYouTitle: 'Thank You!',
            thankYouMessage:
              'Your message has been sent successfully. We will get back to you soon.',
          },
          errorMessages: {
            required: '{fieldLabel} is required',
            minLength:
              '{fieldLabel} must be at least {minLength} characters long',
            maxLength: '{fieldLabel} cannot exceed {maxLength} characters',
            pattern: '{fieldLabel} format is invalid',
            minItems:
              'Please select at least {minItems} items for {fieldLabel}',
            maxItems:
              'Please select no more than {maxItems} items for {fieldLabel}',
            minDate: '{fieldLabel} must be on or after {minDate}',
            maxDate: '{fieldLabel} must be before {maxDate}',
            min: '{fieldLabel} must be at least {min}',
            max: '{fieldLabel} cannot exceed {max}',
            invalidFormat: '{fieldLabel} format is invalid',
            invalidEmail: 'Please enter a valid email address for {fieldLabel}',
            invalidNumber: 'Please enter a valid number for {fieldLabel}',
            invalidDate: 'Please enter a valid date for {fieldLabel}',
            generic: '{fieldLabel} is invalid',
          },
        },
        nl: {
          app: {
            title: 'Neem Contact Op',
          },
          pages: [
            {
              id: 'contact-page',
              title: 'Neem Contact Op',
              components: [
                {
                  id: 'name',
                  label: 'Volledige Naam',
                  props: {
                    placeholder: 'Voer uw volledige naam in',
                  },
                  validation: {
                    errorMessages: {
                      required: 'Volledige naam is verplicht',
                      minLength: 'Naam moet minimaal 2 karakters lang zijn',
                    },
                  },
                },
                {
                  id: 'email',
                  label: 'E-mailadres',
                  props: {
                    placeholder: 'Voer uw e-mailadres in',
                  },
                  validation: {
                    errorMessages: {
                      required: 'E-mailadres is verplicht',
                      invalidEmail: 'Voer een geldig e-mailadres in',
                    },
                  },
                },
                {
                  id: 'message',
                  label: 'Bericht',
                  props: {
                    placeholder: 'Voer uw bericht in',
                  },
                  validation: {
                    errorMessages: {
                      required: 'Bericht is verplicht',
                      minLength: 'Bericht moet minimaal 10 karakters lang zijn',
                    },
                  },
                },
              ],
            },
          ],
          ui: {
            submitButton: 'Verstuur Bericht',
            thankYouTitle: 'Bedankt!',
            thankYouMessage:
              'Uw bericht is succesvol verzonden. We nemen zo snel mogelijk contact met u op.',
          },
          errorMessages: {
            required: '{fieldLabel} is verplicht',
            minLength:
              '{fieldLabel} moet minimaal {minLength} karakters lang zijn',
            maxLength:
              '{fieldLabel} mag niet meer dan {maxLength} karakters bevatten',
            pattern: '{fieldLabel} formaat is ongeldig',
            minItems: 'Selecteer minimaal {minItems} items voor {fieldLabel}',
            maxItems:
              'Selecteer niet meer dan {maxItems} items voor {fieldLabel}',
            minDate: '{fieldLabel} moet op of na {minDate} zijn',
            maxDate: '{fieldLabel} moet voor {maxDate} zijn',
            min: '{fieldLabel} moet minimaal {min} zijn',
            max: '{fieldLabel} mag niet meer dan {max} zijn',
            invalidFormat: '{fieldLabel} formaat is ongeldig',
            invalidEmail: 'Voer een geldig e-mailadres in voor {fieldLabel}',
            invalidNumber: 'Voer een geldig nummer in voor {fieldLabel}',
            invalidDate: 'Voer een geldige datum in voor {fieldLabel}',
            generic: '{fieldLabel} is ongeldig',
          },
        },
        sv: {
          app: {
            title: 'Kontakta Oss',
          },
          pages: [
            {
              id: 'contact-page',
              title: 'Kontakta Oss',
              components: [
                {
                  id: 'name',
                  label: 'Fullständigt Namn',
                  props: {
                    placeholder: 'Ange ditt fullständiga namn',
                  },
                  validation: {
                    errorMessages: {
                      required: 'Fullständigt namn krävs',
                      minLength: 'Namnet måste vara minst 2 tecken långt',
                    },
                  },
                },
                {
                  id: 'email',
                  label: 'E-postadress',
                  props: {
                    placeholder: 'Ange din e-postadress',
                  },
                  validation: {
                    errorMessages: {
                      required: 'E-postadress krävs',
                      invalidEmail: 'Ange en giltig e-postadress',
                    },
                  },
                },
                {
                  id: 'message',
                  label: 'Meddelande',
                  props: {
                    placeholder: 'Ange ditt meddelande',
                  },
                  validation: {
                    errorMessages: {
                      required: 'Meddelande krävs',
                      minLength: 'Meddelandet måste vara minst 10 tecken långt',
                    },
                  },
                },
              ],
            },
          ],
          ui: {
            submitButton: 'Skicka Meddelande',
            thankYouTitle: 'Tack!',
            thankYouMessage:
              'Ditt meddelande har skickats framgångsrikt. Vi återkommer till dig så snart som möjligt.',
          },
          errorMessages: {
            required: '{fieldLabel} krävs',
            minLength: '{fieldLabel} måste vara minst {minLength} tecken långt',
            maxLength: '{fieldLabel} får inte överstiga {maxLength} tecken',
            pattern: '{fieldLabel} format är ogiltigt',
            minItems: 'Välj minst {minItems} objekt för {fieldLabel}',
            maxItems: 'Välj inte mer än {maxItems} objekt för {fieldLabel}',
            minDate: '{fieldLabel} måste vara på eller efter {minDate}',
            maxDate: '{fieldLabel} måste vara före {maxDate}',
            min: '{fieldLabel} måste vara minst {min}',
            max: '{fieldLabel} får inte överstiga {max}',
            invalidFormat: '{fieldLabel} format är ogiltigt',
            invalidEmail: 'Ange en giltig e-postadress för {fieldLabel}',
            invalidNumber: 'Ange ett giltigt nummer för {fieldLabel}',
            invalidDate: 'Ange ett giltigt datum för {fieldLabel}',
            generic: '{fieldLabel} är ogiltigt',
          },
        },
      },
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'nl', 'sv'],
      languageDetails: [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
        },
        {
          code: 'nl',
          name: 'Dutch',
          nativeName: 'Nederlands',
        },
        {
          code: 'sv',
          name: 'Swedish',
          nativeName: 'Svenska',
        },
      ],
    },
  },
  {
    name: 'Simple Contact Form',
    description:
      'Basic contact form with name, email, message, confirmation step, and thank you page',
    prompt:
      'A simple contact form with name, email, subject, message fields, and a thank you page after submission',
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
                    label: 'Review Message',
                    props: {
                      className: 'primary',
                    },
                  },
                ],
              },
            ],
            nextPage: 'confirmation',
          },
          {
            id: 'confirmation',
            title: 'Review Your Message',
            route: '/confirmation',
            layout: 'vertical',
            isConfirmationPage: true,
            isEndPage: true,
            components: [
              {
                type: 'confirmation',
                id: 'message-summary',
                label: 'Message Summary',
                props: {
                  confirmationSettings: {
                    showSummary: true,
                    groupBySection: false,
                    customTitle: 'Please Review Your Message',
                    customMessage:
                      'Please review your message below before sending. You can go back to make any changes.',
                  },
                },
              },
            ],
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
        thankYouPage: {
          title: 'Thank You for Contacting Us!',
          message:
            'Your message has been sent successfully. We will get back to you as soon as possible.',
          showRestartButton: true,
          customActions: [
            {
              label: 'Back to Homepage',
              action: 'custom',
              customAction: 'goHome',
              className: 'bg-blue-600 text-white hover:bg-blue-700',
            },
            {
              label: 'Send Another Message',
              action: 'restart',
              className: 'bg-green-600 text-white hover:bg-green-700',
            },
          ],
        },
      },
    },
  },
  {
    name: 'User Registration Form',
    description:
      'Multi-step registration with validation and confirmation step',
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
            nextPage: 'confirmation',
          },
          {
            id: 'confirmation',
            title: 'Review Your Registration',
            route: '/confirmation',
            layout: 'vertical',
            isConfirmationPage: true,
            isEndPage: true,
            components: [
              {
                type: 'confirmation',
                id: 'registration-summary',
                label: 'Registration Summary',
                props: {
                  confirmationSettings: {
                    showSummary: true,
                    groupBySection: false,
                    excludeFields: ['password', 'confirmPassword'],
                    customTitle: 'Please Review Your Registration Details',
                    customMessage:
                      'Please verify that all information is correct. Your password will not be shown for security reasons.',
                  },
                },
              },
            ],
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
        thankYouPage: {
          title: 'Registration Successful!',
          message:
            'Your account has been created successfully. Welcome to our platform!',
          showRestartButton: false,
          customActions: [
            {
              label: 'Login to Your Account',
              action: 'custom',
              customAction: 'login',
              className: 'bg-green-600 text-white hover:bg-green-700',
            },
          ],
        },
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
    description:
      'Professional job application with multiple sections and confirmation step',
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
                label: 'Next',
                props: {
                  className: 'primary',
                },
              },
            ],
            nextPage: 'confirmation',
          },
          {
            id: 'confirmation',
            title: 'Review Your Application',
            route: '/confirmation',
            layout: 'vertical',
            isConfirmationPage: true,
            isEndPage: true,
            components: [
              {
                type: 'confirmation',
                id: 'application-summary',
                label: 'Application Summary',
                props: {
                  confirmationSettings: {
                    showSummary: true,
                    groupBySection: true,
                    customTitle: 'Please Review Your Job Application',
                    customMessage:
                      'Please review all the information below carefully before submitting your application. You can go back to make changes if needed.',
                  },
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Application Submitted Successfully!',
          message:
            'Thank you for your interest in our position. We have received your application and will review it carefully. You will hear from us within the next few business days.',
          showRestartButton: false,
          customActions: [
            {
              label: 'View Open Positions',
              action: 'custom',
              customAction: 'viewJobs',
              className: 'bg-blue-600 text-white hover:bg-blue-700',
            },
            {
              label: 'Apply for Another Position',
              action: 'restart',
              className: 'bg-green-600 text-white hover:bg-green-700',
            },
          ],
        },
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
      'Feedback form with confirmation step and customizable thank you page after submission',
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
                        label: 'Review Feedback',
                        props: {
                          className: 'primary',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
            nextPage: 'confirmation',
          },
          {
            id: 'confirmation',
            title: 'Review Your Feedback',
            route: '/confirmation',
            layout: 'vertical',
            isConfirmationPage: true,
            isEndPage: true,
            components: [
              {
                type: 'confirmation',
                id: 'feedback-summary',
                label: 'Feedback Summary',
                props: {
                  confirmationSettings: {
                    showSummary: true,
                    groupBySection: true,
                    customTitle: 'Please Review Your Feedback',
                    customMessage:
                      'Please review your feedback below. Your input helps us improve our services.',
                  },
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Thank You for Your Feedback!',
          message:
            'Your feedback has been submitted successfully. We appreciate you taking the time to help us improve our services.',
          showRestartButton: true,
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
  {
    name: 'Dynamic Calculator with Sliders',
    description:
      'Interactive calculator with sliders and real-time expressions for testing slider-range and expression engine',
    prompt:
      'Create a dynamic calculator form with sliders for price, quantity, tax rate, and discount, with real-time calculations using expressions',
    json: {
      app: {
        title: 'Dynamic Calculator with Sliders',
        pages: [
          {
            id: 'calculator-page',
            title: 'Dynamic Calculator',
            route: '/calculator',
            layout: 'vertical',
            components: [
              {
                id: 'intro-text',
                type: 'text',
                label: 'Welcome to the Dynamic Calculator',
                props: {
                  helperText:
                    'Use the sliders below to adjust values and see real-time calculations. This form demonstrates slider-range components and expression engine functionality.',
                },
              },
              {
                id: 'price',
                type: 'slider-range',
                label: 'Product Price',
                props: {
                  min: 0,
                  max: 1000,
                  step: 10,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Adjust the product price using the slider',
                },
                validation: {
                  required: true,
                  min: 10,
                  max: 1000,
                },
              },
              {
                id: 'quantity',
                type: 'slider-range',
                label: 'Quantity',
                props: {
                  min: 1,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Select the quantity you want to purchase',
                },
                validation: {
                  required: true,
                  min: 1,
                  max: 100,
                },
              },
              {
                id: 'subtotal',
                type: 'input',
                label: 'Subtotal',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Automatically calculated: Price × Quantity',
                },
                expression: {
                  expression: 'price * quantity',
                  mode: 'value',
                  dependencies: ['price', 'quantity'],
                  evaluateOnChange: true,
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'taxRate',
                type: 'slider-range',
                label: 'Tax Rate (%)',
                props: {
                  min: 0,
                  max: 25,
                  step: 0.5,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Set the tax rate percentage',
                },
                validation: {
                  required: true,
                  min: 0,
                  max: 25,
                },
              },
              {
                id: 'taxAmount',
                type: 'input',
                label: 'Tax Amount',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Automatically calculated: Subtotal × Tax Rate',
                },
                expression: {
                  expression: 'subtotal * (taxRate / 100)',
                  mode: 'value',
                  dependencies: ['subtotal', 'taxRate'],
                  evaluateOnChange: true,
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'discountRange',
                type: 'slider-range',
                label: 'Discount Range',
                props: {
                  min: 0,
                  max: 200,
                  step: 5,
                  showLabels: true,
                  showValue: true,
                  mode: 'range',
                  helperText:
                    'Select a discount range (min and max discount amount)',
                },
                validation: {
                  required: true,
                  minRange: 10,
                  maxRange: 200,
                },
              },
              {
                id: 'discountAmount',
                type: 'input',
                label: 'Discount Amount',
                props: {
                  inputType: 'number',
                  placeholder: 'Enter discount amount',
                  helperText:
                    'Enter a discount amount within the selected range',
                },
                validation: {
                  required: true,
                  minValueMin: 0,
                  maxValueMax: 200,
                },
              },
              {
                id: 'total',
                type: 'input',
                label: 'Total Amount',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Final total: Subtotal + Tax - Discount',
                },
                expression: {
                  expression: 'subtotal + taxAmount - discountAmount',
                  mode: 'value',
                  dependencies: ['subtotal', 'taxAmount', 'discountAmount'],
                  evaluateOnChange: true,
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'summary',
                type: 'textarea',
                label: 'Order Summary',
                props: {
                  readOnly: true,
                  rows: 4,
                  helperText: 'Dynamic summary based on your selections',
                },
                expression: {
                  expression: 'total',
                  mode: 'value',
                  dependencies: ['total'],
                  evaluateOnChange: true,
                },
              },
              {
                id: 'submit-order',
                type: 'button',
                label: 'Place Order',
                props: {
                  className: 'primary',
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Order Placed Successfully!',
          message:
            'Thank you for your order. Your dynamic calculation has been processed.',
          showRestartButton: true,
        },
      },
    },
  },
  {
    name: 'Advanced Expression Demo',
    description:
      'Comprehensive form demonstrating various expression modes and complex calculations',
    prompt:
      'Create a form that demonstrates all expression modes including value, visibility, validation, disabled, required, label, and helperText with complex calculations',
    json: {
      app: {
        title: 'Advanced Expression Demo',
        pages: [
          {
            id: 'expression-demo',
            title: 'Expression Engine Demo',
            route: '/demo',
            layout: 'vertical',
            components: [
              {
                id: 'intro-text',
                type: 'text',
                label: 'Expression Engine Demonstration',
                props: {
                  helperText:
                    'This form demonstrates various expression modes and complex calculations using the expression engine.',
                },
              },
              {
                id: 'userType',
                type: 'select',
                label: 'User Type',
                props: {
                  options: [
                    { label: 'Individual', value: 'individual' },
                    { label: 'Business', value: 'business' },
                    { label: 'Non-Profit', value: 'nonprofit' },
                  ],
                  helperText:
                    'Select your user type to see dynamic form behavior',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'age',
                type: 'slider-range',
                label: 'Age',
                props: {
                  min: 18,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Your age affects available options',
                },
                validation: {
                  required: true,
                  min: 18,
                  max: 100,
                },
              },
              {
                id: 'ageStatus',
                type: 'input',
                label: 'Age Status',
                props: {
                  readOnly: true,
                  helperText: 'Dynamic age category based on your age',
                },
                expression: {
                  expression:
                    'age.value < 25 ? "Young Adult" : age.value < 65 ? "Adult" : "Senior"',
                  mode: 'value',
                  dependencies: ['age'],
                  evaluateOnChange: true,
                },
              },
              {
                id: 'discountCode',
                type: 'input',
                label: 'Discount Code',
                props: {
                  placeholder: 'Enter discount code',
                  helperText: 'This field is only visible for business users',
                },
                expression: {
                  expression: 'userType.value == "business"',
                  mode: 'visibility',
                  dependencies: ['userType'],
                  evaluateOnChange: true,
                },
                validation: {
                  required: false,
                },
              },
              {
                id: 'discountHelper',
                type: 'text',
                label: 'Discount Information',
                props: {
                  helperText: 'Dynamic helper text based on user type',
                },
                expression: {
                  expression:
                    'userType.value == "business" ? "Business users get 10% discount" : userType.value == "nonprofit" ? "Non-profit users get 15% discount" : "Individual users get standard pricing"',
                  mode: 'helperText',
                  dependencies: ['userType'],
                  evaluateOnChange: true,
                },
              },
              {
                id: 'email',
                type: 'input',
                label: 'Email Address',
                props: {
                  inputType: 'email',
                  placeholder: 'Enter your email',
                  helperText: 'Email validation changes based on user type',
                },
                expression: {
                  expression:
                    'userType.value == "business" ? "Business email validation is stricter" : "Standard email validation"',
                  mode: 'helperText',
                  dependencies: ['userType'],
                  evaluateOnChange: true,
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
                  inputType: 'tel',
                  placeholder: 'Enter your phone number',
                  helperText: 'Phone field is required for business users',
                },
                expression: {
                  expression: 'userType.value == "business"',
                  mode: 'required',
                  dependencies: ['userType'],
                  evaluateOnChange: true,
                },
                validation: {
                  required: false,
                  pattern: '^\\+?[0-9\\-\\s]{7,15}$',
                },
              },
              {
                id: 'newsletter',
                type: 'checkbox',
                label: 'Subscribe to Newsletter',
                props: {
                  helperText:
                    'Newsletter subscription is disabled for non-profit users',
                },
                expression: {
                  expression: 'userType.value != "nonprofit"',
                  mode: 'disabled',
                  dependencies: ['userType'],
                  evaluateOnChange: true,
                },
              },
              {
                id: 'terms',
                type: 'checkbox',
                label: 'Terms and Conditions',
                props: {
                  helperText: 'Dynamic label based on user type',
                },
                expression: {
                  expression:
                    'userType.value == "business" ? "Business Terms and Conditions" : userType.value == "nonprofit" ? "Non-Profit Terms and Conditions" : "Individual Terms and Conditions"',
                  mode: 'label',
                  dependencies: ['userType'],
                  evaluateOnChange: true,
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'complexCalculation',
                type: 'input',
                label: 'Complex Calculation Result',
                props: {
                  readOnly: true,
                  helperText:
                    'Complex calculation using multiple fields and Math functions',
                },
                expression: {
                  expression:
                    'round((age.value * 2.5 + (userType.value == "business" ? 100 : userType.value == "nonprofit" ? 50 : 0)) * 1.1)',
                  mode: 'value',
                  dependencies: ['age', 'userType'],
                  evaluateOnChange: true,
                },
              },
              {
                id: 'conditionalMessage',
                type: 'textarea',
                label: 'Personalized Message',
                props: {
                  readOnly: true,
                  rows: 3,
                  helperText: 'Dynamic message based on all form inputs',
                },
                expression: {
                  expression: 'age.value * 2.5',
                  mode: 'value',
                  dependencies: ['age'],
                  evaluateOnChange: true,
                },
              },
              {
                id: 'submit-demo',
                type: 'button',
                label: 'Submit Demo',
                props: {
                  className: 'primary',
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Demo Submitted Successfully!',
          message:
            'Thank you for testing the advanced expression engine demo. All calculations and dynamic behaviors have been processed.',
          showRestartButton: true,
        },
      },
    },
  },
  {
    name: 'Product List with Auto-Calculated Totals',
    description:
      'Dynamic product list with automatic line totals, subtotals, and grand total calculations using intelligent expression engine',
    prompt:
      'Create a product list form with dynamic arrays where line totals, subtotals, and grand totals are calculated automatically using expressions',
    json: {
      app: {
        title: 'Product List with Totals',
        pages: [
          {
            id: 'productList',
            title: 'Add Products',
            route: '/add-products',
            layout: 'vertical',
            components: [
              {
                id: 'products',
                type: 'array',
                label: 'Products',
                props: {
                  helperText:
                    'Add one or more products with quantity and unit price',
                },
                arrayItems: [
                  {
                    id: 'productItem',
                    components: [
                      {
                        id: 'productName',
                        type: 'input',
                        label: 'Product Name',
                        props: {
                          placeholder: 'Enter product name',
                          helperText: 'Provide a short descriptive name',
                        },
                        validation: {
                          required: true,
                          minLength: 1,
                          maxLength: 100,
                          errorMessages: {
                            required: 'Please enter the product name',
                            minLength:
                              'Product name must be at least {minLength} character',
                            maxLength:
                              'Product name cannot exceed {maxLength} characters',
                          },
                        },
                      },
                      {
                        id: 'quantity',
                        type: 'input',
                        label: 'Quantity',
                        props: {
                          inputType: 'number',
                          placeholder: 'Enter quantity',
                          helperText: 'Enter the quantity (whole number)',
                        },
                        validation: {
                          required: true,
                          min: 1,
                          max: 1000000,
                          errorMessages: {
                            required: 'Please enter a quantity',
                            invalidNumber: 'Please enter a valid number',
                            min: 'Quantity must be at least {min}',
                            max: 'Quantity cannot exceed {max}',
                          },
                        },
                      },
                      {
                        id: 'unitPrice',
                        type: 'input',
                        label: 'Unit Price',
                        props: {
                          inputType: 'number',
                          placeholder: 'Enter unit price',
                          helperText: 'Enter price per unit in your currency',
                        },
                        validation: {
                          required: true,
                          min: 0,
                          max: 100000000,
                          errorMessages: {
                            required: 'Please enter a unit price',
                            invalidNumber: 'Please enter a valid number',
                            min: 'Price must be at least {min}',
                            max: 'Price cannot exceed {max}',
                          },
                        },
                      },
                      {
                        id: 'lineTotal',
                        type: 'input',
                        label: 'Line Total',
                        expression: {
                          expression:
                            'parseFloat(quantity) * parseFloat(unitPrice)',
                          mode: 'value',
                          dependencies: ['quantity', 'unitPrice'],
                          evaluateOnChange: true,
                          debounceMs: 100,
                          defaultValue: 0,
                          calculatedFieldHelperText: 'Calculated automatically',
                        },
                        props: {
                          inputType: 'number',
                          readOnly: true,
                          helperText: 'Calculated automatically',
                        },
                        validation: {
                          required: true,
                          errorMessages: {
                            required: 'Line total is required',
                          },
                        },
                      },
                    ],
                  },
                ],
                validation: {
                  minItems: 1,
                  errorMessages: {
                    minItems: 'Add at least {minItems} product',
                  },
                },
              },
              {
                id: 'subtotal',
                type: 'input',
                label: 'Subtotal',
                expression: {
                  expression: 'sumLineTotal(products)',
                  mode: 'value',
                  dependencies: ['products'],
                  evaluateOnChange: true,
                  debounceMs: 100,
                  defaultValue: 0,
                  calculatedFieldHelperText:
                    'Calculated automatically from all line totals',
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
                },
                validation: {
                  required: true,
                  errorMessages: {
                    required: 'Subtotal is required',
                  },
                },
              },
              {
                id: 'taxPercent',
                type: 'input',
                label: 'Tax (%)',
                props: {
                  inputType: 'number',
                  placeholder: 'Enter tax percent if applicable',
                  helperText:
                    'Enter tax percent to apply to subtotal (optional)',
                },
                validation: {
                  required: false,
                  min: 0,
                  max: 100,
                  errorMessages: {
                    invalidNumber: 'Please enter a valid percentage',
                    min: 'Tax percent cannot be less than {min}',
                    max: 'Tax percent cannot exceed {max}',
                  },
                },
              },
              {
                id: 'grandTotal',
                type: 'input',
                label: 'Grand Total',
                expression: {
                  expression:
                    'subtotal + (subtotal * parseFloat(taxPercent) / 100)',
                  mode: 'value',
                  dependencies: ['subtotal', 'taxPercent'],
                  evaluateOnChange: true,
                  debounceMs: 100,
                  defaultValue: 0,
                  calculatedFieldHelperText: 'Subtotal plus tax',
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
                },
                validation: {
                  required: true,
                  errorMessages: {
                    required: 'Grand total is required',
                  },
                },
              },
              {
                id: 'reviewSection',
                type: 'section',
                label: 'Review',
                children: [
                  {
                    id: 'reviewText',
                    type: 'text',
                    label: 'Summary',
                    props: {
                      helperText:
                        "Products count: {{products.length}}\nSubtotal: {{subtotal}}\nTax: {{taxPercent}}%\nGrand Total: {{grandTotal}}\n\nAll calculations are performed automatically using the expression engine's array aggregation functions.",
                    },
                  },
                ],
              },
              {
                id: 'submitButton',
                type: 'button',
                label: 'Submit',
                props: {
                  className: 'btn-primary',
                  helperText: 'Submit the product list',
                },
              },
            ],
            isEndPage: true,
          },
        ],
        dataSources: [
          {
            id: 'saveProductsAPI',
            type: 'rest',
            method: 'POST',
            url: 'https://api.example.com/products',
            params: {},
            responseMapping: {
              status: 'status',
              id: 'data.id',
            },
          },
        ],
        thankYouPage: {
          title: 'Thank You!',
          message: 'Your product list was submitted successfully.',
          showRestartButton: true,
          customActions: [
            {
              label: 'View Products',
              action: 'custom',
              customAction: 'openProductList',
              className: 'bg-blue-600 text-white',
            },
          ],
        },
      },
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      languageDetails: [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
        },
      ],
    },
  },
];
