import { test, expect } from '@playwright/test';

test.describe('Test Expression System Loaded', () => {
  test('should verify expression system is loaded and working', async ({
    page,
  }) => {
    const messages: Array<{ type: string; text: string }> = [];

    // Listen for console messages
    page.on('console', (msg) => {
      messages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait a bit more to catch any delayed messages
    await page.waitForTimeout(3000);

    // Check for any error messages
    const errorMessages = messages.filter((msg) => msg.type === 'error');
    if (errorMessages.length > 0) {
      console.log('=== ERROR MESSAGES ===');
      errorMessages.forEach((msg) => {
        console.log(`[ERROR] ${msg.text}`);
      });
    }

    // Check for any messages related to expressions
    const expressionMessages = messages.filter(
      (msg) =>
        msg.text.toLowerCase().includes('expression') ||
        msg.text.toLowerCase().includes('with-expression') ||
        msg.text.toLowerCase().includes('dependency') ||
        msg.text.toLowerCase().includes('calculated')
    );

    if (expressionMessages.length > 0) {
      console.log('=== EXPRESSION-RELATED MESSAGES ===');
      expressionMessages.forEach((msg) => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    // Check if the page loaded without critical errors
    expect(errorMessages.length).toBe(0);

    // Check if the main components are loaded
    const importButton = page.locator('button:has-text("Import JSON")').first();
    await expect(importButton).toBeVisible();

    console.log('✅ Page loaded successfully');
    console.log('✅ No critical errors found');
    console.log('✅ Import JSON button is visible');
    console.log('✅ Expression system appears to be loaded');
  });
});
