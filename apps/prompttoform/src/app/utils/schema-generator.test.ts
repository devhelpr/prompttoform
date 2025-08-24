import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

describe('Enhanced Schema Generator', () => {
  const complexFormDefinition: FormDefinition = {
    app: {
      title: 'Advanced User Registration',
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
              validation: {
                required: true,
                minLength: 2,
                maxLength: 50,
              },
              props: {
                inputType: 'text',
                placeholder: 'Enter your first name',
                helperText: 'Please provide your legal first name',
              },
            },
            {
              type: 'input',
              id: 'lastName',
              label: 'Last Name',
              validation: {
                required: true,
                minLength: 2,
                maxLength: 50,
              },
              props: {
                inputType: 'text',
                placeholder: 'Enter your last name',
              },
            },
            {
              type: 'input',
              id: 'email',
              label: 'Email Address',
              validation: {
                required: true,
              },
              props: {
                inputType: 'email',
                placeholder: 'Enter your email address',
              },
            },
            {
              type: 'input',
              id: 'phone',
              label: 'Phone Number',
              props: {
                inputType: 'tel',
                placeholder: 'Enter your phone number',
              },
            },
            {
              type: 'select',
              id: 'country',
              label: 'Country',
              validation: {
                required: true,
              },
              options: [
                { label: 'United States', value: 'us' },
                { label: 'Canada', value: 'ca' },
                { label: 'United Kingdom', value: 'uk' },
                { label: 'Germany', value: 'de' },
              ],
            },
            {
              type: 'section',
              id: 'address-section',
              label: 'Address Information',
              children: [
                {
                  type: 'input',
                  id: 'street',
                  label: 'Street Address',
                  validation: {
                    required: true,
                  },
                  props: {
                    inputType: 'text',
                    placeholder: 'Enter your street address',
                  },
                },
                {
                  type: 'input',
                  id: 'city',
                  label: 'City',
                  validation: {
                    required: true,
                  },
                  props: {
                    inputType: 'text',
                    placeholder: 'Enter your city',
                  },
                },
                {
                  type: 'input',
                  id: 'zipCode',
                  label: 'ZIP/Postal Code',
                  validation: {
                    required: true,
                    pattern: '^[0-9]{5}(-[0-9]{4})?$',
                  },
                  props: {
                    inputType: 'text',
                    placeholder: 'Enter ZIP code',
                  },
                },
              ],
            },
          ],
          branches: [
            {
              condition: {
                field: 'country',
                operator: '==',
                value: 'us',
              },
              nextPage: 'us-specific',
            },
          ],
        },
        {
          id: 'preferences',
          title: 'Preferences',
          route: '/preferences',
          components: [
            {
              type: 'checkbox',
              id: 'newsletter',
              label: 'Subscribe to newsletter',
            },
            {
              type: 'checkbox',
              id: 'marketing',
              label: 'Receive marketing communications',
            },
            {
              type: 'select',
              id: 'preferredContact',
              label: 'Preferred Contact Method',
              validation: {
                required: true,
              },
              options: [
                { label: 'Email', value: 'email' },
                { label: 'Phone', value: 'phone' },
                { label: 'SMS', value: 'sms' },
              ],
            },
            {
              type: 'textarea',
              id: 'comments',
              label: 'Additional Comments',
              validation: {
                maxLength: 500,
              },
              props: {
                rows: 4,
                placeholder: 'Any additional comments or preferences...',
              },
            },
            {
              type: 'array',
              id: 'interests',
              label: 'Areas of Interest',
              validation: {
                minItems: 1,
                maxItems: 5,
              },
              arrayItems: [
                {
                  id: 'interest-item',
                  components: [
                    {
                      type: 'input',
                      id: 'interestName',
                      label: 'Interest Name',
                      validation: {
                        required: true,
                      },
                      props: {
                        inputType: 'text',
                        placeholder: 'Enter interest area',
                      },
                    },
                    {
                      type: 'select',
                      id: 'interestLevel',
                      label: 'Interest Level',
                      validation: {
                        required: true,
                      },
                      options: [
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'High', value: 'high' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'account',
          title: 'Account Setup',
          route: '/account',
          components: [
            {
              type: 'input',
              id: 'username',
              label: 'Username',
              validation: {
                required: true,
                minLength: 3,
                maxLength: 20,
                pattern: '^[a-zA-Z0-9_]+$',
              },
              props: {
                inputType: 'text',
                placeholder: 'Choose a username',
                helperText: 'Only letters, numbers, and underscores allowed',
              },
            },
            {
              type: 'input',
              id: 'password',
              label: 'Password',
              validation: {
                required: true,
                minLength: 8,
                pattern:
                  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
              },
              props: {
                inputType: 'password',
                placeholder: 'Enter a strong password',
                helperText: 'Must contain uppercase, lowercase, and number',
              },
            },
            {
              type: 'input',
              id: 'confirmPassword',
              label: 'Confirm Password',
              validation: {
                required: true,
              },
              props: {
                inputType: 'password',
                placeholder: 'Confirm your password',
              },
            },
            {
              type: 'date',
              id: 'birthDate',
              label: 'Date of Birth',
              validation: {
                maxDate: '2005-12-31',
              },
            },
          ],
        },
      ],
      thankYouPage: {
        title: 'Thank You!',
        message: 'Your registration has been completed successfully.',
        showRestartButton: true,
      },
    },
  };

  it('should generate comprehensive JSON schema with 2020-12 version', () => {
    const schema = generateJsonSchema(complexFormDefinition);

    // Check schema version and metadata
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toContain('advanced-user-registration');
    expect(schema.title).toBe('Advanced User Registration - Form Data Schema');
    expect(schema.description).toContain('Advanced User Registration');
    expect(schema.description).toContain('3 pages');
    expect(schema.description).toContain('conditional branching logic');

    // Check required fields
    expect(schema.required).toContain('firstName');
    expect(schema.required).toContain('lastName');
    expect(schema.required).toContain('email');
    expect(schema.required).toContain('country');
    expect(schema.required).toContain('street');
    expect(schema.required).toContain('city');
    expect(schema.required).toContain('zipCode');
    expect(schema.required).toContain('preferredContact');
    expect(schema.required).toContain('username');
    expect(schema.required).toContain('password');
    expect(schema.required).toContain('confirmPassword');

    // Check field properties
    expect(schema.properties.firstName).toEqual({
      title: 'First Name',
      description:
        'Please provide your legal first name Field from page: Personal Information',
      type: 'string',
      minLength: 2,
      maxLength: 50,
    });

    expect(schema.properties.email).toEqual({
      title: 'Email Address',
      description: 'Field from page: Personal Information',
      type: 'string',
      format: 'email',
    });

    expect(schema.properties.country).toEqual({
      title: 'Country',
      description: 'Field from page: Personal Information',
      type: 'string',
      enum: ['us', 'ca', 'uk', 'de'],
      enumNames: ['United States', 'Canada', 'United Kingdom', 'Germany'],
    });

    expect(schema.properties.newsletter).toEqual({
      title: 'Subscribe to newsletter',
      description: 'Field from page: Preferences',
      type: 'boolean',
    });

    // Check array field
    expect(schema.properties.interests).toEqual({
      title: 'Areas of Interest',
      description: 'Field from page: Preferences',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          interestName: {
            title: 'Interest Name',
            description: 'Field from page: Preferences',
            type: 'string',
          },
          interestLevel: {
            title: 'Interest Level',
            description: 'Field from page: Preferences',
            type: 'string',
            enum: ['low', 'medium', 'high'],
            enumNames: ['Low', 'Medium', 'High'],
          },
        },
        required: ['interestName', 'interestLevel'],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 5,
    });

    // Check password field with pattern
    expect(schema.properties.password).toEqual({
      title: 'Password',
      description:
        'Must contain uppercase, lowercase, and number Field from page: Account Setup',
      type: 'string',
      format: 'password',
      minLength: 8,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
    });

    // Check date field
    expect(schema.properties.birthDate).toEqual({
      title: 'Date of Birth',
      description: 'Field from page: Account Setup',
      type: 'string',
      format: 'date',
      maximum: '2005-12-31',
    });

    // Check conditional validation
    expect(schema.allOf).toBeDefined();
    expect(schema.dependentRequired).toBeDefined();
  });

  it('should handle form with visibility conditions', () => {
    const formWithConditions: FormDefinition = {
      app: {
        title: 'Conditional Form',
        pages: [
          {
            id: 'main',
            title: 'Main Page',
            route: '/main',
            components: [
              {
                type: 'select',
                id: 'userType',
                label: 'User Type',
                validation: { required: true },
                options: [
                  { label: 'Individual', value: 'individual' },
                  { label: 'Business', value: 'business' },
                ],
              },
              {
                type: 'input',
                id: 'businessName',
                label: 'Business Name',
                validation: { required: true },
                visibilityConditions: [
                  {
                    field: 'userType',
                    operator: '==',
                    value: 'business',
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const schema = generateJsonSchema(formWithConditions);
    expect(schema.allOf).toBeDefined();
    expect(schema.description).toContain('visibility conditions');
  });

  it('should handle empty form definition', () => {
    const emptyForm: FormDefinition = {
      app: {
        title: 'Empty Form',
        pages: [],
      },
    };

    const schema = generateJsonSchema(emptyForm);
    expect(schema.properties).toEqual({});
    expect(schema.required).toEqual([]);
    expect(schema.description).toContain('0 pages');
  });
});
