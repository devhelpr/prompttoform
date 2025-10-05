import { test, expect } from '@playwright/test';

test.describe('Check Console Errors', () => {
  test('should check for console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(3000);

    // Log any errors or warnings
    if (errors.length > 0) {
      console.log('Console errors found:');
      errors.forEach((error) => console.log('  -', error));
    }

    if (warnings.length > 0) {
      console.log('Console warnings found:');
      warnings.forEach((warning) => console.log('  -', warning));
    }

    // Take a screenshot
    await page.screenshot({ path: 'console-errors-check.png' });

    // The test should pass if there are no critical errors
    // (We'll allow warnings for now)
    expect(errors.length).toBe(0);
  });
});
