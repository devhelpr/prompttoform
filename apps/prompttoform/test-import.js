// Simple test to check if schema generator can be imported
console.log('Testing schema generator import...');

try {
  // Try to import the schema generator
  const { generateJsonSchema } = require('./src/app/utils/schema-generator.ts');
  console.log('✅ Schema generator imported successfully');
  console.log('Function type:', typeof generateJsonSchema);
} catch (error) {
  console.error('❌ Error importing schema generator:', error.message);
  console.error('Stack trace:', error.stack);
}

