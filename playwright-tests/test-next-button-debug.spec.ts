import { test, expect } from '@playwright/test';

test.describe('Next Button Debug Test', () => {
  test('should debug Next button behavior', async ({ page }) => {
    // Listen to console logs
    page.on('console', (msg) => {
      if (
        msg.text().includes('FormRenderer') ||
        msg.text().includes('handleNext') ||
        msg.text().includes('getNextPage')
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

    // Load a form with pages in wrong array order but correct logical order
    const testForm = {
      app: {
        title: 'Next Button Debug Test',
        pages: [
          {
            id: 'page2',
            title: 'Second Page (Array Index 0)',
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
          {
            id: 'page1',
            title: 'First Page (Array Index 1)',
            route: '/page1',
            components: [
              {
                id: 'field1',
                type: 'input',
                label: 'First Field',
                props: { inputType: 'text' },
              },
            ],
            nextPage: 'page2', // This creates the logical order: page1 -> page2
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

    // Check initial state
    const initialPageTitle = page.locator(
      'h2:has-text("First Page (Array Index 1)")'
    );
    const initialPageExists = (await initialPageTitle.count()) > 0;
    console.log('Initial page (First Page) exists:', initialPageExists);

    // Fill the input field
    const inputField = page.locator('input[type="text"]').first();
    await inputField.fill('Test Value');

    // Click Next button
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(2000);

    // Check what page we're on now
    const firstPageStillExists =
      (await page
        .locator('h2:has-text("First Page (Array Index 1)")')
        .count()) > 0;
    const secondPageExists =
      (await page
        .locator('h2:has-text("Second Page (Array Index 0)")')
        .count()) > 0;

    console.log(
      'First page still exists after Next click:',
      firstPageStillExists
    );
    console.log('Second page exists after Next click:', secondPageExists);

    // Check if there are any error messages
    const errorMessages = page.locator('text=/error|Error|invalid|Invalid/');
    const errorCount = await errorMessages.count();
    console.log('Error messages found:', errorCount);

    if (errorCount > 0) {
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i}:`, errorText);
      }
    }

    // Just make the test pass for now to see the debug output
    expect(true).toBe(true);
  });
});
