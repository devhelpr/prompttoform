import { test, expect } from '@playwright/test';

test('Debug Form Generation Process', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Load a sample form
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(1000);

  // Click the first Generate button
  const generateButtons = page.locator('button:has-text("Generate")');
  await generateButtons.first().click();

  // Wait for generation to complete - look for loading indicators
  console.log('Waiting for form generation...');

  // Wait for any loading indicators to disappear
  await page.waitForTimeout(10000);

  // Check for error messages
  const errorMessages = page.locator(
    '[class*="error"], [class*="alert"], .text-red-500, .text-red-600'
  );
  const errorCount = await errorMessages.count();
  console.log('Error messages found:', errorCount);

  for (let i = 0; i < errorCount; i++) {
    const text = await errorMessages.nth(i).textContent();
    const isVisible = await errorMessages.nth(i).isVisible();
    if (isVisible) {
      console.log(`Error message ${i}: "${text}"`);
    }
  }

  // Check if we have view mode buttons
  const viewButtons = page.locator(
    'button:has-text("Form Preview"), button:has-text("Form Logic"), button:has-text("JSON")'
  );
  const viewButtonCount = await viewButtons.count();
  console.log('View mode buttons found:', viewButtonCount);

  if (viewButtonCount > 0) {
    // Try switching to Form Preview first
    await page.click('button:has-text("Form Preview")');
    await page.waitForTimeout(2000);

    // Check if there's a form rendered
    const formElements = page.locator(
      'form, input, textarea, select, button[type="submit"]'
    );
    const formElementCount = await formElements.count();
    console.log('Form elements found in preview:', formElementCount);

    // Now switch to JSON
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(2000);

    // Check JSON content
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    const jsonContent = await jsonTextarea.inputValue();
    console.log('JSON content length:', jsonContent.length);

    if (jsonContent.length > 0) {
      console.log(
        'JSON content (first 200 chars):',
        jsonContent.substring(0, 200)
      );

      try {
        const formData = JSON.parse(jsonContent);
        console.log(
          'JSON is valid, form has',
          formData.app?.pages?.length || 0,
          'pages'
        );
      } catch (e) {
        console.log('JSON is invalid:', e.message);
      }
    } else {
      console.log('JSON textarea is still empty');

      // Check if there are other textareas with content
      const allTextareas = page.locator('textarea');
      const textareaCount = await allTextareas.count();
      console.log('All textareas:');

      for (let i = 0; i < textareaCount; i++) {
        const placeholder = await allTextareas
          .nth(i)
          .getAttribute('placeholder');
        const content = await allTextareas.nth(i).inputValue();
        if (content.length > 0) {
          console.log(
            `Textarea ${i}: placeholder="${placeholder}", content length=${content.length}`
          );
        }
      }
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-form-generation.png' });
});
