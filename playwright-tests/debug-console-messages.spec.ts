import { test, expect } from '@playwright/test';

test.describe('Debug Console Messages', () => {
  test('should capture all console messages', async ({ page }) => {
    const messages: Array<{ type: string; text: string }> = [];

    // Listen for all console messages
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

    // Log all messages
    console.log('=== ALL CONSOLE MESSAGES ===');
    messages.forEach((msg) => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });

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

    // Take a screenshot
    await page.screenshot({ path: 'console-messages-debug.png' });

    // The test should pass
    expect(messages.length).toBeGreaterThan(0);
  });
});
