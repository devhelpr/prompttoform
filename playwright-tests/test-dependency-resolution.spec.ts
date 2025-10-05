import { test, expect } from '@playwright/test';

test.describe('Dependency Resolution System', () => {
  test('should handle inter-field dependencies correctly', async ({ page }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click on Import JSON button
    await page.click('button:has-text("Import JSON")');

    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]');

    // Define a form with inter-field dependencies
    const formWithDependencies = {
      app: {
        title: 'Dependency Test Form',
        pages: [
          {
            id: 'dependencyTest',
            title: 'Dependency Test',
            route: '/dependency-test',
            layout: 'vertical',
            components: [
              {
                id: 'input1',
                type: 'input',
                label: 'Input 1',
                props: {
                  inputType: 'number',
                  placeholder: 'Enter a number',
                },
              },
              {
                id: 'calculated1',
                type: 'input',
                label: 'Calculated 1 (input1 * 2)',
                expression: {
                  expression: 'toNumber(input1) * 2',
                  mode: 'value',
                  dependencies: ['input1'],
                  evaluateOnChange: true,
                  defaultValue: 0,
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Calculated automatically',
                },
              },
              {
                id: 'calculated2',
                type: 'input',
                label: 'Calculated 2 (calculated1 + 5)',
                expression: {
                  expression: 'toNumber(calculated1) + 5',
                  mode: 'value',
                  dependencies: ['calculated1'],
                  evaluateOnChange: true,
                  defaultValue: 5,
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Depends on Calculated 1',
                },
              },
              {
                id: 'reviewSection',
                type: 'section',
                label: 'Review',
                children: [
                  {
                    id: 'reviewText',
                    type: 'text',
                    label: 'Summary',
                    props: {
                      helperText:
                        'Input 1: {{input1}}\nCalculated 1: {{calculated1}}\nCalculated 2: {{calculated2}}\n\nAll values should update automatically when Input 1 changes.',
                    },
                  },
                ],
              },
            ],
            isEndPage: true,
          },
        ],
      },
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
    };

    // Paste the JSON into the textarea
    await page.fill('textarea', JSON.stringify(formWithDependencies, null, 2));

    // Click Import button
    await page.click('button:has-text("Import")');

    // Wait for the form to load
    await page.waitForSelector('input[type="number"]', { timeout: 10000 });

    // Test the dependency chain
    console.log('Testing dependency resolution...');

    // Enter a value in input1
    await page.fill('input[type="number"]', '3');
    await page.keyboard.press('Tab'); // Trigger blur event

    // Wait a bit for calculations to complete
    await page.waitForTimeout(500);

    // Check that calculated1 shows 6 (3 * 2)
    const calculated1Input = page.locator('input[readonly]').first();
    await expect(calculated1Input).toHaveValue('6');

    // Check that calculated2 shows 11 (6 + 5)
    const calculated2Input = page.locator('input[readonly]').nth(1);
    await expect(calculated2Input).toHaveValue('11');

    // Check that the review section shows the correct values
    const reviewText = page.locator('text=Input 1: 3');
    await expect(reviewText).toBeVisible();

    const reviewText2 = page.locator('text=Calculated 1: 6');
    await expect(reviewText2).toBeVisible();

    const reviewText3 = page.locator('text=Calculated 2: 11');
    await expect(reviewText3).toBeVisible();

    // Test with a different value
    await page.fill('input[type="number"]', '5');
    await page.keyboard.press('Tab');

    await page.waitForTimeout(500);

    // Check updated values
    await expect(calculated1Input).toHaveValue('10');
    await expect(calculated2Input).toHaveValue('15');

    // Check updated review section
    await expect(page.locator('text=Input 1: 5')).toBeVisible();
    await expect(page.locator('text=Calculated 1: 10')).toBeVisible();
    await expect(page.locator('text=Calculated 2: 15')).toBeVisible();

    console.log('Dependency resolution test completed successfully!');
  });

  test('should handle array aggregation with dependencies', async ({
    page,
  }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click on Import JSON button
    await page.click('button:has-text("Import JSON")');

    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]');

    // Define a form with array aggregation and dependencies
    const formWithArrayAggregation = {
      app: {
        title: 'Array Aggregation Test',
        pages: [
          {
            id: 'arrayTest',
            title: 'Array Aggregation Test',
            route: '/array-test',
            layout: 'vertical',
            components: [
              {
                id: 'products',
                type: 'array',
                label: 'Products',
                props: {
                  helperText: 'Add products with quantity and price',
                },
                arrayItems: [
                  {
                    id: 'productItem',
                    components: [
                      {
                        id: 'productName',
                        type: 'input',
                        label: 'Product Name',
                        props: {
                          placeholder: 'Enter product name',
                        },
                      },
                      {
                        id: 'quantity',
                        type: 'input',
                        label: 'Quantity',
                        props: {
                          inputType: 'number',
                          placeholder: 'Enter quantity',
                        },
                      },
                      {
                        id: 'unitPrice',
                        type: 'input',
                        label: 'Unit Price',
                        props: {
                          inputType: 'number',
                          placeholder: 'Enter unit price',
                        },
                      },
                      {
                        id: 'lineTotal',
                        type: 'input',
                        label: 'Line Total',
                        expression: {
                          expression:
                            'toNumber(quantity) * toNumber(unitPrice)',
                          mode: 'value',
                          dependencies: ['quantity', 'unitPrice'],
                          evaluateOnChange: true,
                          defaultValue: 0,
                        },
                        props: {
                          inputType: 'number',
                          readOnly: true,
                          helperText: 'Calculated automatically',
                        },
                      },
                    ],
                  },
                ],
              },
              {
                id: 'subtotal',
                type: 'input',
                label: 'Subtotal',
                expression: {
                  expression: 'sumLineTotal(products)',
                  mode: 'value',
                  dependencies: ['products'],
                  evaluateOnChange: true,
                  defaultValue: 0,
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Sum of all line totals',
                },
              },
              {
                id: 'taxPercent',
                type: 'input',
                label: 'Tax (%)',
                props: {
                  inputType: 'number',
                  placeholder: 'Enter tax percentage',
                },
              },
              {
                id: 'grandTotal',
                type: 'input',
                label: 'Grand Total',
                expression: {
                  expression:
                    'toNumber(subtotal) + (toNumber(subtotal) * toNumber(taxPercent) / 100)',
                  mode: 'value',
                  dependencies: ['subtotal', 'taxPercent'],
                  evaluateOnChange: true,
                  defaultValue: 0,
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Subtotal plus tax',
                },
              },
              {
                id: 'reviewSection',
                type: 'section',
                label: 'Review',
                children: [
                  {
                    id: 'reviewText',
                    type: 'text',
                    label: 'Summary',
                    props: {
                      helperText:
                        'Products count: {{products.length}}\nSubtotal: {{subtotal}}\nTax: {{taxPercent}}%\nGrand Total: {{grandTotal}}\n\nAll calculations use the new dependency resolution system.',
                    },
                  },
                ],
              },
            ],
            isEndPage: true,
          },
        ],
      },
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
    };

    // Paste the JSON into the textarea
    await page.fill(
      'textarea',
      JSON.stringify(formWithArrayAggregation, null, 2)
    );

    // Click Import button
    await page.click('button:has-text("Import")');

    // Wait for the form to load
    await page.waitForSelector('button:has-text("Add Item")', {
      timeout: 10000,
    });

    // Add a product
    await page.click('button:has-text("Add Item")');

    // Wait for the product fields to appear
    await page.waitForSelector('input[placeholder="Enter product name"]');

    // Fill in the first product
    await page.fill('input[placeholder="Enter product name"]', 'Widget A');
    await page.fill('input[placeholder="Enter quantity"]', '2');
    await page.fill('input[placeholder="Enter unit price"]', '10');

    // Wait for calculations
    await page.waitForTimeout(500);

    // Check line total (2 * 10 = 20)
    const lineTotalInput = page.locator('input[readonly]').first();
    await expect(lineTotalInput).toHaveValue('20');

    // Check subtotal (should be 20)
    const subtotalInput = page.locator('input[readonly]').nth(1);
    await expect(subtotalInput).toHaveValue('20');

    // Add tax
    await page.fill('input[placeholder="Enter tax percentage"]', '10');

    // Wait for calculations
    await page.waitForTimeout(500);

    // Check grand total (20 + 20 * 0.1 = 22)
    const grandTotalInput = page.locator('input[readonly]').nth(2);
    await expect(grandTotalInput).toHaveValue('22');

    // Check review section
    await expect(page.locator('text=Products count: 1')).toBeVisible();
    await expect(page.locator('text=Subtotal: 20')).toBeVisible();
    await expect(page.locator('text=Tax: 10%')).toBeVisible();
    await expect(page.locator('text=Grand Total: 22')).toBeVisible();

    // Add another product
    await page.click('button:has-text("Add Item")');

    // Wait for the second product fields
    await page.waitForTimeout(200);

    // Fill in the second product (find the second set of inputs)
    const productNameInputs = page.locator(
      'input[placeholder="Enter product name"]'
    );
    const quantityInputs = page.locator('input[placeholder="Enter quantity"]');
    const unitPriceInputs = page.locator(
      'input[placeholder="Enter unit price"]'
    );

    await productNameInputs.nth(1).fill('Widget B');
    await quantityInputs.nth(1).fill('3');
    await unitPriceInputs.nth(1).fill('5');

    // Wait for calculations
    await page.waitForTimeout(500);

    // Check that subtotal is now 35 (20 + 15)
    await expect(subtotalInput).toHaveValue('35');

    // Check that grand total is now 38.5 (35 + 35 * 0.1)
    await expect(grandTotalInput).toHaveValue('38.5');

    // Check updated review section
    await expect(page.locator('text=Products count: 2')).toBeVisible();
    await expect(page.locator('text=Subtotal: 35')).toBeVisible();
    await expect(page.locator('text=Grand Total: 38.5')).toBeVisible();

    console.log(
      'Array aggregation with dependencies test completed successfully!'
    );
  });
});
