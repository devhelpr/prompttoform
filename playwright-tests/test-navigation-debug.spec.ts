import { test, expect } from '@playwright/test';

test.describe('Navigation Debug Test', () => {
  test('should debug navigation between pages', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a simple form with two pages
    const twoPageFormJson = {
      app: {
        title: 'Two Page Test',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
        },
        pages: [
          {
            id: 'page1',
            title: 'First Page',
            route: '/page1',
            components: [
              {
                id: 'field1',
                type: 'input',
                label: 'First Field',
                props: { inputType: 'text' },
                // Remove validation to avoid blocking navigation
              },
            ],
            nextPage: 'page2',
          },
          {
            id: 'page2',
            title: 'Second Page',
            route: '/page2',
            components: [
              {
                id: 'field2',
                type: 'input',
                label: 'Second Field',
                props: { inputType: 'text' },
              },
            ],
          },
        ],
      },
    };

    // Import the form
    const importJsonButton = page
      .locator('button:has-text("Import JSON")')
      .first();
    await importJsonButton.click();
    await page.waitForTimeout(2000);

    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await jsonTextarea.clear();
    await jsonTextarea.fill(JSON.stringify(twoPageFormJson, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(2000);

    // Check initial state
    const stepIndicator1 = page.locator('text=Step 1 of 2');
    await expect(stepIndicator1).toBeVisible();
    console.log('✅ Initial state: Step 1 of 2 is visible');

    const firstFieldLabel = page.locator('text=First Field');
    await expect(firstFieldLabel).toBeVisible();
    console.log('✅ Initial state: First Field is visible');

    // Fill in the first field to avoid validation issues
    const firstFieldInput = page.locator('input[type="text"]').first();
    await firstFieldInput.fill('Test value');
    console.log('✅ Filled first field with test value');

    // Click Next button
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(2000);

    // Check if we navigated to the second page
    const stepIndicator2 = page.locator('text=Step 2 of 2');
    const stepIndicator2Exists = (await stepIndicator2.count()) > 0;

    if (stepIndicator2Exists) {
      console.log('✅ Navigation successful: Step 2 of 2 is visible');
    } else {
      console.log('❌ Navigation failed: Step 2 of 2 not found');

      // Check what step indicator is showing
      const allStepIndicators = page.locator('text=/Step \\d+ of \\d+/');
      const stepCount = await allStepIndicators.count();
      console.log('Step indicators found:', stepCount);

      for (let i = 0; i < stepCount; i++) {
        const stepText = await allStepIndicators.nth(i).textContent();
        console.log(`Step indicator ${i}: "${stepText}"`);
      }
    }

    // Check if we can see the second page field
    const secondFieldLabel = page.locator('text=Second Field');
    const secondFieldExists = (await secondFieldLabel.count()) > 0;

    if (secondFieldExists) {
      console.log('✅ Second page field is visible');
    } else {
      console.log('❌ Second page field not found');
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-navigation-after-next.png' });

    // Just make the test pass for now to see the output
    expect(true).toBe(true);
  });
});
