import {
  ExpressionEngineService,
  FormContext,
} from '../expression-engine.service';

describe('ExpressionEngineService', () => {
  let service: ExpressionEngineService;

  beforeEach(() => {
    service = new ExpressionEngineService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Basic Arithmetic', () => {
    it('should evaluate simple addition', () => {
      const context: FormContext = {
        price: { value: 10, valid: true, required: false },
        quantity: { value: 5, valid: true, required: false },
      };

      const result = service.evaluate('price.value + quantity.value', context);

      expect(result.value).toBe(15);
      expect(result.error).toBeUndefined();
      expect(result.dependencies).toEqual(['price', 'quantity']);
    });

    it('should evaluate complex calculations', () => {
      const context: FormContext = {
        price: { value: 100, valid: true, required: false },
        taxRate: { value: 0.1, valid: true, required: false },
        discount: { value: 10, valid: true, required: false },
      };

      const result = service.evaluate(
        'price.value * (1 + taxRate.value) - discount.value',
        context
      );

      expect(result.value).toBe(100);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Conditional Logic', () => {
    it('should evaluate ternary operators', () => {
      const context: FormContext = {
        age: { value: 25, valid: true, required: false },
      };

      const result = service.evaluate(
        'age.value >= 18 ? "adult" : "minor"',
        context
      );

      expect(result.value).toBe('adult');
      expect(result.error).toBeUndefined();
    });

    it('should evaluate logical operators', () => {
      const context: FormContext = {
        status: { value: 'active', valid: true, required: false },
        balance: { value: 100, valid: true, required: false },
      };

      const result = service.evaluate(
        'status.value === "active" && balance.value > 0',
        context
      );

      expect(result.value).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Math Functions', () => {
    it('should evaluate Math functions', () => {
      const context: FormContext = {
        value: { value: 3.7, valid: true, required: false },
      };

      const result = service.evaluate('round(value.value)', context);

      expect(result.value).toBe(4);
      expect(result.error).toBeUndefined();
    });

    it('should evaluate min/max functions', () => {
      const context: FormContext = {
        a: { value: 10, valid: true, required: false },
        b: { value: 20, valid: true, required: false },
      };

      const minResult = service.evaluate('min(a.value, b.value)', context);
      const maxResult = service.evaluate('max(a.value, b.value)', context);

      expect(minResult.value).toBe(10);
      expect(maxResult.value).toBe(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid expressions', () => {
      const context: FormContext = {};

      const result = service.evaluate('invalid syntax here', context);

      expect(result.value).toBeNull();
      expect(result.error).toContain('Expression evaluation failed');
    });

    it('should handle missing field references', () => {
      const context: FormContext = {};

      const result = service.evaluate('nonexistent.value', context);

      expect(result.value).toBeNull();
      expect(result.error).toContain('Expression evaluation failed');
    });
  });

  describe('Validation', () => {
    it('should validate correct expressions', () => {
      const validation = service.validate('price.value + quantity.value');

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should reject invalid expressions', () => {
      const validation = service.validate('invalid syntax');

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Invalid expression');
    });
  });

  describe('Dependencies', () => {
    it('should extract field dependencies', () => {
      const dependencies = service.getDependencies(
        'price.value + quantity.value * taxRate.value'
      );

      expect(dependencies).toEqual(['price', 'quantity', 'taxRate']);
    });

    it('should handle expressions with no dependencies', () => {
      const dependencies = service.getDependencies('1 + 2 * 3');

      expect(dependencies).toEqual([]);
    });
  });

  describe('Caching', () => {
    it('should cache evaluation results', () => {
      const context: FormContext = {
        price: { value: 10, valid: true, required: false },
        quantity: { value: 5, valid: true, required: false },
      };

      // First evaluation
      const result1 = service.evaluate('price.value + quantity.value', context);

      // Second evaluation should use cache
      const result2 = service.evaluate('price.value + quantity.value', context);

      expect(result1.value).toBe(result2.value);
      expect(result1.dependencies).toEqual(result2.dependencies);
    });

    it('should clear cache', () => {
      const context: FormContext = {
        price: { value: 10, valid: true, required: false },
      };

      service.evaluate('price.value', context);
      expect(service.getCacheStats().cacheSize).toBeGreaterThan(0);

      service.clearCache();
      expect(service.getCacheStats().cacheSize).toBe(0);
    });
  });
});
