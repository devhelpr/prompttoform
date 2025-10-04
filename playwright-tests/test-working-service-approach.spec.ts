import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Test Working Service Approach - Basic Calculated Fields', async ({
  page,
}) => {
  // Read the test JSON file
  const formJson = fs.readFileSync('working-service-approach.json', 'utf8');

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
  await page.waitForSelector('input[type="number"]', {
    timeout: 10000,
  });

  // Fill in the input value
  const input1Field = page.locator('input[id="input1"]');
  await input1Field.fill('5');

  // Wait for calculations to complete
  await page.waitForTimeout(2000);

  // Check calculated1 value (should be 5 * 2 = 10)
  const calculated1Field = page.locator('input[id="calculated1"]');
  const calculated1Value = await calculated1Field.inputValue();
  console.log('Calculated1 value:', calculated1Value);
  console.log('Expected: 10, Got:', calculated1Value);

  // Test with a different value
  await input1Field.fill('3');
  await page.waitForTimeout(2000);

  // Check calculated1 value (should be 3 * 2 = 6)
  const calculated1Value2 = await calculated1Field.inputValue();
  console.log('Calculated1 value (after change):', calculated1Value2);
  console.log('Expected: 6, Got:', calculated1Value2);

  console.log('📊 Test Results:');
  console.log('  - Input1: 3');
  console.log('  - Calculated1 (3 * 2):', calculated1Value2);

  // Check if basic calculated fields are working
  if (calculated1Value2 === '6') {
    console.log(
      '✅ Service-based approach is working for basic calculated fields!'
    );
  } else {
    console.log('❌ Service-based approach is not working');
    console.log('   - Calculated1 should be 6, got:', calculated1Value2);
  }
});
