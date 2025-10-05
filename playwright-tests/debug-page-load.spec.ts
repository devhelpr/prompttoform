import { test, expect } from '@playwright/test';

test('Debug page load', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:4200');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check for any console errors
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait a bit to catch any errors
  await page.waitForTimeout(2000);

  // Log any errors
  if (errors.length > 0) {
    console.log('Console errors found:');
    errors.forEach((error) => console.log(error));
  } else {
    console.log('No console errors found');
  }

  // Check if the page title is correct
  const title = await page.title();
  console.log('Page title:', title);

  // Check if there are any visible elements
  const body = await page.locator('body');
  const bodyText = await body.textContent();
  console.log('Body text length:', bodyText?.length || 0);

  // Take a screenshot
  await page.screenshot({ path: 'debug-page-load.png' });
});
