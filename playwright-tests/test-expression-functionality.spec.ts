import { test, expect } from '@playwright/test';

test.describe('Expression Functionality Test', () => {
  test('should test expression system with a simple form', async ({ page }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button
    await page.locator('button:has-text("Import JSON")').first().click();

    // Wait for the dialog to appear
    await page.waitForSelector('dialog:visible', { timeout: 5000 });

    // Create a simple test form with expressions
    const testForm = {
      app: {
        title: 'Expression Test',
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

    // Fill the textarea with the test form
    await page.fill('textarea', JSON.stringify(testForm, null, 2));

    // Wait for the Import button to become enabled
    await page.waitForSelector(
      'dialog button:has-text("Import Form"):not([disabled])',
      { timeout: 10000 }
    );

    // Click Import button
    await page.click('dialog button:has-text("Import Form")');

    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter a number"]', {
      timeout: 10000,
    });

    // Get the input and calculated fields
    const input1 = page.locator('input[placeholder="Enter a number"]');
    const calculated1 = page.locator('input[readonly]');

    // Check initial state
    console.log('=== INITIAL STATE ===');
    console.log('Input1 value:', await input1.inputValue());
    console.log('Calculated1 value:', await calculated1.inputValue());

    // Enter value in input1
    console.log('=== ENTERING VALUE 5 ===');
    await input1.fill('5');
    await input1.blur();

    // Wait for calculations to complete
    await page.waitForTimeout(1000);

    // Check values after input
    console.log('=== AFTER INPUT ===');
    console.log('Input1 value:', await input1.inputValue());
    console.log('Calculated1 value:', await calculated1.inputValue());

    // Verify the calculated field shows the correct value
    const calculated1Value = await calculated1.inputValue();
    expect(calculated1Value).toBe('10');

    console.log('✅ Expression system working correctly!');
    console.log('✅ Input value: 5');
    console.log('✅ Calculated value: 10 (5 * 2)');
  });
});
