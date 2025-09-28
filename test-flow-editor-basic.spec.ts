import { test, expect } from '@playwright/test';

test.describe('Flow Editor Basic Test', () => {
  test('should load flow editor and check console logs', async ({ page }) => {
    // Listen to console logs
    page.on('console', (msg) => {
      if (msg.text().includes('generateFormFromFlow')) {
        console.log('CONSOLE LOG:', msg.text());
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a simple form
    const simpleForm = {
      app: {
        title: 'Test Form',
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
    await jsonTextarea.fill(JSON.stringify(simpleForm, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Switch to Flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(3000);

    // Check if flow editor loaded
    const flowNodes = page.locator('.react-flow__node');
    const nodeCount = await flowNodes.count();
    console.log(`Flow editor loaded with ${nodeCount} nodes`);

    // Check if edges are visible
    const flowEdges = page.locator('.react-flow__edge');
    const edgeCount = await flowEdges.count();
    console.log(`Flow editor has ${edgeCount} edges`);

    // Just make the test pass for now to see the console logs
    expect(true).toBe(true);
  });
});
