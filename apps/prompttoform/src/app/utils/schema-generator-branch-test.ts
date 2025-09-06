import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

// Test form that matches the user's example with branches
const branchTestForm: FormDefinition = {
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

export function testBranchBasedConditionalValidation() {
  console.log('=== BRANCH-BASED CONDITIONAL VALIDATION TEST ===');

  const schema = generateJsonSchema(branchTestForm);

  console.log('\n📋 Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  console.log('\n🔍 Analysis:');
  console.log(`Top-level required fields: ${JSON.stringify(schema.required)}`);
  console.log(`Has allOf conditional validation: ${!!schema.allOf}`);

  if (schema.allOf) {
    console.log(`Number of conditional rules: ${schema.allOf.length}`);

    schema.allOf.forEach((rule, index) => {
      console.log(`\nRule ${index + 1}:`);
      console.log(`  If: ${JSON.stringify(rule.if)}`);
      console.log(`  Then: ${JSON.stringify(rule.then)}`);
    });
  }

  console.log('\n🧪 Test Cases:');

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

  console.log('\n✅ Expected Schema Behavior:');
  console.log('1. symptomRadio: Always required');
  console.log('2. durationSelect: Required only when symptomRadio != "none"');
  console.log('3. severityRadio: Required only when symptomRadio != "none"');
  console.log(
    '4. When symptomRadio == "none": durationSelect and severityRadio should be forbidden'
  );
  console.log(
    '5. When symptomRadio != "none": durationSelect and severityRadio should be required'
  );

  // Check if the schema structure is correct
  const hasCorrectRequired =
    schema.required.includes('symptomRadio') &&
    !schema.required.includes('durationSelect') &&
    !schema.required.includes('severityRadio');

  const hasConditionalRules = schema.allOf && schema.allOf.length > 0;

  console.log('\n🔍 Schema Validation:');
  console.log(`✅ Correct required fields: ${hasCorrectRequired}`);
  console.log(`✅ Has conditional rules: ${hasConditionalRules}`);

  if (hasConditionalRules && schema.allOf) {
    const hasRequireRule = schema.allOf.some(
      (rule) =>
        rule.then &&
        rule.then.required &&
        rule.then.required.includes('durationSelect')
    );
    const hasForbidRule = schema.allOf.some(
      (rule) =>
        rule.then &&
        rule.then.not &&
        rule.then.not.anyOf &&
        rule.then.not.anyOf.some(
          (condition: any) =>
            condition.required && condition.required.includes('durationSelect')
        )
    );

    console.log(`✅ Has require rule: ${hasRequireRule}`);
    console.log(`✅ Has forbid rule: ${hasForbidRule}`);
  }

  return {
    schema,
    testCases: [testCase1, testCase2, testCase3, testCase4],
    isValid: hasCorrectRequired && hasConditionalRules,
  };
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).testBranchBasedConditionalValidation =
    testBranchBasedConditionalValidation;
}
