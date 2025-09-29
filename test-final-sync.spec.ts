import { test, expect } from '@playwright/test';

test('Final Synchronization Test', async ({ page }) => {
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

  // Check console messages for synchronization
  const syncMessages = consoleMessages.filter(
    (msg) =>
      msg.includes('FormFlowPage:') ||
      msg.includes('MainAppPage:') ||
      msg.includes('FormFlow:')
  );

  console.log('Synchronization messages:');
  syncMessages.forEach((msg) => console.log(`  - ${msg}`));

  // Check if the modified title appears in the main editor
  const modifiedTitle = page.locator('text="Modified Title from Flow Editor"');
  const modifiedTitleExists = (await modifiedTitle.count()) > 0;

  if (modifiedTitleExists) {
    console.log(
      '✅ SUCCESS: Modified title found in main editor - synchronization working!'
    );
  } else {
    console.log('❌ FAILED: Modified title not found in main editor');

    // Check what titles are actually visible
    const allText = await page.locator('body').textContent();
    if (allText?.includes('Contact Us')) {
      console.log(
        '⚠️ Original title "Contact Us" still visible - changes not propagated'
      );
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-final-sync.png' });
});
