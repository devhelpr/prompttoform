import { test, expect } from '@playwright/test';

test('Form Renderer Behavior Test', async ({ page }) => {
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

    // Check if this is a multi-language form
    const isMultiLanguage =
      initialForm.supportedLanguages &&
      initialForm.supportedLanguages.length > 1;
    console.log('Is multi-language form:', isMultiLanguage);
  }

  // Switch back to form preview
  await page.click('button:has-text("Form Preview")');
  await page.waitForTimeout(2000);

  // Check console messages for FormRenderer behavior
  const rendererMessages = consoleMessages.filter(
    (msg) =>
      msg.includes('MemoizedFormRenderer:') || msg.includes('FormPreviewPanel:')
  );

  console.log('=== FORM RENDERER ANALYSIS ===');
  console.log('Total console messages:', consoleMessages.length);
  console.log('Renderer-related messages:', rendererMessages.length);

  rendererMessages.forEach((msg, index) => {
    console.log(`${index + 1}: ${msg}`);
  });

  // Check if the form preview is working
  const formPreview = page.locator(
    '.bg-white.p-4.sm\\:p-6.rounded-lg.border.border-zinc-300.overflow-auto.h-full'
  );
  const formPreviewContent = await formPreview.textContent();
  console.log('Form preview content:', formPreviewContent?.substring(0, 200));

  // Take a screenshot
  await page.screenshot({ path: 'test-form-renderer-behavior.png' });

  // The test should pass if we can analyze the form
  expect(initialJson.length).toBeGreaterThan(0);
});
