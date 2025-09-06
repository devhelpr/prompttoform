// Simple test script to check schema generator
const { generateJsonSchema } = require('./src/app/utils/schema-generator.ts');

const simpleForm = {
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
        ],
      },
    ],
  },
};

try {
  const schema = generateJsonSchema(simpleForm);
  console.log('Schema generated successfully:');
  console.log(JSON.stringify(schema, null, 2));
} catch (error) {
  console.error('Error generating schema:', error);
}

