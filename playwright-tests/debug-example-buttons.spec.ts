import { test, expect } from '@playwright/test';

test('Debug example form buttons', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Load a sample form
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(1000);

  // Click on the first example form
  await page.click('button:has-text("Simple Contact Form")');
  await page.waitForTimeout(3000);

  // Get all visible buttons
  const buttons = await page.locator('button').all();
  console.log('All buttons after clicking example:');

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    if (isVisible) {
      console.log(`Button ${i}: "${text}"`);
    }
  }

  // Check if the form is already loaded by looking at the view mode buttons
  const viewButtons = page.locator(
    'button:has-text("Form Preview"), button:has-text("Form Logic"), button:has-text("JSON")'
  );
  const viewButtonCount = await viewButtons.count();
  console.log('View mode buttons found:', viewButtonCount);

  // Check if we can switch to JSON view
  if (viewButtonCount > 0) {
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(2000);

    // Check JSON content
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    const jsonContent = await jsonTextarea.inputValue();
    console.log(
      'JSON content length after switching to JSON view:',
      jsonContent.length
    );

    if (jsonContent.length > 0) {
      console.log(
        'JSON content (first 200 chars):',
        jsonContent.substring(0, 200)
      );
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-example-buttons.png' });
});
