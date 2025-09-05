import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

// Test form that matches the user's example exactly
const finalTestForm: FormDefinition = {
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
};

export function testFinalSchemaGeneration() {
  console.log('=== FINAL SCHEMA GENERATION TEST ===');

  const schema = generateJsonSchema(finalTestForm);

  console.log('\n📋 Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  // Expected schema structure
  const expectedSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Health Check Wizard - Form Data Schema',
    type: 'object',
    properties: {
      symptomRadio: {
        type: 'string',
        enum: ['fever', 'cough', 'breath', 'none'],
      },
      durationSelect: {
        type: 'string',
        enum: ['short', 'long'],
      },
      severityRadio: {
        type: 'string',
        enum: ['mild', 'moderate', 'severe'],
      },
    },
    additionalProperties: false,
    required: ['symptomRadio'],
    allOf: [
      {
        if: {
          properties: { symptomRadio: { const: 'none' } },
          required: ['symptomRadio'],
        },
        then: {
          not: {
            anyOf: [
              { required: ['durationSelect'] },
              { required: ['severityRadio'] },
            ],
          },
        },
      },
      {
        if: {
          properties: { symptomRadio: { enum: ['fever', 'cough', 'breath'] } },
          required: ['symptomRadio'],
        },
        then: {
          required: ['durationSelect', 'severityRadio'],
        },
      },
    ],
  };

  console.log('\n🎯 Expected Schema:');
  console.log(JSON.stringify(expectedSchema, null, 2));

  console.log('\n🔍 Comparison:');

  // Check key properties
  const hasCorrectSchema = schema.$schema === expectedSchema.$schema;
  const hasCorrectTitle = schema.title === expectedSchema.title;
  const hasCorrectType = schema.type === expectedSchema.type;
  const hasCorrectRequired =
    JSON.stringify(schema.required) === JSON.stringify(expectedSchema.required);
  const hasCorrectAdditionalProperties =
    schema.additionalProperties === expectedSchema.additionalProperties;

  console.log(`✅ Correct $schema: ${hasCorrectSchema}`);
  console.log(`✅ Correct title: ${hasCorrectTitle}`);
  console.log(`✅ Correct type: ${hasCorrectType}`);
  console.log(`✅ Correct required: ${hasCorrectRequired}`);
  console.log(
    `✅ Correct additionalProperties: ${hasCorrectAdditionalProperties}`
  );

  // Check properties
  const hasCorrectProperties =
    schema.properties.symptomRadio?.enum?.join(',') ===
      expectedSchema.properties.symptomRadio.enum.join(',') &&
    schema.properties.durationSelect?.enum?.join(',') ===
      expectedSchema.properties.durationSelect.enum.join(',') &&
    schema.properties.severityRadio?.enum?.join(',') ===
      expectedSchema.properties.severityRadio.enum.join(',');

  console.log(`✅ Correct properties: ${hasCorrectProperties}`);

  // Check allOf structure
  const hasCorrectAllOf = schema.allOf && schema.allOf.length === 2;
  console.log(`✅ Has correct allOf structure: ${hasCorrectAllOf}`);

  if (hasCorrectAllOf && schema.allOf) {
    const firstRule = schema.allOf[0];
    const secondRule = schema.allOf[1];

    const hasCorrectFirstRule =
      firstRule.if?.properties?.symptomRadio?.const === 'none' &&
      firstRule.then?.not?.anyOf?.length === 2;

    const hasCorrectSecondRule =
      secondRule.if?.properties?.symptomRadio?.enum?.join(',') ===
        'fever,cough,breath' &&
      secondRule.then?.required?.join(',') === 'durationSelect,severityRadio';

    console.log(
      `✅ Correct first rule (forbid when none): ${hasCorrectFirstRule}`
    );
    console.log(
      `✅ Correct second rule (require when not none): ${hasCorrectSecondRule}`
    );
  }

  console.log('\n🧪 Validation Test Cases:');

  // Test case 1: No symptoms (should be valid)
  const testCase1 = { symptomRadio: 'none' };
  console.log(`\nTest Case 1: ${JSON.stringify(testCase1)}`);
  console.log('Expected: VALID (only symptomRadio required when no symptoms)');

  // Test case 2: Has symptoms (should be valid)
  const testCase2 = {
    symptomRadio: 'fever',
    durationSelect: 'short',
    severityRadio: 'mild',
  };
  console.log(`\nTest Case 2: ${JSON.stringify(testCase2)}`);
  console.log('Expected: VALID (all three fields required when has symptoms)');

  // Test case 3: Has symptoms but missing required fields (should be invalid)
  const testCase3 = { symptomRadio: 'cough' };
  console.log(`\nTest Case 3: ${JSON.stringify(testCase3)}`);
  console.log('Expected: INVALID (missing durationSelect and severityRadio)');

  // Test case 4: No symptoms but has extra fields (should be invalid)
  const testCase4 = {
    symptomRadio: 'none',
    durationSelect: 'short',
  };
  console.log(`\nTest Case 4: ${JSON.stringify(testCase4)}`);
  console.log(
    'Expected: INVALID (durationSelect not allowed when no symptoms)'
  );

  const isCorrect =
    hasCorrectSchema &&
    hasCorrectTitle &&
    hasCorrectType &&
    hasCorrectRequired &&
    hasCorrectAdditionalProperties &&
    hasCorrectProperties &&
    hasCorrectAllOf;

  console.log(`\n🎉 Schema Generation: ${isCorrect ? 'SUCCESS' : 'FAILED'}`);

  return {
    schema,
    expectedSchema,
    isCorrect,
    testCases: [testCase1, testCase2, testCase3, testCase4],
  };
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).testFinalSchemaGeneration = testFinalSchemaGeneration;
}
