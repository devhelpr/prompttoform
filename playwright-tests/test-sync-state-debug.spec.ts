import { test, expect } from '@playwright/test';

test('Sync State Debug Test', async ({ page }) => {
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

  // Load a sample form first
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(1000);

  // Click on the first example form
  await page.click('button:has-text("Simple Contact Form")');
  await page.waitForTimeout(3000);

  // Switch to JSON view to check initial state
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(1000);

  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  await page.waitForTimeout(2000);

  const initialJson = await jsonTextarea.inputValue();
  const initialForm = JSON.parse(initialJson);
  console.log('=== INITIAL STATE ===');
  console.log('Initial form title:', initialForm.app?.title);
  console.log('Initial page title:', initialForm.app?.pages?.[0]?.title);

  // Navigate to flow editor
  await page.click('button:has-text("View/Edit Form Flow")');
  await page.waitForTimeout(2000);

  // Verify the flow editor is working
  const flowEditor = page.locator('.react-flow');
  await expect(flowEditor).toBeVisible({ timeout: 5000 });

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
    pageData.title = 'DEBUG: Modified Contact Page Title';
    const modifiedContent = JSON.stringify(pageData, null, 2);
    await sidebarTextarea.fill(modifiedContent);

    // Click save button
    const saveButton = sidebar
      .locator('button:has-text("Save"), button[type="submit"]')
      .first();
    await saveButton.click();
    await page.waitForTimeout(2000);
  }

  // Close the sidebar
  const hideEditorButton = page.locator('button:has-text("Hide Editor")');
  if (await hideEditorButton.isVisible()) {
    await hideEditorButton.click();
    await page.waitForTimeout(1000);
  }

  // Clear console messages before navigation
  consoleMessages.length = 0;

  // Click Back to Editor
  const backToEditorButton = page.locator('button:has-text("Back to Editor")');
  await backToEditorButton.click();
  await page.waitForTimeout(3000);

  // Switch back to JSON view to check final state
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(1000);

  const finalJson = await jsonTextarea.inputValue();
  const finalForm = JSON.parse(finalJson);

  console.log('=== FINAL STATE ===');
  console.log('Final form title:', finalForm.app?.title);
  console.log('Final page title:', finalForm.app?.pages?.[0]?.title);

  // Check if the title was actually updated
  const titleUpdated =
    finalForm.app?.pages?.[0]?.title === 'DEBUG: Modified Contact Page Title';
  console.log('Title was updated:', titleUpdated);

  // Check console messages for synchronization
  const syncMessages = consoleMessages.filter(
    (msg) =>
      msg.includes('FormFlowPage:') ||
      msg.includes('MainAppPage:') ||
      msg.includes('FormFlow:') ||
      msg.includes('Processing updated form definition')
  );

  console.log('Synchronization messages:');
  syncMessages.forEach((msg) => console.log(`  - ${msg}`));

  // Take a screenshot
  await page.screenshot({ path: 'test-sync-state-debug.png' });

  // The test should pass if the title was updated
  expect(titleUpdated).toBe(true);
});
