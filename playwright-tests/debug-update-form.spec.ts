import { test, expect } from '@playwright/test';

test('Debug Update Form button', async ({ page }) => {
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

  // Try clicking "Update Form" button
  const updateFormButton = page.locator('button:has-text("Update Form")');
  const updateFormExists = (await updateFormButton.count()) > 0;
  console.log('Update Form button exists:', updateFormExists);

  if (updateFormExists && (await updateFormButton.isVisible())) {
    await updateFormButton.click();
    await page.waitForTimeout(3000);

    // Check if JSON editor now has content
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    const jsonContent = await jsonTextarea.inputValue();
    console.log('JSON content length after Update Form:', jsonContent.length);
  }

  // Try switching to Form Preview first, then JSON
  await page.click('button:has-text("Form Preview")');
  await page.waitForTimeout(2000);

  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(2000);

  // Check JSON content again
  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  const jsonContent = await jsonTextarea.inputValue();
  console.log(
    'JSON content length after Form Preview -> JSON:',
    jsonContent.length
  );

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
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-update-form.png' });
});
