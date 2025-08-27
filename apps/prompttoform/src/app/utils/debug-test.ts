import { generateJsonSchema } from './schema-generator';

// Simple test to debug the issue
const simpleTestForm = {
  app: {
    title: 'Simple Test',
    pages: [
      {
        id: 'main',
        title: 'Main Page',
        route: '/main',
        components: [
          {
            type: 'input',
            id: 'firstName',
            label: 'First Name',
            validation: { required: true },
            props: { inputType: 'text' },
          },
          {
            type: 'input',
            id: 'lastName',
            label: 'Last Name',
            validation: { required: true },
            props: { inputType: 'text' },
          },
          {
            type: 'input',
            id: 'email',
            label: 'Email',
            validation: { required: true },
            props: { inputType: 'email' },
          },
        ],
      },
    ],
  },
};

export function debugSchemaGeneration() {
  console.log('=== DEBUG SCHEMA GENERATION ===');

  const schema = generateJsonSchema(simpleTestForm);

  console.log('\n📋 Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  console.log('\n🔍 Analysis:');
  console.log(`Required fields: ${JSON.stringify(schema.required)}`);
  console.log(`Expected: ["firstName", "lastName", "email"]`);
  console.log(
    `Match: ${
      JSON.stringify(schema.required) ===
      JSON.stringify(['firstName', 'lastName', 'email'])
    }`
  );

  return schema;
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).debugSchemaGeneration = debugSchemaGeneration;
}

