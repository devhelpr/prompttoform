import {
  ExpressionEngineService,
  FormContext,
} from '../expression-engine.service';

describe('Readonly Expression Dependency Fix', () => {
  let service: ExpressionEngineService;

  beforeEach(() => {
    service = new ExpressionEngineService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Expression engine with chained readonly expressions', () => {
    it('should handle chained readonly expressions correctly using evaluateWithDependencies', () => {
      // Scenario:
      // - Field A: input field (price = 10)
      // - Field B: readonly field with expression (subtotal = price * 2)
      // - Field C: readonly field with expression (total = subtotal + tax)
      // When price changes, both subtotal and total should update

      const context: FormContext = {
        price: { value: 10, valid: true, required: false },
        tax: { value: 5, valid: true, required: false },
      };

      const expressions = [
        {
          fieldId: 'subtotal',
          expression: 'price.value * 2',
          context,
        },
        {
          fieldId: 'total',
          expression: 'subtotal.value + tax.value',
          context,
        },
      ];

      const results = service.evaluateWithDependencies(expressions);

      // Both expressions should evaluate successfully
      expect(results.subtotal.value).toBe(20);
      expect(results.subtotal.dependencies).toEqual(['price']);

      expect(results.total.value).toBe(25); // 20 + 5
      expect(results.total.dependencies).toEqual(['subtotal', 'tax']);
    });

    it('should handle multiple levels of readonly expression dependencies', () => {
      // Test: price -> subtotal -> total -> finalTotal
      const context: FormContext = {
        price: { value: 10, valid: true, required: false },
        tax: { value: 5, valid: true, required: false },
        discount: { value: 2, valid: true, required: false },
      };

      const expressions = [
        {
          fieldId: 'subtotal',
          expression: 'price.value * 2',
          context,
        },
        {
          fieldId: 'total',
          expression: 'subtotal.value + tax.value',
          context,
        },
        {
          fieldId: 'finalTotal',
          expression: 'total.value - discount.value',
          context,
        },
      ];

      const results = service.evaluateWithDependencies(expressions);

      expect(results.subtotal.value).toBe(20);
      expect(results.total.value).toBe(25); // 20 + 5
      expect(results.finalTotal.value).toBe(23); // 25 - 2
    });

    it('should handle complex calculations with readonly expressions', () => {
      // Test complex scenario with multiple readonly fields
      const context: FormContext = {
        basePrice: { value: 100, valid: true, required: false },
        quantity: { value: 3, valid: true, required: false },
        taxRate: { value: 0.1, valid: true, required: false },
        discountPercent: { value: 5, valid: true, required: false },
      };

      const expressions = [
        {
          fieldId: 'subtotal',
          expression: 'basePrice.value * quantity.value',
          context,
        },
        {
          fieldId: 'discount',
          expression: 'subtotal.value * (discountPercent.value / 100)',
          context,
        },
        {
          fieldId: 'taxableAmount',
          expression: 'subtotal.value - discount.value',
          context,
        },
        {
          fieldId: 'tax',
          expression: 'taxableAmount.value * taxRate.value',
          context,
        },
        {
          fieldId: 'finalTotal',
          expression: 'taxableAmount.value + tax.value',
          context,
        },
      ];

      const results = service.evaluateWithDependencies(expressions);

      expect(results.subtotal.value).toBe(300); // 100 * 3
      expect(results.discount.value).toBe(15); // 300 * 0.05
      expect(results.taxableAmount.value).toBe(285); // 300 - 15
      expect(results.tax.value).toBe(28.5); // 285 * 0.1
      expect(results.finalTotal.value).toBe(313.5); // 285 + 28.5
    });
  });
});
