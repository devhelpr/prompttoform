import { test, expect } from '@playwright/test';

test.describe('Logical Page Ordering Validation', () => {
  test('should show correct step indicators and page content', async ({
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

    // Check for step indicators - should show "Step 1 of 2"
    const stepIndicator = page.locator('text=Step 1 of 2');
    await expect(stepIndicator).toBeVisible();
    console.log('✅ Step indicator "Step 1 of 2" is visible');

    // Look for the form field label to verify we're on the first page
    const firstFieldLabel = page.locator('text=First Field');
    await expect(firstFieldLabel).toBeVisible();
    console.log('✅ First page field "First Field" is visible');

    // Navigate to the next page
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 2 of 2"
    const stepIndicator2 = page.locator('text=Step 2 of 2');
    await expect(stepIndicator2).toBeVisible();
    console.log('✅ Step indicator "Step 2 of 2" is visible');

    // Look for the second page field
    const secondFieldLabel = page.locator('text=Second Field');
    await expect(secondFieldLabel).toBeVisible();
    console.log('✅ Second page field "Second Field" is visible');

    // Navigate back to the first page
    const previousButton = page.locator('button:has-text("Previous")');
    await previousButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 1 of 2" again
    await expect(stepIndicator).toBeVisible();
    console.log('✅ Back to "Step 1 of 2"');

    // Verify we're back on the first page
    await expect(firstFieldLabel).toBeVisible();
    console.log('✅ Back to first page field');

    console.log('🎉 All logical page ordering tests passed!');
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

    // Should show "Step 1 of 3" and be on the first page (logically, not by array order)
    const stepIndicator = page.locator('text=Step 1 of 3');
    await expect(stepIndicator).toBeVisible();
    console.log('✅ Step indicator "Step 1 of 3" is visible');

    // Verify we're on the first page (logically) by looking for the first field
    const firstFieldLabel = page.locator('text=First Field');
    await expect(firstFieldLabel).toBeVisible();
    console.log('✅ Correctly showing First Page (logical order)');

    // Navigate to the next page
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 2 of 3"
    const stepIndicator2 = page.locator('text=Step 2 of 3');
    await expect(stepIndicator2).toBeVisible();
    console.log('✅ Step indicator "Step 2 of 3" is visible');

    // Verify we're on the second page
    const secondFieldLabel = page.locator('text=Second Field');
    await expect(secondFieldLabel).toBeVisible();
    console.log('✅ Correctly showing Second Page');

    // Navigate to the next page
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 3 of 3"
    const stepIndicator3 = page.locator('text=Step 3 of 3');
    await expect(stepIndicator3).toBeVisible();
    console.log('✅ Step indicator "Step 3 of 3" is visible');

    // Verify we're on the third page
    const thirdFieldLabel = page.locator('text=Third Field');
    await expect(thirdFieldLabel).toBeVisible();
    console.log('✅ Correctly showing Third Page');

    console.log(
      '🎉 Wrong array order test passed! Logical ordering is working correctly!'
    );
  });
});
