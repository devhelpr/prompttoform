import { test, expect } from '@playwright/test';

test('Debug Generate Form', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Load a sample form
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(1000);

  // Look for a Generate button instead of Load JSON
  const generateButtons = page.locator('button:has-text("Generate")');
  const generateCount = await generateButtons.count();
  console.log('Generate buttons found:', generateCount);

  for (let i = 0; i < generateCount; i++) {
    const text = await generateButtons.nth(i).textContent();
    const isVisible = await generateButtons.nth(i).isVisible();
    console.log(`Generate button ${i}: "${text}" (visible: ${isVisible})`);
  }

  // Try clicking the first Generate button
  if (generateCount > 0) {
    const firstGenerateButton = generateButtons.first();
    if (await firstGenerateButton.isVisible()) {
      console.log('Clicking first Generate button...');
      await firstGenerateButton.click();
      await page.waitForTimeout(5000); // Wait longer for generation

      // Check if we now have view mode buttons
      const viewButtons = page.locator(
        'button:has-text("Form Preview"), button:has-text("Form Logic"), button:has-text("JSON")'
      );
      const viewButtonCount = await viewButtons.count();
      console.log('View mode buttons after Generate:', viewButtonCount);

      if (viewButtonCount > 0) {
        // Switch to JSON view
        await page.click('button:has-text("JSON")');
        await page.waitForTimeout(2000);

        // Check JSON content
        const jsonTextarea = page.locator(
          'textarea[placeholder*="JSON form definition"]'
        );
        const jsonContent = await jsonTextarea.inputValue();
        console.log('JSON content length after Generate:', jsonContent.length);

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
      }
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-generate-form.png' });
});
