import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Line Total Calculations Debug', () => {
  test('should debug line total calculation issue', async ({ page }) => {
    // Load the form JSON
    const formJson = JSON.parse(
      readFileSync('./improved-product-list.json', 'utf8')
    );

    // Set the form JSON in localStorage and reload
    await page.goto('http://localhost:4200');
    await page.evaluate((json) => {
      localStorage.setItem('formJson', JSON.stringify(json));
    }, formJson);
    await page.reload();

    // Wait for the form to load
    await page.waitForSelector('input[type="text"], input[type="number"]', {
      timeout: 10000,
    });

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/initial-state.png' });

    // Find the quantity input field
    const quantityInput = page.locator('input[type="number"]').first();
    await expect(quantityInput).toBeVisible();

    // Find the unit price input field
    const unitPriceInput = page.locator('input[type="number"]').nth(1);
    await expect(unitPriceInput).toBeVisible();

    // Find the line total input field
    const lineTotalInput = page.locator('input[type="number"]').nth(2);
    await expect(lineTotalInput).toBeVisible();

    // Enter quantity: 3
    await quantityInput.fill('3');
    await page.waitForTimeout(500);

    // Take a screenshot after entering quantity
    await page.screenshot({ path: 'test-results/after-quantity.png' });

    // Enter unit price: 4
    await unitPriceInput.fill('4');
    await page.waitForTimeout(500);

    // Take a screenshot after entering unit price
    await page.screenshot({ path: 'test-results/after-unit-price.png' });

    // Check the line total value
    const lineTotalValue = await lineTotalInput.inputValue();
    console.log('Line total value:', lineTotalValue);

    // Check if the line total is calculated correctly
    if (lineTotalValue === '12') {
      console.log('✅ Line total calculation is working correctly!');
    } else {
      console.log(
        '❌ Line total calculation is NOT working. Expected: 12, Got:',
        lineTotalValue
      );

      // Get console logs to debug
      const logs = await page.evaluate(() => {
        return window.console.logs || [];
      });
      console.log('Console logs:', logs);
    }

    // Wait a bit more to see if delayed evaluation kicks in
    await page.waitForTimeout(1000);

    // Check the line total value again
    const lineTotalValueAfterDelay = await lineTotalInput.inputValue();
    console.log('Line total value after delay:', lineTotalValueAfterDelay);

    // Take a final screenshot
    await page.screenshot({ path: 'test-results/final-state.png' });
  });
});
