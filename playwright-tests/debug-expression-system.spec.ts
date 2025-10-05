import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Debug Expression System', () => {
  test('should debug expression system step by step', async ({ page }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button
    await page.click('button:has-text("Import JSON")');

    // Wait for the modal to appear and be visible
    await page.waitForSelector('dialog:visible', { timeout: 10000 });

    // Load the debug test form
    const testForm = readFileSync('debug-expression-test.json', 'utf8');
    await page.fill('textarea', testForm);

    // Wait for the Import button to become enabled
    await page.waitForSelector(
      'dialog button:has-text("Import Form"):not([disabled])',
      { timeout: 10000 }
    );

    // Click Import button
    await page.click('dialog button:has-text("Import Form")');

    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter a number"]');

    // Get the input and calculated fields
    const input1 = page.locator('input[placeholder="Enter a number"]');
    const calculated1 = page.locator('input[readonly]');

    // Check initial state
    console.log('=== INITIAL STATE ===');
    console.log('Input1 value:', await input1.inputValue());
    console.log('Calculated1 value:', await calculated1.inputValue());

    // Enter value in input1
    console.log('=== ENTERING VALUE 3 ===');
    await input1.fill('3');
    await input1.blur();

    // Wait a bit
    await page.waitForTimeout(1000);

    // Check values after input
    console.log('=== AFTER INPUT ===');
    console.log('Input1 value:', await input1.inputValue());
    console.log('Calculated1 value:', await calculated1.inputValue());

    // Check if calculated field is visible and has the right value
    const calculated1Value = await calculated1.inputValue();
    console.log('Calculated1 final value:', calculated1Value);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-expression-test.png' });

    // The test should pass if calculated1 shows "6"
    expect(calculated1Value).toBe('6');
  });
});
