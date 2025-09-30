import { test, expect } from '@playwright/test';

test('Debug Console Errors', async ({ page }) => {
  // Set up console logging
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const message = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(message);
    console.log(message);
  });

  // Set up error logging
  page.on('pageerror', (error) => {
    console.log('Page error:', error.message);
  });

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

  // Check for any visible error messages
  const errorMessages = page.locator(
    '[class*="error"], [class*="alert"], .text-red-500, .text-red-600'
  );
  const errorCount = await errorMessages.count();
  console.log('Visible error messages found:', errorCount);

  for (let i = 0; i < errorCount; i++) {
    const text = await errorMessages.nth(i).textContent();
    const isVisible = await errorMessages.nth(i).isVisible();
    if (isVisible) {
      console.log(`Visible error message ${i}: "${text}"`);
    }
  }

  // Check for any text that might indicate an error
  const bodyText = await page.locator('body').textContent();
  if (bodyText?.includes('Error') || bodyText?.includes('error')) {
    console.log('Found "Error" in body text');
  }

  // Print all console messages
  console.log('All console messages:');
  consoleMessages.forEach((msg, index) => {
    console.log(`${index}: ${msg}`);
  });

  // Take a screenshot
  await page.screenshot({ path: 'debug-console-errors.png' });
});
