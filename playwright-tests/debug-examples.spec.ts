import { test, expect } from '@playwright/test';

test('Debug Examples button', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Click the Examples button
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(2000);

  // Check what appeared after clicking Examples
  const buttons = await page.locator('button').all();
  console.log('Buttons after clicking Examples:', buttons.length);

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    if (isVisible) {
      console.log(`Visible Button ${i}: "${text}"`);
    }
  }

  // Look for sample form buttons
  const sampleButtons = page.locator(
    'button:has-text("Sample"), button:has-text("Example")'
  );
  const sampleButtonCount = await sampleButtons.count();
  console.log('Sample/Example buttons found:', sampleButtonCount);

  for (let i = 0; i < sampleButtonCount; i++) {
    const text = await sampleButtons.nth(i).textContent();
    console.log(`Sample/Example button ${i}: "${text}"`);
  }

  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'debug-examples.png' });
});
