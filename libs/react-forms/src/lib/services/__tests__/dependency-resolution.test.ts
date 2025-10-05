import { DependencyResolutionService } from '../dependency-resolution.service';
import { TemplateProcessingService } from '../template-processing.service';
import { ExpressionEngineService } from '../expression-engine.service';

describe('Dependency Resolution System', () => {
  let dependencyService: DependencyResolutionService;
  let templateService: TemplateProcessingService;
  let expressionEngine: ExpressionEngineService;

  beforeEach(() => {
    dependencyService = new DependencyResolutionService();
    templateService = new TemplateProcessingService();
    expressionEngine = new ExpressionEngineService();
  });

  describe('DependencyResolutionService', () => {
    test('should register fields and build evaluation order', () => {
      // Register fields with dependencies
      dependencyService.registerField('input1', 'input1', []);
      dependencyService.registerField('calculated1', 'input1 * 2', ['input1']);
      dependencyService.registerField('calculated2', 'calculated1 + 5', [
        'calculated1',
      ]);

      const graph = dependencyService.getDependencyGraph();

      expect(graph.nodes.size).toBe(3);
      expect(graph.evaluationOrder).toEqual([
        'input1',
        'calculated1',
        'calculated2',
      ]);
      expect(graph.isDirty).toBe(false);
    });

    test('should handle circular dependencies', () => {
      dependencyService.registerField('field1', 'field2 + 1', ['field2']);
      dependencyService.registerField('field2', 'field1 + 1', ['field1']);

      const graph = dependencyService.getDependencyGraph();

      // Should detect circular dependency
      expect(graph.evaluationOrder.length).toBeLessThan(2);
    });

    test('should evaluate expressions in correct order', async () => {
      dependencyService.registerField('input1', 'input1', []);
      dependencyService.registerField('calculated1', 'input1 * 2', ['input1']);
      dependencyService.registerField('calculated2', 'calculated1 + 5', [
        'calculated1',
      ]);

      const context = {
        formValues: { input1: 3 },
        calculatedValues: {},
        metadata: {},
      };

      const results = await dependencyService.evaluateAll(context);

      expect(results.input1).toBe(3);
      expect(results.calculated1).toBe(6);
      expect(results.calculated2).toBe(11);
    });
  });

  describe('TemplateProcessingService', () => {
    test('should process simple templates', () => {
      const template = 'Hello {{name}}, you have {{count}} items.';
      const context = {
        formValues: { name: 'John', count: 5 },
        calculatedValues: {},
        metadata: {},
      };

      const result = templateService.processTemplate(template, context);

      expect(result).toBe('Hello John, you have 5 items.');
    });

    test('should handle nested object access', () => {
      const template = 'User: {{user.name}}, Age: {{user.age}}';
      const context = {
        formValues: { user: { name: 'Alice', age: 30 } },
        calculatedValues: {},
        metadata: {},
      };

      const result = templateService.processTemplate(template, context);

      expect(result).toBe('User: Alice, Age: 30');
    });

    test('should handle array length', () => {
      const template = 'You have {{items.length}} items.';
      const context = {
        formValues: { items: ['a', 'b', 'c'] },
        calculatedValues: {},
        metadata: {},
      };

      const result = templateService.processTemplate(template, context);

      expect(result).toBe('You have 3 items.');
    });

    test('should handle function calls', () => {
      const template = 'Total: {{sum(items)}}, Count: {{length(items)}}';
      const context = {
        formValues: { items: [10, 20, 30] },
        calculatedValues: {},
        metadata: {},
      };

      const result = templateService.processTemplate(template, context);

      expect(result).toBe('Total: 60, Count: 3');
    });

    test('should handle missing values gracefully', () => {
      const template = 'Name: {{name}}, Age: {{age}}, Items: {{items.length}}';
      const context = {
        formValues: { name: 'John' },
        calculatedValues: {},
        metadata: {},
      };

      const result = templateService.processTemplate(template, context);

      expect(result).toBe('Name: John, Age: -, Items: -');
    });
  });

  describe('ExpressionEngineService Integration', () => {
    test('should register fields and evaluate with dependencies', async () => {
      // Register fields
      expressionEngine.registerField('input1', 'input1', []);
      expressionEngine.registerField('calculated1', 'input1 * 2', ['input1']);
      expressionEngine.registerField('calculated2', 'calculated1 + 5', [
        'calculated1',
      ]);

      const formValues = { input1: 4 };
      const results = await expressionEngine.evaluateAllWithDependencies(
        formValues
      );

      expect(results.input1).toBe(4);
      expect(results.calculated1).toBe(8);
      expect(results.calculated2).toBe(13);
    });

    test('should process templates with calculated values', () => {
      // Set up calculated values
      expressionEngine.setCalculatedValue('subtotal', 100);
      expressionEngine.setCalculatedValue('tax', 10);
      expressionEngine.setCalculatedValue('total', 110);

      const template = 'Subtotal: {{subtotal}}, Tax: {{tax}}, Total: {{total}}';
      const formValues = { customer: 'John' };

      const result = expressionEngine.processTemplate(template, formValues);

      expect(result).toBe('Subtotal: 100, Tax: 10, Total: 110');
    });

    test('should handle array aggregation functions', () => {
      const template =
        'Products: {{products.length}}, Total: {{sumLineTotal(products)}}';
      const formValues = {
        products: [
          { quantity: 2, unitPrice: 10, lineTotal: 20 },
          { quantity: 3, unitPrice: 5, lineTotal: 15 },
        ],
      };

      const result = expressionEngine.processTemplate(template, formValues);

      expect(result).toBe('Products: 2, Total: 35');
    });
  });

  describe('Complex Dependency Chain', () => {
    test('should handle complex inter-field dependencies', async () => {
      // Set up a complex dependency chain
      expressionEngine.registerField('baseValue', 'baseValue', []);
      expressionEngine.registerField('multiplier', 'multiplier', []);
      expressionEngine.registerField('product', 'baseValue * multiplier', [
        'baseValue',
        'multiplier',
      ]);
      expressionEngine.registerField('bonus', 'product * 0.1', ['product']);
      expressionEngine.registerField('total', 'product + bonus', [
        'product',
        'bonus',
      ]);

      const formValues = { baseValue: 100, multiplier: 2 };
      const results = await expressionEngine.evaluateAllWithDependencies(
        formValues
      );

      expect(results.baseValue).toBe(100);
      expect(results.multiplier).toBe(2);
      expect(results.product).toBe(200);
      expect(results.bonus).toBe(20);
      expect(results.total).toBe(220);
    });

    test('should process complex template with all calculated values', () => {
      // Set up calculated values
      expressionEngine.setCalculatedValue('baseValue', 100);
      expressionEngine.setCalculatedValue('multiplier', 2);
      expressionEngine.setCalculatedValue('product', 200);
      expressionEngine.setCalculatedValue('bonus', 20);
      expressionEngine.setCalculatedValue('total', 220);

      const template = `
        Base Value: {{baseValue}}
        Multiplier: {{multiplier}}
        Product: {{product}}
        Bonus (10%): {{bonus}}
        Total: {{total}}
      `.trim();

      const result = expressionEngine.processTemplate(template, {});

      expect(result).toContain('Base Value: 100');
      expect(result).toContain('Multiplier: 2');
      expect(result).toContain('Product: 200');
      expect(result).toContain('Bonus (10%): 20');
      expect(result).toContain('Total: 220');
    });
  });
});
