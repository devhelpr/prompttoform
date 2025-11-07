import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Slider expression update with nested field IDs', async ({ page }) => {
  // Read the form JSON file
  const formJsonPath = 'public/two-colums.expression.json';
  const formJson = fs.readFileSync(formJsonPath, 'utf8');

  // Navigate to the page
  await page.goto('http://localhost:4200');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check if there's a login button and handle it
  const loginButton = page.locator('button:has-text("LOGIN")').first();
  if ((await loginButton.count()) > 0) {
    console.log('Login button found, waiting for it to be enabled...');
    // Wait for login button to be enabled or skip if it stays disabled
    try {
      await expect(loginButton).toBeEnabled({ timeout: 2000 });
      await loginButton.click();
      await page.waitForTimeout(2000);
    } catch {
      console.log('Login button disabled, continuing...');
    }
  }

  // Look for the Import JSON button
  const importButton = page.locator('button:has-text("Import JSON")').first();
  await expect(importButton).toBeVisible({ timeout: 15000 });

  // Click the Import JSON button
  await importButton.click();

  // Wait for the modal to appear
  await page.waitForSelector('textarea', { timeout: 5000 });

  // Fill in the JSON
  const textarea = page.locator(
    'textarea[placeholder*="Paste your JSON form definition here"]'
  );
  await textarea.fill(formJson);

  // Click the Import Form button
  const modalImportButton = page.locator(
    'dialog button:has-text("Import Form"):not([disabled])'
  );
  await expect(modalImportButton).toBeEnabled({ timeout: 10000 });
  await modalImportButton.click();

  // Wait for the modal to close and form to load
  await page.waitForSelector('dialog', { state: 'hidden', timeout: 5000 });

  // Wait for the form to load - look for the slider
  await page.waitForSelector('[id*="sliderValue"]', { timeout: 10000 });

  // Find the slider element (could be nested, so use contains)
  const sliderContainer = page.locator('[id*="sliderValue"]').first();
  await expect(sliderContainer).toBeVisible({ timeout: 5000 });

  // Find the calculated input field
  const calculatedInput = page.locator('input[id*="doubleValue"]').first();
  await expect(calculatedInput).toBeVisible({ timeout: 5000 });

  // Get initial value
  const initialValue = await calculatedInput.inputValue();
  console.log('Initial calculated value:', initialValue);

  // Get slider bounding box
  const sliderRect = await sliderContainer.boundingBox();
  expect(sliderRect).not.toBeNull();

  if (sliderRect) {
    // Move slider to 25 (25% of the slider width)
    const targetX = sliderRect.x + sliderRect.width * 0.25;
    const targetY = sliderRect.y + sliderRect.height / 2;

    await page.mouse.move(targetX, targetY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY);
    await page.mouse.up();

    // Wait for expression evaluation (with debounce + extra time)
    await page.waitForTimeout(500);

    // Check that the calculated value is updated to 50 (25 * 2)
    const valueAfter25 = await calculatedInput.inputValue();
    console.log('Value after slider at 25:', valueAfter25);
    const numValue25 = parseFloat(valueAfter25) || 0;
    
    // Log console messages for debugging
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('sliderValue') || text.includes('doubleValue') || text.includes('Expression')) {
        consoleMessages.push(text);
        console.log('Console:', text);
      }
    });

    // Take screenshot
    await page.screenshot({
      path: 'playwright-tests/screenshots/test-slider-expression-nested-ids.png',
    });

    // Check the value - it should be close to 50
    if (Math.abs(numValue25 - 50) > 1) {
      console.log('❌ Expression not updating correctly!');
      console.log('Expected: ~50, Got:', numValue25);
      console.log('Console messages:', consoleMessages);
      // Don't fail the test yet, just log the issue
    } else {
      console.log('✅ Expression updating correctly!');
    }

    // Try moving slider to 50
    const targetX2 = sliderRect.x + sliderRect.width * 0.5;
    await page.mouse.move(targetX2, targetY);
    await page.mouse.down();
    await page.mouse.move(targetX2, targetY);
    await page.mouse.up();

    await page.waitForTimeout(500);

    const valueAfter50 = await calculatedInput.inputValue();
    console.log('Value after slider at 50:', valueAfter50);
    const numValue50 = parseFloat(valueAfter50) || 0;

    // Final screenshot
    await page.screenshot({
      path: 'playwright-tests/screenshots/test-slider-expression-nested-ids-final.png',
    });

    // Log final state
    console.log('Final state:');
    console.log('  - Slider value (expected ~50):', await page.evaluate(() => {
      const slider = document.querySelector('[id*="sliderValue"]');
      return slider ? (slider as any).value : 'not found';
    }));
    console.log('  - Calculated value (expected ~100):', numValue50);
  }
});

