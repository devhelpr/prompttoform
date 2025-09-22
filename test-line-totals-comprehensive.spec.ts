import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Line Total Calculations - Comprehensive Test', () => {
  test('should calculate line totals correctly using Import JSON', async ({
    page,
  }) => {
    // Capture console logs
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    // Load the form JSON
    const formJson = JSON.parse(
      readFileSync('./improved-product-list.json', 'utf8')
    );

    // Navigate to the main page
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/01-initial-state.png' });

    // Click the "Import JSON" button (first one)
    const importButton = page.locator('button:has-text("Import JSON")').first();
    await expect(importButton).toBeVisible();
    await importButton.click();

    // Wait for the modal to appear
    await page.waitForSelector('textarea', { timeout: 5000 });

    // Take a screenshot of the modal
    await page.screenshot({ path: 'test-results/02-import-modal.png' });

    // Fill the textarea with the JSON (the one with placeholder "Paste your JSON form definition here...")
    const textarea = page.locator(
      'textarea[placeholder*="Paste your JSON form definition here"]'
    );
    await textarea.fill(JSON.stringify(formJson, null, 2));

    // Take a screenshot after filling the textarea
    await page.screenshot({ path: 'test-results/03-textarea-filled.png' });

    // Click the Import button in the modal (the one with "Import Form" text)
    const modalImportButton = page.locator('button:has-text("Import Form")');
    await expect(modalImportButton).toBeEnabled();
    await modalImportButton.click();

    // Wait for the form to load
    await page.waitForSelector('input[type="text"], input[type="number"]', {
      timeout: 10000,
    });

    // Take a screenshot of the loaded form
    await page.screenshot({ path: 'test-results/04-form-loaded.png' });

    // Click the "Add Item" button to add a product item
    const addItemButton = page.locator('button:has-text("Add Item")');
    await expect(addItemButton).toBeVisible();
    await addItemButton.click();

    // Wait for the product item to be added
    await page.waitForTimeout(500);

    // Take a screenshot after adding an item
    await page.screenshot({ path: 'test-results/05-after-add-item.png' });

    // Find the input fields (skip readonly fields for quantity and unitPrice, but include readonly for lineTotal)
    const quantityInput = page
      .locator('input[type="number"]:not([readonly])')
      .first();
    const unitPriceInput = page
      .locator('input[type="number"]:not([readonly])')
      .nth(1);
    const lineTotalInput = page.locator('input[id="products[0].lineTotal"]');

    // Debug: Log all number inputs after adding item
    const allNumberInputs = await page.locator('input[type="number"]').all();
    console.log(
      'All number inputs found after adding item:',
      allNumberInputs.length
    );
    for (let i = 0; i < allNumberInputs.length; i++) {
      const input = allNumberInputs[i];
      const isReadonly = await input.getAttribute('readonly');
      const id = await input.getAttribute('id');
      console.log(`Input ${i}: id=${id}, readonly=${isReadonly}`);
    }

    await expect(quantityInput).toBeVisible();
    await expect(unitPriceInput).toBeVisible();

    // Debug: Check for any inputs containing "lineTotal" before asserting
    const lineTotalInputs = await page.locator('input[id*="lineTotal"]').all();
    console.log('LineTotal inputs found:', lineTotalInputs.length);
    for (let i = 0; i < lineTotalInputs.length; i++) {
      const id = await lineTotalInputs[i].getAttribute('id');
      const type = await lineTotalInputs[i].getAttribute('type');
      const readonly = await lineTotalInputs[i].getAttribute('readonly');
      const visible = await lineTotalInputs[i].isVisible();
      console.log(
        `LineTotal ${i}: id=${id}, type=${type}, readonly=${readonly}, visible=${visible}`
      );
    }

    // Debug: Check all inputs with products in the id
    const productInputs = await page.locator('input[id*="products"]').all();
    console.log('Product inputs found:', productInputs.length);
    for (let i = 0; i < productInputs.length; i++) {
      const id = await productInputs[i].getAttribute('id');
      const type = await productInputs[i].getAttribute('type');
      const readonly = await productInputs[i].getAttribute('readonly');
      const visible = await productInputs[i].isVisible();
      console.log(
        `Product ${i}: id=${id}, type=${type}, readonly=${readonly}, visible=${visible}`
      );
    }

    // Skip the visibility check for now - the field might appear after we enter values
    // await expect(lineTotalInput).toBeVisible();

    // Test 1: Enter quantity: 3
    await quantityInput.fill('3');
    await page.waitForTimeout(500);

    // Check if lineTotal field appears after entering quantity
    const lineTotalAfterQuantity = await page
      .locator('input[id="products[0].lineTotal"]')
      .all();
    console.log(
      'LineTotal inputs found after entering quantity:',
      lineTotalAfterQuantity.length
    );

    // Take a screenshot after entering quantity
    await page.screenshot({ path: 'test-results/05-after-quantity.png' });

    // Test 2: Enter unit price: 4
    await unitPriceInput.fill('4');
    await page.waitForTimeout(500);

    // Check if lineTotal field appears after entering unit price
    const lineTotalAfterUnitPrice = await page
      .locator('input[id="products[0].lineTotal"]')
      .all();
    console.log(
      'LineTotal inputs found after entering unit price:',
      lineTotalAfterUnitPrice.length
    );

    // Try to find the lineTotal field with a more general selector
    const lineTotalGeneral = await page.locator('input[id*="lineTotal"]').all();
    console.log(
      'LineTotal inputs found with general selector:',
      lineTotalGeneral.length
    );
    for (let i = 0; i < lineTotalGeneral.length; i++) {
      const id = await lineTotalGeneral[i].getAttribute('id');
      const value = await lineTotalGeneral[i].inputValue();
      console.log(`LineTotal general ${i}: id=${id}, value=${value}`);
    }

    // Take a screenshot after entering unit price
    await page.screenshot({ path: 'test-results/06-after-unit-price.png' });

    // Check the line total value - if field exists
    let lineTotalValue = '';
    if (lineTotalAfterUnitPrice.length > 0) {
      lineTotalValue = await lineTotalAfterUnitPrice[0].inputValue();
      console.log('Line total value after entering 3 and 4:', lineTotalValue);
    } else {
      console.log('Line total field not found after entering values');
    }

    // Test 3: Change quantity to 5
    await quantityInput.fill('5');
    await page.waitForTimeout(500);

    // Take a screenshot after changing quantity to 5
    await page.screenshot({ path: 'test-results/07-after-quantity-5.png' });

    // Check the line total value again
    const lineTotalValueAfterChange = await lineTotalInput.inputValue();
    console.log(
      'Line total value after changing quantity to 5:',
      lineTotalValueAfterChange
    );

    // Test 4: Change unit price to 2
    await unitPriceInput.fill('2');
    await page.waitForTimeout(500);

    // Take a screenshot after changing unit price to 2
    await page.screenshot({ path: 'test-results/08-after-unit-price-2.png' });

    // Check the line total value again
    const lineTotalValueAfterUnitPriceChange =
      await lineTotalInput.inputValue();
    console.log(
      'Line total value after changing unit price to 2:',
      lineTotalValueAfterUnitPriceChange
    );

    // Wait a bit more to see if delayed evaluation kicks in
    await page.waitForTimeout(1000);

    // Check the line total value one more time
    const lineTotalValueAfterDelay = await lineTotalInput.inputValue();
    console.log('Line total value after delay:', lineTotalValueAfterDelay);

    // Take a final screenshot
    await page.screenshot({ path: 'test-results/09-final-state.png' });

    // Verify the calculations
    if (lineTotalValueAfterDelay === '10') {
      console.log('✅ Line total calculation is working correctly!');
      expect(lineTotalValueAfterDelay).toBe('10');
    } else {
      console.log(
        '❌ Line total calculation is NOT working. Expected: 10, Got:',
        lineTotalValueAfterDelay
      );

      // Get console logs to debug
      console.log('Console logs:', logs);

      // Fail the test with a descriptive message
      expect(lineTotalValueAfterDelay).toBe('10');
    }
  });
});
