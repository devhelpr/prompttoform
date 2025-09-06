import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

// Example form definition with complex features
const exampleForm: FormDefinition = {
  app: {
    title: 'Enhanced User Registration',
    pages: [
      {
        id: 'personal',
        title: 'Personal Information',
        route: '/personal',
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
            id: 'email',
            label: 'Email Address',
            validation: {
              required: true,
            },
            props: {
              inputType: 'email',
              placeholder: 'Enter your email',
            },
          },
          {
            type: 'select',
            id: 'userType',
            label: 'User Type',
            validation: {
              required: true,
            },
            options: [
              { label: 'Individual', value: 'individual' },
              { label: 'Business', value: 'business' },
            ],
          },
          {
            type: 'input',
            id: 'businessName',
            label: 'Business Name',
            validation: {
              required: true,
            },
            visibilityConditions: [
              {
                field: 'userType',
                operator: '==',
                value: 'business',
              },
            ],
            props: {
              inputType: 'text',
              placeholder: 'Enter business name',
            },
          },
        ],
        branches: [
          {
            condition: {
              field: 'userType',
              operator: '==',
              value: 'business',
            },
            nextPage: 'business-details',
          },
        ],
      },
      {
        id: 'preferences',
        title: 'Preferences',
        route: '/preferences',
        components: [
          {
            type: 'array',
            id: 'skills',
            label: 'Skills',
            validation: {
              minItems: 1,
              maxItems: 5,
            },
            arrayItems: [
              {
                id: 'skill-item',
                components: [
                  {
                    type: 'input',
                    id: 'skillName',
                    label: 'Skill Name',
                    validation: {
                      required: true,
                    },
                    props: {
                      inputType: 'text',
                      placeholder: 'Enter skill name',
                    },
                  },
                  {
                    type: 'select',
                    id: 'skillLevel',
                    label: 'Skill Level',
                    validation: {
                      required: true,
                    },
                    options: [
                      { label: 'Beginner', value: 'beginner' },
                      { label: 'Intermediate', value: 'intermediate' },
                      { label: 'Advanced', value: 'advanced' },
                    ],
                  },
                ],
              },
            ],
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

// Generate and display the schema
export function demonstrateSchemaGeneration() {
  console.log('Generating enhanced JSON schema...');

  const schema = generateJsonSchema(exampleForm);

  console.log('Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  console.log('\nSchema Features:');
  console.log(`- Schema Version: ${schema.$schema}`);
  console.log(`- Title: ${schema.title}`);
  console.log(`- Description: ${schema.description}`);
  console.log(`- Total Properties: ${Object.keys(schema.properties).length}`);
  console.log(`- Required Fields: ${schema.required.length}`);
  console.log(`- Has Conditional Validation: ${!!schema.allOf}`);
  console.log(`- Has Dependent Validation: ${!!schema.dependentRequired}`);

  return schema;
}

// Example usage
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).demonstrateSchemaGeneration = demonstrateSchemaGeneration;
} else {
  // Node.js environment
  demonstrateSchemaGeneration();
}
