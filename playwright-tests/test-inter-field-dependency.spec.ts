import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Test Inter-Field Dependencies for Calculated Fields', async ({
  page,
}) => {
  // Read the test JSON file
  const formJson = fs.readFileSync('inter-field-dependency-test.json', 'utf8');

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

  // Fill in the base value
  const baseValueInput = page.locator('input[id="baseValue"]');
  await baseValueInput.fill('5');

  // Wait for calculations to complete
  await page.waitForTimeout(1000);

  // Check multiplied value (should be 5 * 2 = 10)
  const multipliedInput = page.locator('input[id="multiplied"]');
  const multipliedValue = await multipliedInput.inputValue();
  console.log('Multiplied value:', multipliedValue);
  console.log('Expected: 10, Got:', multipliedValue);

  // Check final result (should be 10 + 10 = 20)
  const finalResultInput = page.locator('input[id="finalResult"]');
  const finalResultValue = await finalResultInput.inputValue();
  console.log('Final result value:', finalResultValue);
  console.log('Expected: 20, Got:', finalResultValue);

  // Test with a different value
  await baseValueInput.fill('3');
  await page.waitForTimeout(1000);

  // Check multiplied value (should be 3 * 2 = 6)
  const multipliedValue2 = await multipliedInput.inputValue();
  console.log('Multiplied value (after change):', multipliedValue2);
  expect(multipliedValue2).toBe('6');

  // Check final result (should be 6 + 10 = 16)
  const finalResultValue2 = await finalResultInput.inputValue();
  console.log('Final result value (after change):', finalResultValue2);
  expect(finalResultValue2).toBe('16');

  console.log('✅ Inter-field dependencies are working correctly!');
  console.log('📊 Test Results:');
  console.log('  - Base Value: 3');
  console.log('  - Multiplied (3 * 2):', multipliedValue2);
  console.log('  - Final Result (6 + 10):', finalResultValue2);
});
