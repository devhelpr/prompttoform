import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Test Existing Form', () => {
  test('should test expression system with existing form', async ({ page }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button
    await page.click('button:has-text("Import JSON")');

    // Wait for the modal to appear and be visible
    await page.waitForSelector('dialog:visible', { timeout: 10000 });

    // Load the existing expression calculator demo form
    const testForm = readFileSync(
      'apps/prompttoform/public/expression-calculator-demo.json',
      'utf8'
    );
    await page.fill('textarea', testForm);

    // Wait for the Import button to become enabled
    await page.waitForSelector(
      'dialog button:has-text("Import Form"):not([disabled])',
      { timeout: 10000 }
    );

    // Click Import button
    await page.click('dialog button:has-text("Import Form")');

    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter base price"]');

    // Get the base price input
    const basePriceInput = page.locator(
      'input[placeholder="Enter base price"]'
    );

    // Check initial state
    console.log('=== INITIAL STATE ===');
    console.log('Base price value:', await basePriceInput.inputValue());

    // Enter a base price
    console.log('=== ENTERING BASE PRICE 100 ===');
    await basePriceInput.fill('100');
    await basePriceInput.blur();

    // Wait for calculations to complete
    await page.waitForTimeout(1000);

    // Check if there are any calculated fields visible
    const calculatedFields = page.locator('input[readonly]');
    const calculatedCount = await calculatedFields.count();
    console.log('Number of calculated fields found:', calculatedCount);

    // Check values of calculated fields
    for (let i = 0; i < calculatedCount; i++) {
      const field = calculatedFields.nth(i);
      const value = await field.inputValue();
      console.log(`Calculated field ${i + 1} value:`, value);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'existing-form-test.png' });

    // The test should pass if we can see calculated fields
    expect(calculatedCount).toBeGreaterThan(0);
  });
});
