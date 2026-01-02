import { test, expect } from '@playwright/test';

const formJson = JSON.stringify({
  app: {
    title: 'Two-column Slider Calculation',
    pages: [
      {
        id: 'page1',
        title: 'Slider Calculation',
        route: '/slider-calculation',
        layout: 'grid',
        components: [
          {
            id: 'layoutSection',
            type: 'section',
            label: 'Calculation Grid',
            props: {
              className: 'grid grid-cols-2 gap-4',
            },
            children: [
              {
                id: 'leftColumn',
                type: 'section',
                label: 'Input',
                props: {
                  className: 'col-span-1',
                },
                children: [
                  {
                    id: 'sliderValue',
                    type: 'slider-range',
                    label: 'Choose a value',
                    props: {
                      min: 0,
                      max: 100,
                      step: 1,
                      mode: 'single',
                      showLabels: true,
                      showValue: true,
                      helperText: 'Select a number. Use the slider to pick a value.',
                    },
                    validation: {
                      required: true,
                      errorMessages: {
                        required: 'Please select a value using the slider',
                      },
                    },
                  },
                ],
              },
              {
                id: 'rightColumn',
                type: 'section',
                label: 'Result',
                props: {
                  className: 'col-span-1',
                },
                children: [
                  {
                    id: 'doubleValue',
                    type: 'input',
                    label: 'Value × 2',
                    props: {
                      inputType: 'number',
                      readOnly: true,
                      helperText: 'Calculated automatically from your slider selection',
                      expression: {
                        expression: 'sliderValue.value * 2',
                        mode: 'value',
                        dependencies: ['sliderValue'],
                        evaluateOnChange: true,
                        debounceMs: 100,
                      },
                    },
                    validation: {
                      required: true,
                      errorMessages: {
                        required: 'Calculated value is required',
                      },
                    },
                  },
                  {
                    id: 'resultText',
                    type: 'text',
                    label: 'Summary',
                    props: {
                      helperText: 'You selected {{sliderValue}} — doubled is {{doubleValue}}',
                    },
                  },
                ],
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
}, null, 2);

test.describe('Slider Expression Update', () => {
  test('should update calculated value when slider changes', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any redirects or auth flows
    await page.waitForTimeout(3000);

    // Look for the Import JSON button - wait up to 15 seconds
    const importButton = page.locator('button:has-text("Import JSON")').first();
    
    // Try to wait for it, but if it doesn't appear, check the URL
    try {
      await expect(importButton).toBeVisible({ timeout: 15000 });
    } catch (e) {
      const url = page.url();
      console.log('Current URL:', url);
      const pageContent = await page.content();
      console.log('Page has "Import JSON" text:', pageContent.includes('Import JSON'));
      throw e;
    }

    // Click the Import JSON button
    await importButton.click();

    // Wait for the modal to appear
    await page.waitForSelector('textarea', { timeout: 5000 });

    // Fill in the JSON
    const textarea = page.locator(
      'textarea[placeholder*="Paste your JSON form definition here"]'
    );
    await textarea.fill(formJson);

    // Click the Import Form button
    const modalImportButton = page.locator('dialog button:has-text("Import Form"):not([disabled])');
    await expect(modalImportButton).toBeEnabled({ timeout: 10000 });
    await modalImportButton.click();

    // Wait for the modal to close and form to load
    await page.waitForSelector('dialog', { state: 'hidden', timeout: 5000 });

    // Wait for the form to load - look for the slider in the preview panel
    await page.waitForSelector('[id="sliderValue"]', { timeout: 10000 });

    // Find the slider element
    const sliderContainer = page.locator('[id="sliderValue"]').first();
    await expect(sliderContainer).toBeVisible({ timeout: 5000 });

    // Find the calculated input field
    const calculatedInput = page.locator('input[id="doubleValue"]').first();
    await expect(calculatedInput).toBeVisible({ timeout: 5000 });

    // Get initial value (should be 0 or empty)
    const initialValue = await calculatedInput.inputValue();
    console.log('Initial calculated value:', initialValue);

    // Get slider bounding box
    const sliderRect = await sliderContainer.boundingBox();
    expect(sliderRect).not.toBeNull();

    if (sliderRect) {
      // Move slider to 25 (25% of the slider width)
      const targetX = sliderRect.x + sliderRect.width * 0.25;
      const targetY = sliderRect.y + sliderRect.height / 2;

      await page.mouse.move(targetX, targetY);
      await page.mouse.down();
      await page.mouse.move(targetX, targetY);
      await page.mouse.up();

      // Wait for expression evaluation (with debounce + extra time)
      await page.waitForTimeout(500);

      // Check that the calculated value is updated to 50 (25 * 2)
      const valueAfter25 = await calculatedInput.inputValue();
      console.log('Value after slider at 25:', valueAfter25);
      const numValue25 = parseFloat(valueAfter25) || 0;
      expect(numValue25).toBeCloseTo(50, 1);

      // Move slider to 50 (50% of the slider width)
      const targetX2 = sliderRect.x + sliderRect.width * 0.5;
      await page.mouse.move(targetX2, targetY);
      await page.mouse.down();
      await page.mouse.move(targetX2, targetY);
      await page.mouse.up();

      // Wait for expression evaluation (with debounce + extra time)
      await page.waitForTimeout(500);

      // Check that the calculated value is updated to 100 (50 * 2)
      const valueAfter50 = await calculatedInput.inputValue();
      console.log('Value after slider at 50:', valueAfter50);
      const numValue50 = parseFloat(valueAfter50) || 0;
      expect(numValue50).toBeCloseTo(100, 1);
    }

    // Take a screenshot for debugging
    await page.screenshot({
      path: 'playwright-tests/screenshots/test-slider-expression-update.png',
    });
  });
});

