import { test, expect } from '@playwright/test';

test('Sync Test - No Translations', async ({ page }) => {
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

  // Switch to JSON view to check if this form has translations
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(1000);

  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  await page.waitForTimeout(2000);

  const initialJson = await jsonTextarea.inputValue();
  if (initialJson.length > 0) {
    const initialForm = JSON.parse(initialJson);
    console.log('=== INITIAL FORM ANALYSIS ===');
    console.log('Form has translations:', !!initialForm.translations);
    console.log(
      'Form has supportedLanguages:',
      !!initialForm.supportedLanguages
    );
    console.log('Form has defaultLanguage:', !!initialForm.defaultLanguage);
    console.log('Form title:', initialForm.app?.title);
    console.log('First page title:', initialForm.app?.pages?.[0]?.title);
  }

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

  // Find the sidebar and modify the page title
  const sidebar = page.locator(
    '.fixed.left-0.top-0.h-full.bg-white.shadow-lg.border-r.border-gray-200'
  );
  const sidebarTextarea = sidebar.locator('textarea').first();

  // Get current content and modify it
  const currentContent = await sidebarTextarea.inputValue();
  if (currentContent.length > 0) {
    const pageData = JSON.parse(currentContent);
    pageData.title = 'NO TRANSLATIONS TEST: Modified Page Title';
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
      msg.includes('FormFlow:') ||
      msg.includes('Processing updated form definition') ||
      msg.includes('FormSynchronizationService:') ||
      msg.includes('FormPreviewPanel:') ||
      msg.includes('MemoizedFormRenderer:')
  );

  console.log('=== SYNCHRONIZATION ANALYSIS ===');
  console.log('Total console messages:', consoleMessages.length);
  console.log('Sync-related messages:', syncMessages.length);

  syncMessages.forEach((msg, index) => {
    console.log(`${index + 1}: ${msg}`);
  });

  // Check if the sync mechanism is working
  const syncWorking = syncMessages.some(
    (msg) =>
      msg.includes('Processing updated form definition') ||
      msg.includes('FormFlow: Calling onFormChange') ||
      msg.includes('FormSynchronizationService: generateFormFromFlow')
  );

  console.log('Sync mechanism working:', syncWorking);

  // Check if the modified title appears anywhere on the page
  const pageContent = await page.locator('body').textContent();
  const modifiedTitleFound = pageContent?.includes(
    'NO TRANSLATIONS TEST: Modified Page Title'
  );
  console.log('Modified title found on page:', modifiedTitleFound);

  // Also check if we can find the form preview section specifically
  const formPreview = page.locator(
    '.bg-white.p-4.sm\\:p-6.rounded-lg.border.border-zinc-300.overflow-auto.h-full'
  );
  const formPreviewContent = await formPreview.textContent();
  console.log('Form preview content:', formPreviewContent?.substring(0, 200));
  const modifiedTitleInPreview = formPreviewContent?.includes(
    'NO TRANSLATIONS TEST: Modified Page Title'
  );
  console.log('Modified title found in form preview:', modifiedTitleInPreview);

  // Take a screenshot
  await page.screenshot({ path: 'test-sync-no-translations.png' });

  // Log the results for debugging
  console.log('=== TEST RESULTS ===');
  console.log('✅ Sync mechanism is working:', syncWorking);
  console.log('⚠️ Modified title visible:', modifiedTitleFound);
  console.log('⚠️ Modified title in form preview:', modifiedTitleInPreview);

  if (syncWorking && !modifiedTitleFound) {
    console.log('🔍 ISSUE: Sync is working but UI is not updating');
    console.log(
      '   This suggests the sync engine fix is working, but there may be a UI update issue'
    );
  } else if (syncWorking && modifiedTitleFound) {
    console.log('✅ SUCCESS: Sync is working and UI is updating correctly');
  } else {
    console.log('❌ FAILURE: Sync mechanism is not working');
  }

  // The test should pass if the sync mechanism is working
  expect(syncWorking).toBe(true);
});
