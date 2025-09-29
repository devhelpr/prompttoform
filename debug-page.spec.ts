import { test, expect } from '@playwright/test';

test('Debug page content', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait a bit for the page to load
  await page.waitForTimeout(5000);

  // Take a screenshot
  await page.screenshot({ path: 'debug-page.png' });

  // Get the page title
  const title = await page.title();
  console.log('Page title:', title);

  // Get all h1 elements
  const h1Elements = await page.locator('h1').all();
  console.log('H1 elements found:', h1Elements.length);

  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent();
    console.log(`H1 ${i}:`, text);
  }

  // Get all text content to see what's actually on the page
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));

  // Check for any loading indicators
  const loadingElements = await page
    .locator('[class*="loading"], [class*="spinner"], [data-testid*="loading"]')
    .all();
  console.log('Loading elements found:', loadingElements.length);

  // Wait longer and try again
  await page.waitForTimeout(10000);

  const h1ElementsAfterWait = await page.locator('h1').all();
  console.log('H1 elements after longer wait:', h1ElementsAfterWait.length);

  for (let i = 0; i < h1ElementsAfterWait.length; i++) {
    const text = await h1ElementsAfterWait[i].textContent();
    console.log(`H1 ${i} after wait:`, text);
  }
});
