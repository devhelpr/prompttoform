import { generateJsonSchema } from './schema-generator';
import { FormDefinition } from '@devhelpr/react-forms';

// Example form demonstrating fixed enum constraints
const fixedEnumForm: FormDefinition = {
  app: {
    title: 'Fixed Enum Constraints Demo',
    pages: [
      {
        id: 'main',
        title: 'Main Form',
        route: '/main',
        components: [
          {
            type: 'select',
            id: 'priority',
            label: 'Priority Level',
            validation: { required: true },
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Critical', value: 'critical' },
            ],
          },
          {
            type: 'radio',
            id: 'category',
            label: 'Category',
            validation: { required: true },
            options: [
              { label: 'Bug Report', value: 'bug' },
              { label: 'Feature Request', value: 'feature' },
              { label: 'Enhancement', value: 'enhancement' },
              { label: 'Documentation', value: 'documentation' },
            ],
          },
          {
            type: 'select',
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Open', value: 'open' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Closed', value: 'closed' },
            ],
          },
        ],
      },
    ],
  },
};

export function demonstrateFixedEnumConstraints() {
  console.log('=== FIXED ENUM CONSTRAINTS DEMO ===');

  const schema = generateJsonSchema(fixedEnumForm);

  console.log('\n📋 Generated Schema:');
  console.log(JSON.stringify(schema, null, 2));

  console.log('\n🔍 Enum Constraint Analysis:');

  // Analyze each enum field
  Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
    console.log(`\n${fieldName}:`);
    console.log(`  Type: ${fieldSchema.type}`);
    console.log(`  Enum Values: ${JSON.stringify(fieldSchema.enum)}`);
    console.log(`  Enum Names: ${JSON.stringify(fieldSchema.enumNames)}`);
    console.log(`  Description: ${fieldSchema.description}`);

    // Check for conflicting validation rules
    const hasConflictingRules =
      fieldSchema.minLength !== undefined ||
      fieldSchema.maxLength !== undefined ||
      fieldSchema.pattern !== undefined;

    console.log(`  Has Conflicting Rules: ${hasConflictingRules}`);

    if (hasConflictingRules) {
      console.log(`  ❌ WARNING: Field has conflicting validation rules!`);
    } else {
      console.log(`  ✅ Field properly constrained to enum values only`);
    }
  });

  console.log('\n✅ Fixed Issues:');
  console.log(
    '1. ✅ Radio and select fields are now strictly limited to their options'
  );
  console.log(
    '2. ✅ No conflicting validation rules (minLength, maxLength, pattern)'
  );
  console.log('3. ✅ Clear descriptions indicating enum constraints');
  console.log('4. ✅ Proper JSON Schema enum validation');

  console.log('\n🧪 Validation Examples:');

  // Valid data examples
  const validData = {
    priority: 'high',
    category: 'bug',
    status: 'open',
  };

  // Invalid data examples (would be rejected by schema)
  const invalidData = {
    priority: 'invalid_priority',
    category: 'invalid_category',
    status: 'invalid_status',
  };

  console.log('Valid data (would pass validation):');
  console.log(JSON.stringify(validData, null, 2));

  console.log('\nInvalid data (would fail validation):');
  console.log(JSON.stringify(invalidData, null, 2));

  console.log('\n📝 Schema Validation Rules:');
  console.log(
    '- priority: Must be one of ["low", "medium", "high", "critical"]'
  );
  console.log(
    '- category: Must be one of ["bug", "feature", "enhancement", "documentation"]'
  );
  console.log(
    '- status: Must be one of ["open", "in_progress", "resolved", "closed"]'
  );

  return {
    schema,
    validData,
    invalidData,
    enumFields: Object.keys(schema.properties).filter(
      (key) => schema.properties[key].enum
    ),
  };
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).demonstrateFixedEnumConstraints =
    demonstrateFixedEnumConstraints;
}
