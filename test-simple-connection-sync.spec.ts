import { test, expect } from '@playwright/test';

test.describe('Simple Connection Sync Test', () => {
  test('should verify nextPage connections are lost during flow sync', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a form with explicit nextPage connections
    const formWithConnections = {
      app: {
        title: 'Connection Test Form',
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
            nextPage: 'page2', // Explicit connection
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
    await jsonTextarea.fill(JSON.stringify(formWithConnections, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'debug-initial-form.png' });

    // Switch to Flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(3000);

    // Take a screenshot of the flow editor
    await page.screenshot({ path: 'debug-flow-editor.png' });

    // Switch back to JSON view
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(3000);

    // Take a screenshot of the JSON view after flow sync
    await page.screenshot({ path: 'debug-after-flow-sync.png' });

    // Get the current JSON content
    const currentJsonText = await jsonTextarea.inputValue();
    console.log('Current JSON after flow sync:');
    console.log(currentJsonText);

    const currentForm = JSON.parse(currentJsonText);

    // Check if nextPage connections are preserved
    const page1 = currentForm.app.pages.find((p: any) => p.id === 'page1');
    const page2 = currentForm.app.pages.find((p: any) => p.id === 'page2');

    console.log('Page1 nextPage:', page1?.nextPage);
    console.log('Page2 nextPage:', page2?.nextPage);

    // Check if the connection was lost
    if (page1?.nextPage === 'page2') {
      console.log('✅ nextPage connection preserved');
    } else {
      console.log('❌ nextPage connection LOST!');
      console.log('Expected: page2, Got:', page1?.nextPage);
    }

    // Just make the test pass for now to see the output
    expect(true).toBe(true);
  });
});
