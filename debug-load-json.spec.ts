import { test, expect } from '@playwright/test';

test('Debug Load JSON button', async ({ page }) => {
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
  await page.waitForTimeout(2000);

  // Look for the "Load JSON" button
  const loadJsonButton = page.locator('button:has-text("Load JSON")');
  const loadJsonExists = (await loadJsonButton.count()) > 0;
  console.log('Load JSON button exists:', loadJsonExists);

  if (loadJsonExists) {
    const isVisible = await loadJsonButton.isVisible();
    console.log('Load JSON button visible:', isVisible);

    if (isVisible) {
      // Click the Load JSON button
      await loadJsonButton.click();
      await page.waitForTimeout(3000);

      // Check if the JSON editor now has content
      const jsonTextarea = page.locator(
        'textarea[placeholder*="JSON form definition"]'
      );
      const jsonContent = await jsonTextarea.inputValue();

      console.log('JSON content length after Load JSON:', jsonContent.length);

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
        console.log('JSON textarea is still empty after Load JSON');
      }
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-load-json.png' });
});
