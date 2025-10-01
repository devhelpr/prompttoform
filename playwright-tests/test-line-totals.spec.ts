import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Line Total Calculations', () => {
  test('should calculate line totals correctly when entering quantity and unit price', async ({
    page,
  }) => {
    // Read the form JSON file
    const formJson = readFileSync('improved-product-list.json', 'utf8');

    // Navigate to the form and set the JSON in localStorage
    await page.goto('http://localhost:4200');

    // Set the form JSON in localStorage to trigger the form loading
    await page.evaluate((json) => {
      localStorage.setItem('formJson', json);
    }, formJson);

    // Reload the page to trigger the form loading
    await page.reload();

    // Wait for the form to load
    await page.waitForSelector('input[type="text"], input[type="number"]', {
      timeout: 10000,
    });

    // Get all input fields
    const inputs = await page
      .locator('input[type="text"], input[type="number"]')
      .all();
    console.log('Found inputs after loading:', inputs.length);

    // Take a screenshot to see the form
    await page.screenshot({ path: 'form-loaded.png' });

    // Fill in product name (first text input)
    const productNameInput = page.locator('input[type="text"]').first();
    await productNameInput.fill('Test Product');

    // Fill in quantity (first number input)
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill('3');

    // Fill in unit price (second number input)
    const unitPriceInput = page.locator('input[type="number"]').nth(1);
    await unitPriceInput.fill('4');

    // Wait a moment for calculations
    await page.waitForTimeout(2000);

    // Look for line total field (should be a read-only input or display)
    const lineTotalInput = page.locator('input[type="number"]').nth(2);
    const lineTotalValue = await lineTotalInput.inputValue();
    console.log('Line total value:', lineTotalValue);

    // The line total should be 12
    expect(lineTotalValue).toBe('12');

    // Also check the subtotal (should be another number input)
    const subtotalInput = page.locator('input[type="number"]').nth(3);
    const subtotalValue = await subtotalInput.inputValue();
    console.log('Subtotal value:', subtotalValue);

    // The subtotal should also be 12
    expect(subtotalValue).toBe('12');
  });

  test('should update line totals when values change', async ({ page }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the form to load
    await page.waitForSelector('input[type="text"], input[type="number"]', {
      timeout: 10000,
    });

    // Fill in initial values
    const productNameInput = page.locator('input[type="text"]').first();
    await productNameInput.fill('Test Product');

    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill('2');

    const unitPriceInput = page.locator('input[type="number"]').nth(1);
    await unitPriceInput.fill('5');

    // Wait for calculation
    await page.waitForTimeout(2000);

    // Check initial line total (2 * 5 = 10)
    const lineTotalInput = page.locator('input[type="number"]').nth(2);
    let lineTotalValue = await lineTotalInput.inputValue();
    console.log('Initial line total:', lineTotalValue);
    expect(lineTotalValue).toBe('10');

    // Change quantity to 4
    await quantityInput.fill('4');

    // Wait for calculation
    await page.waitForTimeout(2000);

    // Check updated line total (4 * 5 = 20)
    lineTotalValue = await lineTotalInput.inputValue();
    console.log('Updated line total:', lineTotalValue);
    expect(lineTotalValue).toBe('20');
  });
});
