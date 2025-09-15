const { Parser } = require('expr-eval');

const parser = new Parser();

// Test expression parsing
const expr = parser.parse('status.value === "active" && balance.value > 0');
console.log('Parsed expression:', JSON.stringify(expr, null, 2));

// Test evaluation
const context = {
  status: { value: 'active' },
  balance: { value: 100 },
};

try {
  const result = expr.evaluate(context);
  console.log('Evaluation result:', result);
} catch (error) {
  console.error('Evaluation error:', error);
}
