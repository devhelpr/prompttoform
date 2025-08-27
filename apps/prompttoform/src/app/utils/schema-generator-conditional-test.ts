import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

// Test form with conditional validation similar to the user's example
const conditionalTestForm: FormDefinition = {
  app: {
    title: 'Health Check Wizard',
    pages: [
      {
        id: 'symptoms',
        title: 'Symptoms',
        route: '/symptoms',
        components: [
          {
            type: 'radio',
            id: 'symptomRadio',
            label: 'What symptoms are you experiencing?',
            validation: { required: true },
            options: [
              { label: 'Fever', value: 'fever' },
              { label: 'Cough', value: 'cough' },
              { label: 'Breathing difficulty', value: 'breath' },
              { label: 'None', value: 'none' },
            ],
          },
          {
            type: 'select',
            id: 'durationSelect',
            label: 'How long have you had symptoms?',
            validation: { required: true },
            visibilityConditions: [
              {
                field: 'symptomRadio',
                operator: '!=',
                value: 'none',
              },
            ],
            options: [
              { label: 'Less than 24 hours', value: 'short' },
              { label: 'More than 24 hours', value: 'long' },
            ],
          },
          {
            type: 'radio',
            id: 'severityRadio',
            label: 'How severe are your symptoms?',
            validation: { required: true },
            visibilityConditions: [
              {
                field: 'symptomRadio',
                operator: '!=',
                value: 'none',
              },
            ],
            options: [
              { label: 'Mild', value: 'mild' },
              { label: 'Moderate', value: 'moderate' },
              { label: 'Severe', value: 'severe' },
            ],
          },
        ],
      },
    ],
  },
};

export function testConditionalValidation() {
  console.log('=== CONDITIONAL VALIDATION TEST ===');

  const schema = generateJsonSchema(conditionalTestForm);

  console.log('\n📋 Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  console.log('\n🔍 Conditional Validation Analysis:');

  // Check if conditional validation is properly set up
  const hasAllOf = schema.allOf && schema.allOf.length > 0;
  console.log(`Has allOf conditional validation: ${hasAllOf}`);

  if (hasAllOf) {
    console.log(`Number of conditional rules: ${schema.allOf.length}`);

    schema.allOf.forEach((rule, index) => {
      console.log(`\nRule ${index + 1}:`);
      console.log(`  If: ${JSON.stringify(rule.if)}`);
      console.log(`  Then: ${JSON.stringify(rule.then)}`);
    });
  }

  // Check required fields
  console.log(
    `\nTop-level required fields: ${JSON.stringify(schema.required)}`
  );

  // Test validation scenarios
  console.log('\n🧪 Validation Test Scenarios:');

  // Scenario 1: No symptoms (should only require symptomRadio)
  const noSymptomsData = {
    symptomRadio: 'none',
  };

  // Scenario 2: Has symptoms (should require all three fields)
  const hasSymptomsData = {
    symptomRadio: 'fever',
    durationSelect: 'short',
    severityRadio: 'mild',
  };

  // Scenario 3: Invalid - has symptoms but missing required fields
  const invalidSymptomsData = {
    symptomRadio: 'cough',
    // Missing durationSelect and severityRadio
  };

  // Scenario 4: Invalid - no symptoms but has extra fields
  const invalidNoSymptomsData = {
    symptomRadio: 'none',
    durationSelect: 'short', // Should not be allowed
    severityRadio: 'mild', // Should not be allowed
  };

  console.log('\n✅ Expected Validation Results:');
  console.log('1. No symptoms data: Should pass (only symptomRadio required)');
  console.log('2. Has symptoms data: Should pass (all three fields required)');
  console.log(
    '3. Invalid symptoms data: Should fail (missing required fields)'
  );
  console.log(
    '4. Invalid no symptoms data: Should fail (extra fields not allowed)'
  );

  console.log('\n📝 Schema Structure:');
  console.log(
    '- symptomRadio: Always required, enum ["fever", "cough", "breath", "none"]'
  );
  console.log('- durationSelect: Required only when symptomRadio != "none"');
  console.log('- severityRadio: Required only when symptomRadio != "none"');

  return {
    schema,
    testScenarios: {
      noSymptomsData,
      hasSymptomsData,
      invalidSymptomsData,
      invalidNoSymptomsData,
    },
    hasConditionalValidation: hasAllOf,
  };
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).testConditionalValidation = testConditionalValidation;
}
