import { test, expect } from '@playwright/test';

test('Debug Import JSON workflow', async ({ page }) => {
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

  // Look for the Import JSON button
  const importButton = page.locator('button:has-text("Import JSON")').first();
  await expect(importButton).toBeVisible();

  // Click the Import JSON button
  await importButton.click();

  // Wait for the modal to appear
  await page.waitForSelector('textarea', { timeout: 5000 });

  // Fill in the JSON
  const textarea = page.locator(
    'textarea[placeholder*="Paste your JSON form definition here"]'
  );
  await textarea.fill(formJson);

  // Click the Import Form button
  const modalImportButton = page.locator('button:has-text("Import Form")');
  await expect(modalImportButton).toBeEnabled();
  await modalImportButton.click();

  // Wait for the form to load
  await page.waitForSelector('input[type="text"]', { timeout: 10000 });

  // Check if the form field is visible
  const testField = page.locator('input[id="testField"]');
  await expect(testField).toBeVisible();

  console.log('✅ Import JSON workflow is working correctly!');
});
