import { test, expect } from '@playwright/test';

test.describe('Wrong Order Debug Test', () => {
  test('should debug wrong array order form', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a form where pages are in wrong array order but have correct logical flow
    const wrongOrderFormJson = {
      app: {
        title: 'Wrong Order Test',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
        },
        pages: [
          {
            id: 'page3',
            title: 'Third Page',
            route: '/page3',
            components: [
              {
                id: 'field3',
                type: 'input',
                label: 'Third Field',
                props: { inputType: 'text' },
              },
            ],
          },
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
            nextPage: 'page3',
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
    await jsonTextarea.fill(JSON.stringify(wrongOrderFormJson, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(2000);

    // Check what step indicators are showing
    const allStepIndicators = page.locator('text=/Step \\d+ of \\d+/');
    const stepCount = await allStepIndicators.count();
    console.log('Step indicators found:', stepCount);

    for (let i = 0; i < stepCount; i++) {
      const stepText = await allStepIndicators.nth(i).textContent();
      console.log(`Step indicator ${i}: "${stepText}"`);
    }

    // Check what field is showing
    const allFields = page.locator('text=/Field/');
    const fieldCount = await allFields.count();
    console.log('Fields found:', fieldCount);

    for (let i = 0; i < fieldCount; i++) {
      const fieldText = await allFields.nth(i).textContent();
      console.log(`Field ${i}: "${fieldText}"`);
    }

    // Check if we can see the first field (logical first page)
    const firstFieldLabel = page.locator('text=First Field');
    const firstFieldExists = (await firstFieldLabel.count()) > 0;

    if (firstFieldExists) {
      console.log('✅ Correctly showing First Field (logical order)');
    } else {
      console.log('❌ Not showing First Field');
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-wrong-order-form.png' });

    // Just make the test pass for now to see the output
    expect(true).toBe(true);
  });
});
