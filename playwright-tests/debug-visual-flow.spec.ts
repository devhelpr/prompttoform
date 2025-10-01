import { test, expect } from '@playwright/test';

test('Debug Form Logic View', async ({ page }) => {
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

  // Take a screenshot
  await page.screenshot({ path: 'debug-visual-flow.png' });

  // Check what's actually in the Form Logic view
  const bodyText = await page.locator('body').textContent();
  console.log(
    'Body text in Form Logic view (first 500 chars):',
    bodyText?.substring(0, 500)
  );

  // Look for any React Flow elements
  const reactFlowElements = page.locator(
    '[class*="react-flow"], [class*="flow"], .react-flow__node, .react-flow__edge'
  );
  const reactFlowCount = await reactFlowElements.count();
  console.log('React Flow elements found:', reactFlowCount);

  // Look for any error messages
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

  // Look for loading indicators
  const loadingElements = page.locator(
    '[class*="loading"], [class*="spinner"], [data-testid*="loading"]'
  );
  const loadingCount = await loadingElements.count();
  console.log('Loading elements found:', loadingCount);

  // Check if there are any divs with flow-related classes
  const flowDivs = page.locator('div[class*="flow"], div[class*="react-flow"]');
  const flowDivCount = await flowDivs.count();
  console.log('Flow divs found:', flowDivCount);

  for (let i = 0; i < flowDivCount; i++) {
    const className = await flowDivs.nth(i).getAttribute('class');
    const isVisible = await flowDivs.nth(i).isVisible();
    console.log(`Flow div ${i}: class="${className}", visible=${isVisible}`);
  }
});
