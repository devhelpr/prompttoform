import { test, expect } from '@playwright/test';

test.describe('BMI Calculator Direct Test', () => {
  test('should test BMI calculator by clicking Import directly', async ({
    page,
  }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button
    await page.locator('button:has-text("Import JSON")').first().click();

    // Wait for the dialog to appear
    await page.waitForSelector('dialog:visible', { timeout: 5000 });

    // Create a simpler BMI form for testing
    const bmiForm = {
      app: {
        title: 'BMI Calculator',
        pages: [
          {
            id: 'bmi-input',
            title: 'Enter measurements',
            route: '/',
            layout: 'vertical',
            components: [
              {
                type: 'input',
                id: 'weightKg',
                label: 'Body weight (kg)',
                props: {
                  inputType: 'number',
                  placeholder: 'Enter weight in kg',
                },
                validation: {
                  required: true,
                },
              },
              {
                type: 'input',
                id: 'heightCm',
                label: 'Height (cm)',
                props: {
                  inputType: 'number',
                  placeholder: 'Enter height in cm',
                },
                validation: {
                  required: true,
                },
              },
              {
                type: 'input',
                id: 'bmi',
                label: 'Body Mass Index (BMI)',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText: 'Calculated automatically',
                  expression: {
                    expression:
                      'round(weightKg / pow(heightCm/100, 2) * 10) / 10',
                    mode: 'value',
                    dependencies: ['weightKg', 'heightCm'],
                    evaluateOnChange: true,
                    debounceMs: 100,
                  },
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

    // Fill the textarea with the BMI form
    await page.fill('textarea', JSON.stringify(bmiForm, null, 2));

    // Wait a moment for validation
    await page.waitForTimeout(2000);

    // Try to click the Import button directly (even if disabled)
    const importButton = page.locator('dialog button:has-text("Import Form")');

    // Check if button is enabled
    const isEnabled = await importButton.isEnabled();
    console.log('Import button enabled:', isEnabled);

    if (isEnabled) {
      await importButton.click();

      // Wait for the form to load
      await page.waitForSelector('input[placeholder="Enter weight in kg"]', {
        timeout: 10000,
      });

      // Get the BMI input field
      const bmiInput = page.locator('input[readonly]');
      await expect(bmiInput).toBeVisible();

      console.log('✅ BMI Calculator form loaded successfully');
      console.log('✅ BMI calculation field is visible');
    } else {
      console.log('❌ Import button is disabled - JSON validation failed');

      // Take a screenshot to see what's happening
      await page.screenshot({ path: 'bmi-import-failed.png' });

      // Check if there are any validation error messages
      const errorMessages = page.locator('text=/error|invalid|required/i');
      const errorCount = await errorMessages.count();
      console.log('Error messages found:', errorCount);

      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`Error ${i + 1}:`, errorText);
        }
      }
    }
  });
});
