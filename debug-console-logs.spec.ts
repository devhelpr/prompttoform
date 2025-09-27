import { test, expect } from '@playwright/test';

test('Debug Console Logs for Node Click', async ({ page }) => {
  // Set up console logging
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const message = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(message);
    console.log(message);
  });

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

  // Clear console messages before clicking
  consoleMessages.length = 0;

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  console.log('Clicking on first node...');
  await firstNode.click();
  await page.waitForTimeout(2000);

  // Check console messages for node click logs
  console.log('Console messages after node click:');
  consoleMessages.forEach((msg, index) => {
    console.log(`${index}: ${msg}`);
  });

  // Look for node click related messages
  const nodeClickMessages = consoleMessages.filter(
    (msg) =>
      msg.includes('Node clicked') ||
      msg.includes('selectedNode') ||
      msg.includes('Active page')
  );

  if (nodeClickMessages.length > 0) {
    console.log('✅ Node click messages found:');
    nodeClickMessages.forEach((msg) => console.log(`  - ${msg}`));
  } else {
    console.log('❌ No node click messages found');
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-console-logs.png' });
});
