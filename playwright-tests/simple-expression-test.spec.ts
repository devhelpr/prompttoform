import { test, expect } from '@playwright/test';

test.describe('Simple Expression Test', () => {
  test('should test basic page functionality', async ({ page }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the page loaded correctly
    const title = await page.title();
    expect(title).toBe('Prompttoform');

    // Check if Import JSON button is visible (use first one)
    const importButton = page.locator('button:has-text("Import JSON")').first();
    await expect(importButton).toBeVisible();

    // Check if the main content is visible
    const mainHeading = page.locator('h1:has-text("Generate Forms with AI")');
    await expect(mainHeading).toBeVisible();

    console.log('✅ Page loaded successfully');
    console.log('✅ Import JSON button is visible');
    console.log('✅ Main heading is visible');
  });

  test('should open Import JSON dialog', async ({ page }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button (use first one)
    await page.locator('button:has-text("Import JSON")').first().click();

    // Wait for the dialog to appear
    await page.waitForSelector('dialog:visible', { timeout: 5000 });

    // Check if dialog is visible
    const dialog = page.locator('dialog:visible');
    await expect(dialog).toBeVisible();

    // Check if dialog has the expected content
    const dialogTitle = page.locator('dialog h2:has-text("Import JSON Form")');
    await expect(dialogTitle).toBeVisible();

    console.log('✅ Import JSON dialog opened successfully');
  });
});
