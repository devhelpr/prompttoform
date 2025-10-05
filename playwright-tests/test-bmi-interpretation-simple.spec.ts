import { test, expect } from '@playwright/test';

test.describe('BMI Interpretation Simple Test', () => {
  test('should test BMI interpretation field with simple JSON', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click Import JSON button
    await page.locator('button:has-text("Import JSON")').first().click();

    // Wait for dialog to appear
    await page.waitForSelector('dialog:visible');

    // Simple BMI JSON with just the essential fields
    const simpleBmiJson = `{
      "app": {
        "title": "BMI Calculator",
        "pages": [
          {
            "id": "bmi-input",
            "title": "Enter measurements",
            "components": [
              {
                "type": "slider-range",
                "id": "weightKg",
                "label": "Body weight (kg)",
                "props": {
                  "min": 30,
                  "max": 250,
                  "step": 0.5,
                  "mode": "single"
                }
              },
              {
                "type": "slider-range",
                "id": "heightCm",
                "label": "Height (cm)",
                "props": {
                  "min": 100,
                  "max": 230,
                  "step": 0.5,
                  "mode": "single"
                }
              },
              {
                "type": "input",
                "id": "bmi",
                "label": "BMI",
                "props": {
                  "inputType": "number",
                  "readOnly": true,
                  "expression": {
                    "expression": "round(weightKg.value / pow(heightCm.value/100, 2) * 10) / 10",
                    "mode": "value",
                    "dependencies": ["weightKg", "heightCm"]
                  }
                }
              },
              {
                "type": "text",
                "id": "bmi-interpretation",
                "label": "BMI interpretation",
                "props": {
                  "expression": {
                    "expression": "(bmi.value < 18.5 ? 'Underweight' : (bmi.value < 25 ? 'Normal weight' : (bmi.value < 30 ? 'Overweight' : 'Obesity')))",
                    "mode": "value",
                    "dependencies": ["bmi"]
                  }
                }
              }
            ],
            "isEndPage": true
          }
        ]
      }
    }`;

    // Type the JSON into the textarea
    const textarea = page.locator(
      'dialog textarea[placeholder="Paste your JSON form definition here..."]'
    );
    await textarea.clear();
    await textarea.type(simpleBmiJson, { delay: 5 });

    // Wait for Import button to be enabled and click it
    await page.waitForSelector(
      'dialog button:has-text("Import Form"):not([disabled])',
      { timeout: 10000 }
    );
    await page.click('dialog button:has-text("Import Form")');

    // Wait for form to load
    await page.waitForSelector('input[type="range"]', { timeout: 10000 });

    console.log('=== TESTING BMI INTERPRETATION ===');

    const weightInput = page.locator('input[type="range"]').first();
    const heightInput = page.locator('input[type="range"]').nth(1);
    const bmiInput = page.locator('input[readonly]');

    // Find the BMI interpretation text element
    const interpretationElement = page
      .locator('text=BMI interpretation')
      .locator('..')
      .locator('p, div')
      .last();

    // Set weight to 70 kg
    await weightInput.fill('70');
    await page.waitForTimeout(500);

    // Set height to 175 cm
    await heightInput.fill('175');
    await page.waitForTimeout(1000);

    console.log('Weight:', await weightInput.inputValue());
    console.log('Height:', await heightInput.inputValue());
    console.log('BMI:', await bmiInput.inputValue());
    console.log(
      'BMI interpretation:',
      await interpretationElement.textContent()
    );

    // Check if BMI interpretation is working
    const interpretationValue = await interpretationElement.textContent();
    console.log('Final BMI interpretation:', interpretationValue);

    // BMI of 22.9 should be "Normal weight"
    expect(interpretationValue).toContain('Normal weight');
  });
});
