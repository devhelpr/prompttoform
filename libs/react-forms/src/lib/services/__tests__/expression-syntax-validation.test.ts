import {
  ExpressionEngineService,
  FormContext,
} from '../expression-engine.service';

describe('Expression Syntax Validation', () => {
  let service: ExpressionEngineService;

  beforeEach(() => {
    service = new ExpressionEngineService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Supported Math Functions', () => {
    const context: FormContext = {
      value: { value: 3.7, valid: true, required: false },
      value2: { value: 2.3, valid: true, required: false },
      negativeValue: { value: -5.2, valid: true, required: false },
    };

    it('should support abs function', () => {
      const result = service.evaluate('abs(negativeValue.value)', context);
      expect(result.value).toBe(5.2);
      expect(result.error).toBeUndefined();
    });

    it('should support round function', () => {
      const result = service.evaluate('round(value.value)', context);
      expect(result.value).toBe(4);
      expect(result.error).toBeUndefined();
    });

    it('should support floor function', () => {
      const result = service.evaluate('floor(value.value)', context);
      expect(result.value).toBe(3);
      expect(result.error).toBeUndefined();
    });

    it('should support ceil function', () => {
      const result = service.evaluate('ceil(value.value)', context);
      expect(result.value).toBe(4);
      expect(result.error).toBeUndefined();
    });

    it('should support min function', () => {
      const result = service.evaluate(
        'min(value.value, value2.value)',
        context
      );
      expect(result.value).toBe(2.3);
      expect(result.error).toBeUndefined();
    });

    it('should support max function', () => {
      const result = service.evaluate(
        'max(value.value, value2.value)',
        context
      );
      expect(result.value).toBe(3.7);
      expect(result.error).toBeUndefined();
    });

    it('should support sqrt function', () => {
      const result = service.evaluate('sqrt(16)', context);
      expect(result.value).toBe(4);
      expect(result.error).toBeUndefined();
    });

    it('should support pow function', () => {
      const result = service.evaluate('pow(2, 3)', context);
      expect(result.value).toBe(8);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Unsupported Math Functions', () => {
    const context: FormContext = {
      value: { value: 3.7, valid: true, required: false },
    };

    it('should NOT support Math.round syntax', () => {
      const result = service.evaluate('Math.round(value.value)', context);
      expect(result.error).toContain('Expression evaluation failed');
    });

    it('should NOT support Math.abs syntax', () => {
      const result = service.evaluate('Math.abs(value.value)', context);
      expect(result.error).toContain('Expression evaluation failed');
    });

    it('should NOT support Math.min syntax', () => {
      const result = service.evaluate('Math.min(value.value, 5)', context);
      expect(result.error).toContain('Expression evaluation failed');
    });

    it('should NOT support Math.max syntax', () => {
      const result = service.evaluate('Math.max(value.value, 5)', context);
      console.log(result);
      expect(result.error).toContain('Expression evaluation failed');
    });
  });

  describe('Supported Utility Functions', () => {
    const context: FormContext = {
      stringValue: { value: '123.45', valid: true, required: false },
      intValue: { value: '456', valid: true, required: false },
      nanValue: { value: 'not a number', valid: true, required: false },
      finiteValue: { value: 42, valid: true, required: false },
      infiniteValue: { value: Infinity, valid: true, required: false },
    };

    it('should support parseFloat function', () => {
      const result = service.evaluate('parseFloat(stringValue.value)', context);
      expect(result.value).toBe(123.45);
      expect(result.error).toBeUndefined();
    });

    it('should support parseInt function', () => {
      const result = service.evaluate('parseInt(intValue.value)', context);
      expect(result.value).toBe(456);
      expect(result.error).toBeUndefined();
    });

    it('should support isNaN function', () => {
      const nanResult = service.evaluate('isNaN(nanValue.value)', context);
      const validResult = service.evaluate('isNaN(finiteValue.value)', context);

      expect(nanResult.value).toBe(true);
      expect(validResult.value).toBe(false);
      expect(nanResult.error).toBeUndefined();
      expect(validResult.error).toBeUndefined();
    });

    it('should support isFinite function', () => {
      const finiteResult = service.evaluate(
        'isFinite(finiteValue.value)',
        context
      );
      const infiniteResult = service.evaluate(
        'isFinite(infiniteValue.value)',
        context
      );

      expect(finiteResult.value).toBe(true);
      expect(infiniteResult.value).toBe(false);
      expect(finiteResult.error).toBeUndefined();
      expect(infiniteResult.error).toBeUndefined();
    });

    it('should support toString function', () => {
      const result = service.evaluate(
        'getAsString(finiteValue.value)',
        context
      );
      expect(result.value).toBe('42');
      expect(result.error).toBeUndefined();
    });

    it('should support length function', () => {
      const arrayContext = {
        arrayValue: { value: [1, 2, 3, 4, 5], valid: true, required: false },
        nonArrayValueButString: {
          value: 'not an array',
          valid: true,
          required: false,
        },
      };

      const arrayResult = service.evaluate(
        'length(arrayValue.value)',
        arrayContext
      );
      const nonArrayResult = service.evaluate(
        'length(nonArrayValueButString.value)',
        arrayContext
      );

      expect(arrayResult.value).toBe(5);
      expect(nonArrayResult.value).toBe(12);
      expect(arrayResult.error).toBeUndefined();
      expect(nonArrayResult.error).toBeUndefined();
    });
  });

  describe('Supported Conditional Functions', () => {
    const context: FormContext = {
      age: { value: 25, valid: true, required: false },
      status: { value: 'active', valid: true, required: false },
    };

    it('should support if function', () => {
      const result = service.evaluate(
        'if(age.value >= 18, "adult", "minor")',
        context
      );
      expect(result.value).toBe('adult');
      expect(result.error).toBeUndefined();
    });

    it('should support ternary operator', () => {
      const result = service.evaluate(
        'age.value >= 18 ? "adult" : "minor"',
        context
      );
      expect(result.value).toBe('adult');
      expect(result.error).toBeUndefined();
    });
  });

  describe('Complex Expression Combinations', () => {
    const context: FormContext = {
      price: { value: 100, valid: true, required: false },
      quantity: { value: 3, valid: true, required: false },
      taxRate: { value: 0.1, valid: true, required: false },
      discount: { value: 15, valid: true, required: false },
      userType: { value: 'senior', valid: true, required: false },
    };

    it('should support complex price calculations', () => {
      const result = service.evaluate(
        'round((price.value * quantity.value * (1 + taxRate.value) - discount.value) * 100) / 100',
        context
      );
      expect(result.value).toBeCloseTo(315, 0);
      expect(result.error).toBeUndefined();
    });

    it('should support conditional pricing', () => {
      const result = service.evaluate(
        'userType.value === "senior" ? round(price.value * 0.9) : price.value',
        context
      );
      expect(result.value).toBe(90);
      expect(result.error).toBeUndefined();
    });

    it('should support nested function calls', () => {
      const result = service.evaluate(
        'max(min(price.value, 200), 50)',
        context
      );
      expect(result.value).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it('should support complex conditional logic', () => {
      const result = service.evaluate(
        'if(price.value > 50 && quantity.value > 2, round(price.value * 0.95), price.value)',
        context
      );
      expect(result.value).toBe(95);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Slider-Specific Expressions', () => {
    const context: FormContext = {
      sliderValue: { value: 75, valid: true, required: false },
      sliderRange: {
        value: { min: 20, max: 80 },
        valid: true,
        required: false,
      },
      multiplier: { value: 2.5, valid: true, required: false },
      threshold: { value: 50, valid: true, required: false },
    };

    it('should support single slider calculations', () => {
      const result = service.evaluate(
        'sliderValue.value * multiplier.value',
        context
      );
      expect(result.value).toBe(187.5);
      expect(result.error).toBeUndefined();
    });

    it('should support range slider calculations', () => {
      const result = service.evaluate(
        'sliderRange.value.max - sliderRange.value.min',
        context
      );
      expect(result.value).toBe(60);
      expect(result.error).toBeUndefined();
    });

    it('should support range slider average', () => {
      const result = service.evaluate(
        '(sliderRange.value.min + sliderRange.value.max) / 2',
        context
      );
      expect(result.value).toBe(50);
      expect(result.error).toBeUndefined();
    });

    it('should support conditional slider logic', () => {
      const result = service.evaluate(
        'sliderValue.value > threshold.value ? "High" : "Low"',
        context
      );
      expect(result.value).toBe('High');
      expect(result.error).toBeUndefined();
    });

    it('should support complex slider calculations', () => {
      const result = service.evaluate(
        'round((sliderValue.value / 100) * (sliderRange.value.max - sliderRange.value.min) * multiplier.value)',
        context
      );
      expect(result.value).toBe(113);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Error Handling for Invalid Syntax', () => {
    const context: FormContext = {
      value: { value: 10, valid: true, required: false },
    };

    it('should reject Math object syntax', () => {
      const expressions = [
        'Math.round(value.value)',
        'Math.abs(value.value)',
        'Math.min(value.value, 5)',
        'Math.max(value.value, 5)',
        'Math.floor(value.value)',
        'Math.ceil(value.value)',
        'Math.sqrt(value.value)',
        'Math.pow(value.value, 2)',
      ];

      expressions.forEach((expr) => {
        const result = service.evaluate(expr, context);
        expect(result.error).toContain('Expression evaluation failed');
      });
    });

    it('should reject unsupported functions', () => {
      const expressions = [
        'unknownFunction(value.value)',
        'invalidFunc(value.value)',
        'notSupported(value.value)',
      ];

      expressions.forEach((expr) => {
        const result = service.evaluate(expr, context);
        expect(result.error).toContain('Expression evaluation failed');
      });
    });
  });

  describe('Validation Tests', () => {
    it('should validate correct expressions', () => {
      const validExpressions = [
        'price.value * quantity.value',
        'round(price.value * 1.1)',
        'min(price.value, 100)',
        'max(price.value, 50)',
        'abs(price.value)',
        'price.value > 50 ? "high" : "low"',
        'if(price.value > 50, "high", "low")',
        'parseFloat(price.value)',
        'isNaN(price.value)',
      ];

      validExpressions.forEach((expr) => {
        const validation = service.validate(expr);
        expect(validation.valid).toBe(true);
        expect(validation.error).toBeUndefined();
      });
    });

    it('should reject invalid expressions', () => {
      const invalidExpressions = [
        'Math.round(price.value)',
        'Math.abs(price.value)',
        'invalid syntax here',
        'price.value +',
      ];

      invalidExpressions.forEach((expr) => {
        const validation = service.validate(expr);
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });
    });
  });
});
