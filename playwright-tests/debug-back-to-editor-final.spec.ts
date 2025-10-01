import { test, expect } from '@playwright/test';

test('Debug Back to Editor Final', async ({ page }) => {
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

  // Click the View/Edit Form Flow button in the header
  await page.click('button:has-text("View/Edit Form Flow")');
  await page.waitForTimeout(2000);

  // Verify the flow editor is working
  const flowEditor = page.locator('.react-flow');
  await expect(flowEditor).toBeVisible({ timeout: 5000 });

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(1000);

  // Close the sidebar if it's open
  const hideEditorButton = page.locator('button:has-text("Hide Editor")');
  if (await hideEditorButton.isVisible()) {
    await hideEditorButton.click();
    await page.waitForTimeout(1000);
  }

  // Click Back to Editor
  const backToEditorButton = page.locator('button:has-text("Back to Editor")');
  await backToEditorButton.click();
  await page.waitForTimeout(3000);

  // Take a screenshot
  await page.screenshot({ path: 'debug-back-to-editor-final.png' });

  // Check what's on the page now
  const bodyText = await page.locator('body').textContent();
  console.log(
    'Body text after Back to Editor (first 500 chars):',
    bodyText?.substring(0, 500)
  );

  // Check for different possible states
  const mainEditorTitle = page.locator('h1:has-text("Generate Forms with AI")');
  const mainEditorExists = (await mainEditorTitle.count()) > 0;
  console.log('Main editor title exists:', mainEditorExists);

  const formPreviewTitle = page.locator('h3:has-text("Generated UI/Form")');
  const formPreviewExists = (await formPreviewTitle.count()) > 0;
  console.log('Form preview title exists:', formPreviewExists);

  const flowEditorStillExists = (await flowEditor.count()) > 0;
  console.log('Flow editor still exists:', flowEditorStillExists);

  // Check the current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check for any error messages
  const errorMessages = page.locator('[class*="error"], [class*="Error"]');
  const errorCount = await errorMessages.count();
  console.log('Error messages found:', errorCount);

  for (let i = 0; i < errorCount; i++) {
    const text = await errorMessages.nth(i).textContent();
    console.log(`Error ${i}: ${text}`);
  }
});
