import { test, expect } from '@playwright/test';

test('Debug available buttons', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log('Buttons found:', buttons.length);

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
  }

  // Look for sample form button specifically
  const sampleButton = page.locator('button:has-text("Load Sample Form")');
  const sampleButtonExists = (await sampleButton.count()) > 0;
  console.log('Load Sample Form button exists:', sampleButtonExists);

  if (sampleButtonExists) {
    const isVisible = await sampleButton.isVisible();
    console.log('Load Sample Form button visible:', isVisible);
  }

  // Look for other potential sample form buttons
  const allText = await page.locator('body').textContent();
  if (allText?.includes('Sample')) {
    console.log('Found "Sample" in page text');
  }
  if (allText?.includes('Example')) {
    console.log('Found "Example" in page text');
  }
});
