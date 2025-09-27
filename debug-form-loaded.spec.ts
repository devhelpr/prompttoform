import { test, expect } from '@playwright/test';

test('Debug form loaded state', async ({ page }) => {
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

  // Take a screenshot
  await page.screenshot({ path: 'debug-form-loaded.png' });

  // Check what view mode buttons are available
  const viewButtons = page.locator(
    'button:has-text("Form Preview"), button:has-text("Visual Flow"), button:has-text("JSON")'
  );
  const viewButtonCount = await viewButtons.count();
  console.log('View mode buttons found:', viewButtonCount);

  for (let i = 0; i < viewButtonCount; i++) {
    const text = await viewButtons.nth(i).textContent();
    const isVisible = await viewButtons.nth(i).isVisible();
    console.log(`View button ${i}: "${text}" (visible: ${isVisible})`);
  }

  // Look for sync status indicators
  const syncIndicators = page.locator(
    '[class*="bg-green"], [class*="bg-yellow"], [class*="bg-red"], [class*="sync"], [class*="status"]'
  );
  const syncCount = await syncIndicators.count();
  console.log('Sync indicators found:', syncCount);

  for (let i = 0; i < syncCount; i++) {
    const text = await syncIndicators.nth(i).textContent();
    const className = await syncIndicators.nth(i).getAttribute('class');
    console.log(`Sync indicator ${i}: "${text}" (class: ${className})`);
  }

  // Check if we're in the editor view
  const editorElements = page.locator(
    'textarea, .react-flow, [class*="editor"]'
  );
  const editorCount = await editorElements.count();
  console.log('Editor elements found:', editorCount);

  // Look for any status text
  const statusText = page.locator(
    'text="Synced", text="Syncing", text="Conflict", text="Error"'
  );
  const statusCount = await statusText.count();
  console.log('Status text elements found:', statusCount);

  for (let i = 0; i < statusCount; i++) {
    const text = await statusText.nth(i).textContent();
    console.log(`Status text ${i}: "${text}"`);
  }
});
