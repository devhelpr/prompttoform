import { test, expect } from '@playwright/test';

test.describe('Connection Sync Fix Test', () => {
  test('should preserve nextPage connections during flow sync', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a simple form with nextPage connection
    const simpleForm = {
      app: {
        title: 'Connection Test',
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
            nextPage: 'page2', // This should be preserved
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
    await jsonTextarea.fill(JSON.stringify(simpleForm, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Switch to Flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(3000);

    // Wait a bit for the flow to load
    await page.waitForTimeout(2000);

    // Switch back to JSON view
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(3000);

    // Get the current JSON content
    const currentJsonText = await jsonTextarea.inputValue();
    console.log('Current JSON after flow sync:');
    console.log(currentJsonText);

    // Parse and check the result
    const currentForm = JSON.parse(currentJsonText);
    const page1 = currentForm.app.pages.find((p: any) => p.id === 'page1');

    console.log('Page1 nextPage after sync:', page1?.nextPage);

    // The connection should be preserved
    expect(page1?.nextPage).toBe('page2');
  });
});
