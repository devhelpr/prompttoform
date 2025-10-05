// Simple Node.js test to verify the expression system works
const {
  DependencyResolutionService,
} = require('./libs/react-forms/src/lib/services/dependency-resolution.service.ts');
const {
  TemplateProcessingService,
} = require('./libs/react-forms/src/lib/services/template-processing.service.ts');

async function testExpressionSystem() {
  console.log('Testing Expression System...');

  try {
    // Test dependency resolution
    const dependencyService = new DependencyResolutionService();

    // Register fields
    dependencyService.registerField('input1', 'input1', []);
    dependencyService.registerField('calculated1', 'input1 * 2', ['input1']);
    dependencyService.registerField('calculated2', 'calculated1 + 5', [
      'calculated1',
    ]);

    // Test evaluation
    const context = {
      formValues: { input1: 3 },
      calculatedValues: {},
      metadata: {},
    };

    const results = await dependencyService.evaluateAll(context);

    console.log('Results:', results);
    console.log('Expected: { input1: 3, calculated1: 6, calculated2: 11 }');

    // Test template processing
    const templateService = new TemplateProcessingService();
    const template = 'Input: {{input1}}, Calculated: {{calculated1}}';
    const processed = templateService.processTemplate(template, {
      formValues: results,
      calculatedValues: {},
    });

    console.log('Template result:', processed);
    console.log('Expected: "Input: 3, Calculated: 6"');
  } catch (error) {
    console.error('Error:', error);
  }
}

testExpressionSystem();
