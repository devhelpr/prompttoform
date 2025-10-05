import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('BMI Interpretation Test', () => {
  test('should test BMI interpretation field', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click Import JSON button
    await page.locator('button:has-text("Import JSON")').first().click();

    // Wait for dialog to appear
    await page.waitForSelector('dialog:visible');

    // Load the BMI JSON
    const jsonString = readFileSync('bmi-interpretation-test.json', 'utf8');

    // Type the JSON into the textarea
    const textarea = page.locator(
      'dialog textarea[placeholder="Paste your JSON form definition here..."]'
    );
    await textarea.clear();
    await textarea.type(jsonString, { delay: 10 });

    // Wait for Import button to be enabled and click it
    await page.waitForSelector(
      'dialog button:has-text("Import Form"):not([disabled])',
      { timeout: 10000 }
    );
    await page.click('dialog button:has-text("Import Form")');

    // Wait for form to load
    await page.waitForSelector('input[type="range"]', { timeout: 10000 });

    console.log('=== INITIAL STATE ===');
    const weightInput = page.locator('input[type="range"]').first();
    const heightInput = page.locator('input[type="range"]').nth(1);
    const bmiInput = page.locator('input[readonly]');
    const interpretationText = page
      .locator('text=BMI interpretation')
      .locator('..')
      .locator('p, div')
      .last();

    console.log('Weight input value:', await weightInput.inputValue());
    console.log('Height input value:', await heightInput.inputValue());
    console.log('BMI input value:', await bmiInput.inputValue());
    console.log(
      'BMI interpretation text:',
      await interpretationText.textContent()
    );

    // Set weight to 70 kg
    console.log('=== SETTING WEIGHT: 70 kg ===');
    await weightInput.fill('70');
    await page.waitForTimeout(500);

    console.log('After weight=70:');
    console.log('Weight input value:', await weightInput.inputValue());
    console.log('BMI input value:', await bmiInput.inputValue());
    console.log(
      'BMI interpretation text:',
      await interpretationText.textContent()
    );

    // Set height to 175 cm
    console.log('=== SETTING HEIGHT: 175 cm ===');
    await heightInput.fill('175');
    await page.waitForTimeout(500);

    console.log('After height=175:');
    console.log('Weight input value:', await weightInput.inputValue());
    console.log('Height input value:', await heightInput.inputValue());
    console.log('BMI input value:', await bmiInput.inputValue());
    console.log(
      'BMI interpretation text:',
      await interpretationText.textContent()
    );

    // Check if BMI interpretation is working
    const interpretationValue = await interpretationText.textContent();
    console.log('Final BMI interpretation:', interpretationValue);

    // BMI of 22.9 should be "Normal weight"
    expect(interpretationValue).toContain('Normal weight');
  });
});
