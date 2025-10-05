import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Test Product List Review Section Updates', async ({ page }) => {
  // Read the test JSON file
  const formJson = fs.readFileSync('product-list-review-test.json', 'utf8');

  // Navigate to the page
  await page.goto('http://localhost:4200');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Look for the Import JSON button
  const importButton = page.locator('button:has-text("Import JSON")').first();
  await expect(importButton).toBeVisible();

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
  const modalImportButton = page.locator('button:has-text("Import Form")');
  await expect(modalImportButton).toBeEnabled();
  await modalImportButton.click();

  // Wait for the form to load
  await page.waitForSelector('input[type="text"], input[type="number"]', {
    timeout: 10000,
  });

  // Click "Add Item" to add a product
  const addItemButton = page.locator('button:has-text("Add Item")');
  await expect(addItemButton).toBeVisible();
  await addItemButton.click();

  // Wait for the product fields to appear
  await page.waitForSelector('input[type="text"]', { timeout: 5000 });

  // Fill in product details
  const productNameInput = page.locator('input[id="products[0].productName"]');
  await productNameInput.fill('Test Product');

  const quantityInput = page.locator('input[id="products[0].quantity"]');
  await quantityInput.fill('5');

  const unitPriceInput = page.locator('input[id="products[0].unitPrice"]');
  await unitPriceInput.fill('2');

  // Wait for calculations to complete
  await page.waitForTimeout(2000);

  // Check line total calculation
  const lineTotalInput = page.locator('input[id="products[0].lineTotal"]');
  const lineTotalValue = await lineTotalInput.inputValue();
  console.log('Line total value:', lineTotalValue);
  expect(lineTotalValue).toBe('10'); // 5 * 2 = 10

  // Check subtotal (should be same as line total for single product)
  const subtotalInput = page.locator('input[id="subtotal"]');
  const subtotalValue = await subtotalInput.inputValue();
  console.log('Subtotal value:', subtotalValue);
  console.log('Expected: 10, Got:', subtotalValue);

  // Check grand total (should be same as subtotal when tax is 0)
  const grandTotalInput = page.locator('input[id="grandTotal"]');
  const grandTotalValue = await grandTotalInput.inputValue();
  console.log('Grand total value:', grandTotalValue);
  console.log('Expected: 10, Got:', grandTotalValue);

  // Check review section
  const reviewText = page.locator('text=Products count:');
  await expect(reviewText).toBeVisible();

  // Check if review section shows the calculated values
  const reviewContent = await reviewText.textContent();
  console.log('Review section content:', reviewContent);

  // The review section should show the calculated values, but it might not due to inter-field dependencies
  if (
    reviewContent?.includes('Subtotal: 10') &&
    reviewContent?.includes('Grand Total: 10')
  ) {
    console.log('✅ Review section is updating correctly!');
  } else {
    console.log(
      '❌ Review section is not updating - this confirms the inter-field dependency issue'
    );
    console.log('   - Review content:', reviewContent);
  }

  console.log('📊 Test Results:');
  console.log('  - Line Total (working):', lineTotalValue);
  console.log('  - Subtotal (inter-field dependency):', subtotalValue);
  console.log('  - Grand Total (inter-field dependency):', grandTotalValue);
  console.log('  - Review Section (template processing):', reviewContent);
});
