import { test, expect } from '@playwright/test';

test('Debug JSON View', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Switch to JSON view
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(2000);

  // Get all visible buttons in JSON view
  const buttons = await page.locator('button').all();
  console.log('Buttons in JSON view:');

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    if (isVisible) {
      console.log(`Button ${i}: "${text}"`);
    }
  }

  // Check if there's a JSON textarea
  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  const textareaExists = (await jsonTextarea.count()) > 0;
  console.log('JSON textarea exists:', textareaExists);

  if (textareaExists) {
    const isVisible = await jsonTextarea.isVisible();
    console.log('JSON textarea visible:', isVisible);

    if (isVisible) {
      // Try to fill it with test content
      await jsonTextarea.fill('{"test": "data"}');
      await page.waitForTimeout(1000);

      // Check if the content was set
      const content = await jsonTextarea.inputValue();
      console.log('Textarea content after fill:', content);
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-json-view.png' });
});
