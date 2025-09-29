import { test, expect } from '@playwright/test';

test('Debug JSON editor content', async ({ page }) => {
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

  // Switch to JSON view
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(2000);

  // Check what's in the JSON textarea
  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  const jsonContent = await jsonTextarea.inputValue();

  console.log('JSON content length:', jsonContent.length);
  console.log('JSON content (first 200 chars):', jsonContent.substring(0, 200));

  if (jsonContent.length === 0) {
    console.log('JSON textarea is empty - form may not be loaded yet');

    // Check if there are other textareas
    const allTextareas = page.locator('textarea');
    const textareaCount = await allTextareas.count();
    console.log('Total textareas found:', textareaCount);

    for (let i = 0; i < textareaCount; i++) {
      const placeholder = await allTextareas.nth(i).getAttribute('placeholder');
      const content = await allTextareas.nth(i).inputValue();
      console.log(
        `Textarea ${i}: placeholder="${placeholder}", content length=${content.length}`
      );
    }
  } else {
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
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-json-editor.png' });
});
