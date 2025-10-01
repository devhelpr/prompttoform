import { test, expect } from '@playwright/test';

test('Debug Flow Error', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Switch to JSON view
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(2000);

  // Create a simple form JSON
  const simpleFormJson = JSON.stringify(
    {
      app: {
        name: 'Test Form',
        pages: [
          {
            id: 'page1',
            title: 'Test Page',
            fields: [
              {
                id: 'field1',
                type: 'text',
                label: 'Test Field',
                required: true,
              },
            ],
          },
        ],
      },
    },
    null,
    2
  );

  // Fill the JSON textarea
  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  await jsonTextarea.fill(simpleFormJson);
  await page.waitForTimeout(1000);

  // Click Import Form button
  const importFormButton = page.locator('button:has-text("Import Form")');
  await importFormButton.click();
  await page.waitForTimeout(3000);

  // Switch to Form Logic view
  await page.click('button:has-text("Form Logic")');
  await page.waitForTimeout(3000);

  // Check for error messages
  const errorMessages = page.locator(
    '[class*="error"], [class*="alert"], .text-red-500, .text-red-600'
  );
  const errorCount = await errorMessages.count();
  console.log('Error messages found:', errorCount);

  for (let i = 0; i < errorCount; i++) {
    const text = await errorMessages.nth(i).textContent();
    const isVisible = await errorMessages.nth(i).isVisible();
    if (isVisible) {
      console.log(`Error message ${i}: "${text}"`);
    }
  }

  // Look for React Flow nodes specifically
  const reactFlowNodes = page.locator('.react-flow__node');
  const nodeCount = await reactFlowNodes.count();
  console.log('React Flow nodes found:', nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const text = await reactFlowNodes.nth(i).textContent();
    const isVisible = await reactFlowNodes.nth(i).isVisible();
    console.log(`Node ${i}: "${text}" (visible: ${isVisible})`);
  }

  // Look for the main React Flow container
  const reactFlowContainer = page.locator('.react-flow');
  const containerExists = (await reactFlowContainer.count()) > 0;
  console.log('React Flow container exists:', containerExists);

  if (containerExists) {
    const isVisible = await reactFlowContainer.isVisible();
    console.log('React Flow container visible:', isVisible);

    if (isVisible) {
      // Check if there are any nodes inside
      const nodesInside = reactFlowContainer.locator('.react-flow__node');
      const nodesInsideCount = await nodesInside.count();
      console.log('Nodes inside React Flow container:', nodesInsideCount);
    }
  }

  // Check console for any JavaScript errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Take a screenshot
  await page.screenshot({ path: 'debug-flow-error.png' });
});
