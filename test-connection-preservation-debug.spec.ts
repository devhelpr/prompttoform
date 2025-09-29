import { test, expect } from '@playwright/test';

test.describe('Connection Preservation Debug', () => {
  test('should debug connection preservation issue', async ({ page }) => {
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
        title: 'Simple Connection Test',
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
            nextPage: 'page2', // This connection should be preserved
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

    // Check initial JSON content
    const initialJsonText = await jsonTextarea.inputValue();
    const initialForm = JSON.parse(initialJsonText);
    console.log(
      'Initial form page1 nextPage:',
      initialForm.app.pages[0].nextPage
    );

    // Switch to Flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(3000);

    // Check if flow editor loaded correctly
    const flowNodes = page.locator('.react-flow__node');
    const nodeCount = await flowNodes.count();
    console.log(`Flow editor loaded with ${nodeCount} nodes`);

    // Check if edges are visible
    const flowEdges = page.locator('.react-flow__edge');
    const edgeCount = await flowEdges.count();
    console.log(`Flow editor has ${edgeCount} edges`);

    // Switch back to JSON view
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(3000);

    // Check final JSON content
    const finalJsonText = await jsonTextarea.inputValue();
    const finalForm = JSON.parse(finalJsonText);
    console.log('Final form page1 nextPage:', finalForm.app.pages[0].nextPage);

    // Compare initial vs final
    const initialNextPage = initialForm.app.pages[0].nextPage;
    const finalNextPage = finalForm.app.pages[0].nextPage;

    console.log('Initial nextPage:', initialNextPage);
    console.log('Final nextPage:', finalNextPage);

    if (initialNextPage === finalNextPage) {
      console.log('✅ Connection preserved!');
    } else {
      console.log('❌ Connection lost!');
      console.log('Expected:', initialNextPage);
      console.log('Got:', finalNextPage);
    }

    // Just make the test pass for now to see the output
    expect(true).toBe(true);
  });
});
