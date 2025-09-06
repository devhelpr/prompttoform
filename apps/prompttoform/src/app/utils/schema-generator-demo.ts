import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

// Demo form to showcase the improvements
const demoForm: FormDefinition = {
  app: {
    title: 'Improved Schema Demo',
    pages: [
      {
        id: 'main',
        title: 'Main Form',
        route: '/main',
        components: [
          {
            type: 'input',
            id: 'name',
            label: 'Full Name',
            validation: {
              required: true,
              minLength: 2,
              maxLength: 100,
            },
            props: {
              inputType: 'text',
              placeholder: 'Enter your full name',
              helperText: 'Please provide your complete name',
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
              { label: 'France', value: 'fr' },
            ],
          },
          {
            type: 'radio',
            id: 'userType',
            label: 'User Type',
            validation: {
              required: true,
            },
            options: [
              { label: 'Individual', value: 'individual' },
              { label: 'Business', value: 'business' },
              { label: 'Organization', value: 'organization' },
            ],
          },
          {
            type: 'checkbox',
            id: 'newsletter',
            label: 'Subscribe to Newsletter',
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
              placeholder: 'Any additional comments...',
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
                      { label: 'Expert', value: 'expert' },
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
      message: 'Your form has been submitted successfully.',
      showRestartButton: true,
    },
  },
};

export function demonstrateImprovedSchema() {
  console.log('=== IMPROVED SCHEMA GENERATOR DEMO ===');

  const schema = generateJsonSchema(demoForm);

  console.log('\n📋 Generated Schema Overview:');
  console.log(`Schema Version: ${schema.$schema}`);
  console.log(`Title: ${schema.title}`);
  console.log(`Description: ${schema.description}`);
  console.log(`Total Properties: ${Object.keys(schema.properties).length}`);
  console.log(`Required Fields: ${schema.required.length}`);

  console.log('\n🔍 Field Analysis:');
  Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
    console.log(`\n${fieldName}:`);
    console.log(`  Type: ${fieldSchema.type}`);
    console.log(`  Title: ${fieldSchema.title}`);
    console.log(`  Description: ${fieldSchema.description}`);

    if (fieldSchema.enum) {
      console.log(`  Options: ${fieldSchema.enumNames?.join(', ')}`);
    }

    if (fieldSchema.format) {
      console.log(`  Format: ${fieldSchema.format}`);
    }

    if (fieldSchema.minLength || fieldSchema.maxLength) {
      console.log(
        `  Length: ${fieldSchema.minLength || 0}-${
          fieldSchema.maxLength || 'unlimited'
        }`
      );
    }

    if (fieldSchema.minimum || fieldSchema.maximum) {
      console.log(
        `  Range: ${fieldSchema.minimum || 'unlimited'}-${
          fieldSchema.maximum || 'unlimited'
        }`
      );
    }
  });

  console.log('\n✅ Key Improvements:');
  console.log('1. ✅ Excluded "text" type fields (display-only)');
  console.log('2. ✅ Strict enum constraints for radio/select fields');
  console.log('3. ✅ Improved field descriptions with context');
  console.log('4. ✅ Better validation rule descriptions');
  console.log('5. ✅ Comprehensive metadata tracking');
  console.log('6. ✅ No conflicting validation rules for enum fields');

  return schema;
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).demonstrateImprovedSchema = demonstrateImprovedSchema;
}
