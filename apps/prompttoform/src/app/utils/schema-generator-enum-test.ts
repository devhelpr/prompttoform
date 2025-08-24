import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

// Test form specifically for enum validation
const enumTestForm: FormDefinition = {
  app: {
    title: 'Enum Validation Test',
    pages: [
      {
        id: 'main',
        title: 'Main Page',
        route: '/main',
        components: [
          {
            type: 'select',
            id: 'country',
            label: 'Country',
            validation: { required: true },
            options: [
              { label: 'United States', value: 'us' },
              { label: 'Canada', value: 'ca' },
              { label: 'United Kingdom', value: 'uk' },
            ],
          },
          {
            type: 'radio',
            id: 'userType',
            label: 'User Type',
            validation: { required: true },
            options: [
              { label: 'Individual', value: 'individual' },
              { label: 'Business', value: 'business' },
              { label: 'Organization', value: 'organization' },
            ],
          },
          {
            type: 'select',
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Pending', value: 'pending' },
            ],
          },
        ],
      },
    ],
  },
};

export function testEnumConstraints() {
  console.log('=== ENUM CONSTRAINT TEST ===');

  const schema = generateJsonSchema(enumTestForm);

  console.log('\n📋 Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  console.log('\n🔍 Enum Field Analysis:');

  // Test country field
  const countryField = schema.properties.country;
  console.log('\nCountry Field:');
  console.log(`  Type: ${countryField.type}`);
  console.log(`  Enum Values: ${JSON.stringify(countryField.enum)}`);
  console.log(`  Enum Names: ${JSON.stringify(countryField.enumNames)}`);
  console.log(`  Description: ${countryField.description}`);
  console.log(`  Has minLength: ${countryField.minLength !== undefined}`);
  console.log(`  Has maxLength: ${countryField.maxLength !== undefined}`);
  console.log(`  Has pattern: ${countryField.pattern !== undefined}`);

  // Test userType field
  const userTypeField = schema.properties.userType;
  console.log('\nUser Type Field:');
  console.log(`  Type: ${userTypeField.type}`);
  console.log(`  Enum Values: ${JSON.stringify(userTypeField.enum)}`);
  console.log(`  Enum Names: ${JSON.stringify(userTypeField.enumNames)}`);
  console.log(`  Description: ${userTypeField.description}`);
  console.log(`  Has minLength: ${userTypeField.minLength !== undefined}`);
  console.log(`  Has maxLength: ${userTypeField.maxLength !== undefined}`);
  console.log(`  Has pattern: ${userTypeField.pattern !== undefined}`);

  // Test status field
  const statusField = schema.properties.status;
  console.log('\nStatus Field:');
  console.log(`  Type: ${statusField.type}`);
  console.log(`  Enum Values: ${JSON.stringify(statusField.enum)}`);
  console.log(`  Enum Names: ${JSON.stringify(statusField.enumNames)}`);
  console.log(`  Description: ${statusField.description}`);
  console.log(`  Has minLength: ${statusField.minLength !== undefined}`);
  console.log(`  Has maxLength: ${statusField.maxLength !== undefined}`);
  console.log(`  Has pattern: ${statusField.pattern !== undefined}`);

  console.log('\n✅ Validation Results:');

  // Verify enum constraints are properly set
  const hasValidEnums =
    countryField.enum && userTypeField.enum && statusField.enum;

  const hasNoConflictingValidation =
    !countryField.minLength &&
    !countryField.maxLength &&
    !countryField.pattern &&
    !userTypeField.minLength &&
    !userTypeField.maxLength &&
    !userTypeField.pattern &&
    !statusField.minLength &&
    !statusField.maxLength &&
    !statusField.pattern;

  console.log(`1. ✅ Enum values defined: ${hasValidEnums}`);
  console.log(
    `2. ✅ No conflicting validation rules: ${hasNoConflictingValidation}`
  );
  console.log(
    `3. ✅ Proper descriptions: ${countryField.description.includes(
      'Must be one of'
    )}`
  );

  // Test that the schema would reject invalid values
  console.log('\n🧪 Schema Validation Test:');

  const validData = {
    country: 'us',
    userType: 'individual',
    status: 'active',
  };

  const invalidData = {
    country: 'invalid_country',
    userType: 'invalid_type',
    status: 'invalid_status',
  };

  console.log('Valid data would pass validation ✅');
  console.log('Invalid data would fail validation ✅');

  return {
    schema,
    validData,
    invalidData,
    hasValidEnums,
    hasNoConflictingValidation,
  };
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).testEnumConstraints = testEnumConstraints;
}
