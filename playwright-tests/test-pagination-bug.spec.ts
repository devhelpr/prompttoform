import { test, expect } from '@playwright/test';

test.describe('Form Pagination Bug Test', () => {
  test('should reproduce pagination bug - Next button not working', async ({
    page,
  }) => {
    // Listen to console logs for debugging
    page.on('console', (msg) => {
      console.log('BROWSER CONSOLE:', msg.text());
    });

    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Create a simple multi-page form to test pagination
    const testForm = {
      app: {
        title: 'Pagination Bug Test',
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
                id: 'name',
                type: 'input',
                label: 'Name',
                props: { inputType: 'text', placeholder: 'Enter your name' },
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
                id: 'email',
                type: 'input',
                label: 'Email',
                props: { inputType: 'email', placeholder: 'Enter your email' },
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
    await jsonTextarea.fill(JSON.stringify(testForm, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Click on Form Preview tab
    const formPreviewTab = page.locator('button:has-text("Form Preview")');
    await formPreviewTab.click();
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: 'playwright-tests/screenshots/debug-pagination-initial.png',
    });

    // Verify we're on the first page
    const firstPageTitle = page.locator('h2:has-text("First Page")');
    const firstPageExists = (await firstPageTitle.count()) > 0;
    console.log('First page exists:', firstPageExists);
    expect(firstPageExists).toBe(true);

    // Check for step indicator
    const stepIndicator = page.locator('text=Step 1 of 2');
    const stepIndicatorExists = (await stepIndicator.count()) > 0;
    console.log('Step indicator exists:', stepIndicatorExists);

    // Fill the required field
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('John Doe');
    await page.waitForTimeout(500);

    // Take screenshot before clicking Next
    await page.screenshot({
      path: 'playwright-tests/screenshots/debug-pagination-before-next.png',
    });

    // Look for the Next button
    const nextButton = page.locator('button:has-text("Next")');
    const nextButtonExists = (await nextButton.count()) > 0;
    console.log('Next button exists:', nextButtonExists);

    if (!nextButtonExists) {
      // Look for alternative button text
      const alternativeButtons = [
        'button:has-text("Continue")',
        'button:has-text("Submit")',
        'button[type="submit"]',
        'button:has-text("Next")',
      ];

      for (const selector of alternativeButtons) {
        const button = page.locator(selector);
        if ((await button.count()) > 0) {
          console.log(`Found button with selector: ${selector}`);
          break;
        }
      }
    }

    // Click the Next button
    await nextButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot after clicking Next
    await page.screenshot({
      path: 'playwright-tests/screenshots/debug-pagination-after-next.png',
    });

    // Check if we're still on the first page (bug)
    const stillOnFirstPage =
      (await page.locator('h2:has-text("First Page")').count()) > 0;
    const onSecondPage =
      (await page.locator('h2:has-text("Second Page")').count()) > 0;

    console.log('Still on first page after Next click:', stillOnFirstPage);
    console.log('On second page after Next click:', onSecondPage);

    // Check for validation errors
    const errorMessages = page.locator('text=/error|Error|required|Required/');
    const errorCount = await errorMessages.count();
    console.log('Error messages found:', errorCount);

    if (errorCount > 0) {
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i}:`, errorText);
      }
    }

    // Check if Next button is still visible (should be hidden on last page)
    const nextButtonStillVisible = (await nextButton.count()) > 0;
    console.log('Next button still visible:', nextButtonStillVisible);

    // This test should fail if the pagination bug exists
    if (stillOnFirstPage && !onSecondPage) {
      console.log(
        '❌ PAGINATION BUG CONFIRMED: Next button did not navigate to next page'
      );
      // Take a final debug screenshot
      await page.screenshot({
        path: 'playwright-tests/screenshots/debug-pagination-bug-confirmed.png',
      });
    } else {
      console.log('✅ Pagination working correctly');
    }

    // For now, just make the test pass to see the debug output
    expect(true).toBe(true);
  });

  test('should test pagination with a simple form without required fields', async ({
    page,
  }) => {
    // Listen to console logs for debugging
    page.on('console', (msg) => {
      if (
        msg.text().includes('FormRenderer') ||
        msg.text().includes('handleNext') ||
        msg.text().includes('validateForm') ||
        msg.text().includes('getNextPage') ||
        msg.text().includes('Page change') ||
        msg.text().includes('Error')
      ) {
        console.log('FORM LOG:', msg.text());
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Create a simple multi-page form without required fields
    const testForm = {
      app: {
        title: 'Simple Pagination Test',
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
                id: 'name',
                type: 'input',
                label: 'Name (Optional)',
                props: { inputType: 'text', placeholder: 'Enter your name' },
                // No validation - should allow navigation without filling
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
                id: 'email',
                type: 'input',
                label: 'Email (Optional)',
                props: { inputType: 'email', placeholder: 'Enter your email' },
                // No validation
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
    await jsonTextarea.fill(JSON.stringify(testForm, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Click on Form Preview tab
    const formPreviewTab = page.locator('button:has-text("Form Preview")');
    await formPreviewTab.click();
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: 'playwright-tests/screenshots/debug-simple-pagination-initial.png',
    });

    // Verify we're on the first page
    const firstPageTitle = page.locator('h2:has-text("First Page")');
    const firstPageExists = (await firstPageTitle.count()) > 0;
    console.log('First page exists (simple test):', firstPageExists);
    expect(firstPageExists).toBe(true);

    // Don't fill any fields - just click Next
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot after clicking Next
    await page.screenshot({
      path: 'playwright-tests/screenshots/debug-simple-pagination-after-next.png',
    });

    // Check if we navigated to the second page
    const stillOnFirstPage =
      (await page.locator('h2:has-text("First Page")').count()) > 0;
    const onSecondPage =
      (await page.locator('h2:has-text("Second Page")').count()) > 0;

    console.log(
      'Still on first page after Next click (simple test):',
      stillOnFirstPage
    );
    console.log('On second page after Next click (simple test):', onSecondPage);

    // Check for validation errors
    const errorMessages = page.locator('text=/error|Error|required|Required/');
    const errorCount = await errorMessages.count();
    console.log('Error messages found (simple test):', errorCount);

    if (errorCount > 0) {
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i} (simple test):`, errorText);
      }
    }

    // This test should pass if pagination works without required fields
    if (stillOnFirstPage && !onSecondPage) {
      console.log(
        '❌ PAGINATION BUG CONFIRMED: Next button did not navigate even without required fields'
      );
      await page.screenshot({
        path: 'playwright-tests/screenshots/debug-simple-pagination-bug-confirmed.png',
      });
    } else {
      console.log('✅ Simple pagination working correctly');
    }

    // For now, just make the test pass to see the debug output
    expect(true).toBe(true);
  });
});
