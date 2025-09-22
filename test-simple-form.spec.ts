import { test, expect } from '@playwright/test';

test.describe('Simple Form Line Total Test', () => {
  test('should calculate line totals correctly', async ({ page }) => {
    // Navigate to the simple test form
    await page.goto('file://' + process.cwd() + '/test-form-component.html');

    // Wait for the form to load
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });

    // Fill in product name
    await page.fill('input[type="text"]', 'Test Product');

    // Fill in quantity
    await page.fill('input[type="number"]', '3');

    // Fill in unit price
    const unitPriceInput = page.locator('input[type="number"]').nth(1);
    await unitPriceInput.fill('4');

    // Wait a moment for calculations
    await page.waitForTimeout(1000);

    // Check that line total is calculated correctly (3 * 4 = 12)
    const lineTotalInput = page.locator('input[type="number"]').nth(2);
    const lineTotalValue = await lineTotalInput.inputValue();
    console.log('Line total value:', lineTotalValue);

    // The line total should be 12
    expect(lineTotalValue).toBe('12');

    // Also check the debug info
    const debugInfo = await page.textContent('div[style*="marginTop"]');
    console.log('Debug info:', debugInfo);

    // Verify the debug info shows the correct calculation
    expect(debugInfo).toContain('Line Total: 12');
    expect(debugInfo).toContain('Expected: 3 × 4 = 12');
  });

  test('should update line totals when values change', async ({ page }) => {
    // Navigate to the simple test form
    await page.goto('file://' + process.cwd() + '/test-form-component.html');

    // Wait for the form to load
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });

    // Fill in initial values
    await page.fill('input[type="text"]', 'Test Product');
    await page.fill('input[type="number"]', '2');

    const unitPriceInput = page.locator('input[type="number"]').nth(1);
    await unitPriceInput.fill('5');

    // Wait for calculation
    await page.waitForTimeout(1000);

    // Check initial line total (2 * 5 = 10)
    const lineTotalInput = page.locator('input[type="number"]').nth(2);
    let lineTotalValue = await lineTotalInput.inputValue();
    expect(lineTotalValue).toBe('10');

    // Change quantity to 4
    await page.fill('input[type="number"]', '4');

    // Wait for calculation
    await page.waitForTimeout(1000);

    // Check updated line total (4 * 5 = 20)
    lineTotalValue = await lineTotalInput.inputValue();
    expect(lineTotalValue).toBe('20');
  });
});
