import { generateJsonSchema } from './schema-generator';

// Simple test form
const testForm = {
  app: {
    title: 'Health Check Wizard',
    pages: [
      {
        id: 'symptom',
        title: 'Do you have any of these symptoms?',
        route: '/symptom',
        layout: 'vertical',
        components: [
          {
            id: 'symptomRadio',
            type: 'radio' as const,
            label: 'Select your symptom',
            props: {
              options: [
                { label: 'Fever', value: 'fever' },
                { label: 'Cough', value: 'cough' },
                { label: 'Shortness of breath', value: 'breath' },
                { label: 'None of the above', value: 'none' },
              ],
            },
            validation: { required: true },
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
            type: 'select' as const,
            label: 'Duration',
            props: {
              options: [
                { label: 'Less than 3 days', value: 'short' },
                { label: '3 days or more', value: 'long' },
              ],
            },
            validation: { required: true },
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
            type: 'radio' as const,
            label: 'Severity',
            props: {
              options: [
                { label: 'Mild', value: 'mild' },
                { label: 'Moderate', value: 'moderate' },
                { label: 'Severe', value: 'severe' },
              ],
            },
            validation: { required: true },
          },
        ],
        nextPage: 'noDoctor',
      },
      {
        id: 'noDoctor',
        title: 'No Doctor Visit Needed',
        route: '/no-doctor',
        layout: 'vertical',
        components: [
          {
            id: 'noDoctorText',
            type: 'text' as const,
            label: 'No Doctor Visit Needed',
            props: {
              helperText:
                'Based on your answers, a doctor visit is not necessary at this time.',
            },
          },
        ],
        isEndPage: true,
      },
    ],
  },
};

export function verifySchemaStructure() {
  console.log('=== SCHEMA STRUCTURE VERIFICATION ===');

  const schema = generateJsonSchema(testForm);

  console.log('\n📋 Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  console.log('\n🔍 Key Checks:');

  // Check 1: Only symptomRadio in required array
  const hasOnlySymptomRadioRequired =
    schema.required &&
    schema.required.length === 1 &&
    schema.required[0] === 'symptomRadio';

  console.log(
    `✅ Only symptomRadio in required: ${hasOnlySymptomRadioRequired}`
  );
  console.log(`   Required fields: ${JSON.stringify(schema.required)}`);

  // Check 2: Has conditional validation
  const hasConditionalValidation = schema.allOf && schema.allOf.length > 0;
  console.log(`✅ Has conditional validation: ${hasConditionalValidation}`);

  if (hasConditionalValidation && schema.allOf) {
    console.log(`   Number of conditional rules: ${schema.allOf.length}`);

    // Check 3: First rule forbids fields when symptomRadio is "none"
    const firstRule = schema.allOf[0];
    const hasForbidRule =
      firstRule.if?.properties?.symptomRadio?.const === 'none' &&
      firstRule.then?.not?.anyOf;

    console.log(`✅ Has forbid rule for "none": ${hasForbidRule}`);

    // Check 4: Second rule requires fields when symptomRadio is not "none"
    const secondRule = schema.allOf[1];
    const hasRequireRule =
      secondRule.if?.properties?.symptomRadio?.enum &&
      secondRule.then?.required;

    console.log(`✅ Has require rule for not "none": ${hasRequireRule}`);

    if (hasRequireRule) {
      console.log(
        `   Required when not "none": ${JSON.stringify(
          secondRule.then.required
        )}`
      );
    }
  }

  // Check 5: Properties have correct enums
  const hasCorrectEnums =
    schema.properties.symptomRadio?.enum?.join(',') ===
      'fever,cough,breath,none' &&
    schema.properties.durationSelect?.enum?.join(',') === 'short,long' &&
    schema.properties.severityRadio?.enum?.join(',') === 'mild,moderate,severe';

  console.log(`✅ Properties have correct enums: ${hasCorrectEnums}`);

  const isCorrect = hasOnlySymptomRadioRequired && hasConditionalValidation;

  console.log(`\n🎉 Schema Structure: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

  return {
    schema,
    isCorrect,
    checks: {
      hasOnlySymptomRadioRequired,
      hasConditionalValidation,
      hasCorrectEnums,
    },
  };
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).verifySchemaStructure = verifySchemaStructure;
}
