import { test, expect } from '@playwright/test';

test.describe('Expression System Integration Test', () => {
  test('should test expression system with a simple dependency chain', async ({
    page,
  }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button
    await page.click('button:has-text("Import JSON")');

    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]');

    // Create a simple test form with dependency chain
    const testForm = {
      app: {
        title: 'Expression System Test',
        pages: [
          {
            id: 'testPage',
            title: 'Test Page',
            route: '/test',
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
                validation: {
                  required: true,
                },
              },
              {
                id: 'calculated1',
                type: 'input',
                label: 'Calculated 1 (input1 * 2)',
                expression: {
                  expression: 'input1 * 2',
                  mode: 'value',
                  dependencies: ['input1'],
                  evaluateOnChange: true,
                  debounceMs: 100,
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
                  expression: 'calculated1 + 5',
                  mode: 'value',
                  dependencies: ['calculated1'],
                  evaluateOnChange: true,
                  debounceMs: 100,
                  defaultValue: 0,
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Depends on Calculated 1',
                },
              },
            ],
            isEndPage: true,
          },
        ],
      },
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      languageDetails: [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
        },
      ],
    };

    // Load the test form
    await page.fill('textarea', JSON.stringify(testForm, null, 2));

    // Click Import button
    await page.click('button:has-text("Import")');

    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter a number"]');

    // Test the dependency chain: input1 -> calculated1 -> calculated2
    const input1 = page.locator('input[placeholder="Enter a number"]');
    const calculated1 = page.locator('input[readonly]').nth(0);
    const calculated2 = page.locator('input[readonly]').nth(1);

    // Check initial state
    console.log('Initial state:');
    console.log('Input1 value:', await input1.inputValue());
    console.log('Calculated1 value:', await calculated1.inputValue());
    console.log('Calculated2 value:', await calculated2.inputValue());

    // Enter value in input1
    await input1.fill('3');
    await input1.blur(); // Trigger change event

    // Wait for calculations to complete
    await page.waitForTimeout(500);

    // Check calculated1 (should be 6)
    const calculated1Value = await calculated1.inputValue();
    console.log('After input1=3, calculated1 value:', calculated1Value);
    expect(calculated1Value).toBe('6');

    // Check calculated2 (should be 11)
    const calculated2Value = await calculated2.inputValue();
    console.log('After input1=3, calculated2 value:', calculated2Value);
    expect(calculated2Value).toBe('11');

    // Test with different value
    await input1.fill('5');
    await input1.blur();

    // Wait for calculations to complete
    await page.waitForTimeout(500);

    // Check calculated1 (should be 10)
    const calculated1Value2 = await calculated1.inputValue();
    console.log('After input1=5, calculated1 value:', calculated1Value2);
    expect(calculated1Value2).toBe('10');

    // Check calculated2 (should be 15)
    const calculated2Value2 = await calculated2.inputValue();
    console.log('After input1=5, calculated2 value:', calculated2Value2);
    expect(calculated2Value2).toBe('15');
  });

  test('should test template processing in review section', async ({
    page,
  }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button
    await page.click('button:has-text("Import JSON")');

    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]');

    // Create a test form with template processing
    const testForm = {
      app: {
        title: 'Template Processing Test',
        pages: [
          {
            id: 'testPage',
            title: 'Test Page',
            route: '/test',
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
                label: 'Calculated 1',
                expression: {
                  expression: 'input1 * 2',
                  mode: 'value',
                  dependencies: ['input1'],
                },
                props: {
                  inputType: 'number',
                  readOnly: true,
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
                        'Input 1: {{input1}}\nCalculated 1: {{calculated1}}',
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
      languageDetails: [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
        },
      ],
    };

    // Load the test form
    await page.fill('textarea', JSON.stringify(testForm, null, 2));

    // Click Import button
    await page.click('button:has-text("Import")');

    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter a number"]');

    // Enter value in input1
    const input1 = page.locator('input[placeholder="Enter a number"]');
    await input1.fill('7');
    await input1.blur();

    // Wait for calculations to complete
    await page.waitForTimeout(500);

    // Check that template variables are processed correctly
    const reviewText = page.locator('text=Input 1: 7');
    await expect(reviewText).toBeVisible();

    const reviewCalculated1 = page.locator('text=Calculated 1: 14');
    await expect(reviewCalculated1).toBeVisible();
  });
});
