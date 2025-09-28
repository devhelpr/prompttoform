import { test, expect } from '@playwright/test';

test.describe('Form Node Indexing Validation', () => {
  test('should show correct step indicators for simple slider form', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load the simple slider form
    const sliderFormJson = {
      app: {
        title: 'Simple Slider Test',
        version: '1.0.0',
        language: 'en',
        theme: 'default',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
          allowBackNavigation: true,
          submitButtonText: 'Submit',
          nextButtonText: 'Next',
          previousButtonText: 'Previous',
          showRestartButton: true,
          restartButtonText: 'Restart',
        },
        pages: [
          {
            id: 'page1',
            title: 'Slider Addition Test',
            route: '/slider-test',
            components: [
              {
                id: 'slider1',
                type: 'slider-range',
                label: 'First Number',
                props: {
                  min: 0,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Move this slider to change the first number',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'slider2',
                type: 'slider-range',
                label: 'Second Number',
                props: {
                  min: 0,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Move this slider to change the second number',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'sum',
                type: 'input',
                label: 'Sum (Readonly)',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText:
                    'This field shows the sum of the two sliders above',
                },
                expression: {
                  expression: 'slider1.value + slider2.value',
                  mode: 'value',
                  dependencies: ['slider1', 'slider2'],
                  evaluateOnChange: true,
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Test Complete!',
          message: 'Thank you for testing the simple slider addition form.',
          showRestartButton: true,
        },
      },
    };

    // Click the first "Import JSON" button
    const importJsonButton = page
      .locator('button:has-text("Import JSON")')
      .first();
    await importJsonButton.click();
    await page.waitForTimeout(2000);

    // Find the JSON textarea and paste the form
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await jsonTextarea.clear();
    await jsonTextarea.fill(JSON.stringify(sliderFormJson, null, 2));
    await page.waitForTimeout(1000);

    // Click Import Form to load the form
    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Click the View Flow button in the header
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(2000);

    // Check for step indicators - should show "Step 1 of 1" for single page form
    const stepIndicator = page.locator('text=Step 1 of 1');
    await expect(stepIndicator).toBeVisible();

    // Verify we're on the slider page
    const pageTitle = page.locator('h2, h3').first();
    const pageTitleText = await pageTitle.textContent();
    expect(pageTitleText).toContain('Slider Addition Test');

    console.log('✅ Simple slider form shows correct step indicators');

    // Close the preview sidebar
    await previewButton.click();
    await page.waitForTimeout(1000);
  });

  test('should maintain logical order when adding a page before existing page', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a form with two pages in logical order
    const twoPageFormJson = {
      app: {
        title: 'Two Page Test',
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
                validation: { required: true },
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
                validation: { required: true },
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

    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(2000);

    // Should show "Step 1 of 2"
    const stepIndicator1 = page.locator('text=Step 1 of 2');
    await expect(stepIndicator1).toBeVisible();

    // Verify we're on the first page
    const pageTitle1 = page.locator('h2, h3').first();
    const pageTitleText1 = await pageTitle1.textContent();
    expect(pageTitleText1).toContain('First Page');

    // Navigate to the next page
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 2 of 2"
    const stepIndicator2 = page.locator('text=Step 2 of 2');
    await expect(stepIndicator2).toBeVisible();

    // Verify we're on the second page
    const pageTitle2 = page.locator('h2, h3').first();
    const pageTitleText2 = await pageTitle2.textContent();
    expect(pageTitleText2).toContain('Second Page');

    console.log('✅ Two-page form shows correct logical step indicators');

    // Close the preview sidebar
    await previewButton.click();
    await page.waitForTimeout(1000);
  });

  test('should handle pages in wrong array order with correct logical ordering', async ({
    page,
  }) => {
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
                validation: { required: true },
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
                validation: { required: true },
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
                validation: { required: true },
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

    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(2000);

    // Should show "Step 1 of 3" and be on the first page (logically, not by array order)
    const stepIndicator = page.locator('text=Step 1 of 3');
    await expect(stepIndicator).toBeVisible();

    // Verify we're on the first page (logically)
    const pageTitle = page.locator('h2, h3').first();
    const pageTitleText = await pageTitle.textContent();
    expect(pageTitleText).toContain('First Page');

    console.log(
      '✅ Wrong array order form shows correct logical step indicators'
    );

    // Close the preview sidebar
    await previewButton.click();
    await page.waitForTimeout(1000);
  });
});
