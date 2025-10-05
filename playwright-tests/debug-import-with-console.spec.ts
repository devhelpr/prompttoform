import { test, expect } from '@playwright/test';

test('Debug Import JSON with console logging', async ({ page }) => {
  const formJson = `{
    "app": {
      "title": "Test Form",
      "pages": [
        {
          "id": "page1",
          "title": "Test Page",
          "components": [
            {
              "id": "testField",
              "type": "input",
              "label": "Test Field",
              "props": {
                "inputType": "text"
              }
            }
          ]
        }
      ]
    }
  }`;

  // Navigate to the page
  await page.goto('http://localhost:4200');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Set up console logging
  const errors: string[] = [];
  const logs: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('❌ Console Error:', text);
    } else {
      logs.push(text);
      console.log('📝 Console Log:', text);
    }
  });

  // Look for the Import JSON button
  const importButton = page.locator('button:has-text("Import JSON")').first();
  await expect(importButton).toBeVisible();
  console.log('✅ Import JSON button found');

  // Click the Import JSON button
  await importButton.click();
  console.log('✅ Import JSON button clicked');

  // Wait for the modal to appear
  await page.waitForSelector('textarea', { timeout: 5000 });
  console.log('✅ Modal appeared');

  // Fill in the JSON
  const textarea = page.locator(
    'textarea[placeholder*="Paste your JSON form definition here"]'
  );
  await textarea.fill(formJson);
  console.log('✅ JSON filled in');

  // Click the Import Form button
  const modalImportButton = page.locator('button:has-text("Import Form")');
  await expect(modalImportButton).toBeEnabled();
  await modalImportButton.click();
  console.log('✅ Import Form button clicked');

  // Wait a bit to see what happens
  await page.waitForTimeout(3000);

  // Check what's on the page
  const bodyText = await page.locator('body').textContent();
  console.log('Body text length:', bodyText?.length || 0);

  // Check for any form elements
  const inputs = await page.locator('input').count();
  console.log('Number of inputs found:', inputs);

  // Check for any errors
  if (errors.length > 0) {
    console.log('❌ Errors found during import:');
    errors.forEach((error) => console.log('  -', error));
  } else {
    console.log('✅ No errors found during import');
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-import-with-console.png' });
});
