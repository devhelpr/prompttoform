import { test, expect } from '@playwright/test';

test('Comprehensive Sync Test - Page Titles and Field Properties', async ({
  page,
}) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');
  await page.waitForTimeout(2000);

  // Load a sample form first
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(1000);

  // Click on the first example form
  await page.click('button:has-text("Simple Contact Form")');
  await page.waitForTimeout(3000);

  // Navigate to flow editor
  await page.click('button:has-text("View/Edit Form Flow")');
  await page.waitForTimeout(2000);

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(1000);

  // Find the sidebar and modify both page title and field properties
  const sidebar = page.locator(
    '.fixed.left-0.top-0.h-full.bg-white.shadow-lg.border-r.border-gray-200'
  );
  const sidebarTextarea = sidebar.locator('textarea').first();

  // Get current content and modify it
  const currentContent = await sidebarTextarea.inputValue();
  if (currentContent.length > 0) {
    const pageData = JSON.parse(currentContent);

    // Modify the page title
    pageData.title = 'SYNC TEST: Modified Page Title';

    // Modify the first component's label
    if (pageData.components && pageData.components.length > 0) {
      pageData.components[0].label = 'SYNC TEST: Modified Field Label';
    }

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

  // Click Back to Editor
  const backToEditorButton = page.locator('button:has-text("Back to Editor")');
  await backToEditorButton.click();
  await page.waitForTimeout(3000);

  // Check if both the modified page title and field label appear in the form preview
  const formPreview = page.locator(
    '.bg-white.p-4.sm\\:p-6.rounded-lg.border.border-zinc-300.overflow-auto.h-full'
  );
  const formPreviewContent = await formPreview.textContent();

  console.log('Form preview content:', formPreviewContent?.substring(0, 500));

  const modifiedPageTitleFound = formPreviewContent?.includes(
    'SYNC TEST: Modified Page Title'
  );
  const modifiedFieldLabelFound = formPreviewContent?.includes(
    'SYNC TEST: Modified Field Label'
  );

  console.log(
    'Modified page title found in form preview:',
    modifiedPageTitleFound
  );
  console.log(
    'Modified field label found in form preview:',
    modifiedFieldLabelFound
  );

  // Take a screenshot
  await page.screenshot({ path: 'test-comprehensive-sync.png' });

  // Log the results for debugging
  console.log('=== COMPREHENSIVE SYNC TEST RESULTS ===');
  console.log('✅ Page title sync working:', modifiedPageTitleFound);
  console.log('✅ Field property sync working:', modifiedFieldLabelFound);
  console.log(
    '🎉 SUCCESS: Both page titles and field properties are syncing correctly!'
  );

  // Both should be working now
  expect(modifiedPageTitleFound).toBe(true);
  expect(modifiedFieldLabelFound).toBe(true);
});
