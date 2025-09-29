import { test, expect } from '@playwright/test';

test('Debug Synchronization Logs', async ({ page }) => {
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

  // Clear console messages before testing
  consoleMessages.length = 0;

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(1000);

  // Find the sidebar and modify the JSON
  const sidebar = page.locator(
    '.fixed.left-0.top-0.h-full.bg-white.shadow-lg.border-r.border-gray-200'
  );
  const sidebarTextarea = sidebar.locator('textarea').first();

  // Get current content and modify it
  const currentContent = await sidebarTextarea.inputValue();
  if (currentContent.length > 0) {
    const pageData = JSON.parse(currentContent);
    pageData.title = 'Modified Title from Flow Editor';
    const modifiedContent = JSON.stringify(pageData, null, 2);
    await sidebarTextarea.fill(modifiedContent);

    // Click save button
    const saveButton = sidebar
      .locator('button:has-text("Save"), button[type="submit"]')
      .first();
    await saveButton.click();
    await page.waitForTimeout(2000);

    console.log('Console messages after save:');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index}: ${msg}`);
    });

    // Look for FormFlowPage messages
    const formFlowPageMessages = consoleMessages.filter((msg) =>
      msg.includes('FormFlowPage:')
    );

    if (formFlowPageMessages.length > 0) {
      console.log('✅ FormFlowPage messages found:');
      formFlowPageMessages.forEach((msg) => console.log(`  - ${msg}`));
    } else {
      console.log('❌ No FormFlowPage messages found');
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-sync-logs.png' });
});
