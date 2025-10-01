const { Parser } = require('expr-eval');

console.log('Testing expr-eval...');

try {
  const parser = new Parser();
  const expr = parser.parse('a + b');
  const result = expr.evaluate({ a: 1, b: 2 });
  console.log('Simple test passed:', result);

  // Test member expressions
  const expr2 = parser.parse('price.value + quantity.value');
  console.log('Member expression test:', expr2);
} catch (error) {
  console.error('Error:', error.message);
}
