import { test, expect } from '@playwright/test';

test.describe('Text Component Template Update', () => {
  test('resultText should update when slider changes', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Click the import button
    const importButton = page.locator('button:has-text("Import JSON")').first();
    await importButton.click();

    // Wait for the import modal
    await page.waitForSelector('textarea', { timeout: 5000 });

    // Load the form JSON
    const formJson = {
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
                props: { className: 'grid grid-cols-2 gap-4' },
                children: [
                  {
                    id: 'leftColumn',
                    type: 'section',
                    label: 'Input',
                    props: { className: 'col-span-1' },
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
                    props: { className: 'col-span-1' },
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
        { code: 'en', name: 'English', nativeName: 'English' },
      ],
    };

    // Find the textarea in the import modal
    const textarea = page.locator('textarea[placeholder*="Paste your JSON form definition here"]');
    await textarea.fill(JSON.stringify(formJson, null, 2));

    // Click the import button in the modal
    const modalImportButton = page.locator('dialog button:has-text("Import Form"):not([disabled])');
    await expect(modalImportButton).toBeEnabled({ timeout: 10000 });
    await modalImportButton.click();

    // Wait for the modal to close and form to load
    await page.waitForSelector('dialog', { state: 'hidden', timeout: 5000 });

    // Wait for the form to render - look for the slider
    await page.waitForSelector('[id="sliderValue"]', { timeout: 10000 });

    // Wait a bit for initial render
    await page.waitForTimeout(1000);

    // Find the slider container
    const sliderContainer = page.locator('[id="sliderValue"]').first();
    await expect(sliderContainer).toBeVisible({ timeout: 5000 });
    
    // Find the slider input
    const slider = sliderContainer.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();

    // Get initial state of resultText
    const resultText = page.locator('text=/You selected.*doubled is.*/').first();
    
    // Take a screenshot of initial state
    await page.screenshot({
      path: 'test-results/01-initial-state.png',
      fullPage: true,
    });

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
      
      await page.waitForTimeout(500); // Wait for debounce

      // Check console for any errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Take a screenshot after moving slider
      await page.screenshot({
        path: 'test-results/02-after-slider-25.png',
        fullPage: true,
      });

      // Check if resultText updated - it should show "You selected 25 — doubled is 50"
      // We need to check the helperText content
      const helperText = page.locator('text=/You selected.*25.*doubled is.*50/').first();
      
      // Also check the actual text content
      const allText = await page.locator('body').textContent();
      console.log('Page text content:', allText);

      // Log the resultText element details
      const resultTextElement = page.locator('label:has-text("Summary")').locator('..');
      const helperTextContent = await resultTextElement.locator('p').textContent();
      console.log('Helper text content:', helperTextContent);

      // Take another screenshot
      await page.screenshot({
        path: 'test-results/03-check-helper-text.png',
        fullPage: true,
      });

      // Move slider to 50 (50% of the slider width)
      const targetX2 = sliderRect.x + sliderRect.width * 0.5;
      await page.mouse.move(targetX2, targetY);
      await page.mouse.down();
      await page.mouse.move(targetX2, targetY);
      await page.mouse.up();
      
      await page.waitForTimeout(500);

      // Take screenshot after moving to 50
      await page.screenshot({
        path: 'test-results/04-after-slider-50.png',
        fullPage: true,
      });

      // Check updated helper text
      const helperTextAfter50 = await resultTextElement.locator('p').textContent();
      console.log('Helper text after slider=50:', helperTextAfter50);

      // The helper text should contain "50" and "100"
      expect(helperTextAfter50).toContain('50');
      expect(helperTextAfter50).toContain('100');

      // Log any console errors
      if (consoleErrors.length > 0) {
        console.log('Console errors:', consoleErrors);
      }
    }
  });
});

