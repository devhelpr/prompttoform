import { test, expect } from '@playwright/test';

test('Debug Node Editor Buttons', async ({ page }) => {
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

  // Click the View Flow button in the header
  await page.click('button:has-text("View Flow")');
  await page.waitForTimeout(2000);

  // Verify the flow editor is working
  const flowEditor = page.locator('.react-flow');
  await expect(flowEditor).toBeVisible({ timeout: 5000 });

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(1000);

  // Get all buttons after clicking the node
  const buttons = await page.locator('button').all();
  console.log('Buttons found after clicking node:');

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    if (isVisible) {
      console.log(`Button ${i}: "${text}"`);
    }
  }

  // Look for any text that might indicate editing capabilities
  const bodyText = await page.locator('body').textContent();
  if (bodyText?.includes('Editor') || bodyText?.includes('Edit')) {
    console.log('Found "Editor" or "Edit" in body text');
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-node-editor.png' });
});
