import { test, expect } from '@playwright/test';

test.describe('BMI Interpretation Final Test', () => {
  test('should test BMI interpretation field', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click Import JSON button
    await page.locator('button:has-text("Import JSON")').first().click();

    // Wait for dialog to appear
    await page.waitForSelector('dialog:visible');

    // Simple BMI JSON
    const simpleJson = `{
      "app": {
        "title": "BMI Test",
        "pages": [
          {
            "id": "test",
            "title": "Test",
            "components": [
              {
                "type": "input",
                "id": "weight",
                "label": "Weight",
                "props": {
                  "inputType": "number"
                }
              },
              {
                "type": "input",
                "id": "height",
                "label": "Height",
                "props": {
                  "inputType": "number"
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
                    "expression": "round(weight / pow(height/100, 2) * 10) / 10",
                    "mode": "value",
                    "dependencies": ["weight", "height"]
                  }
                }
              },
              {
                "type": "text",
                "id": "interpretation",
                "label": "Interpretation",
                "props": {
                  "expression": {
                    "expression": "(bmi < 18.5 ? 'Underweight' : (bmi < 25 ? 'Normal weight' : (bmi < 30 ? 'Overweight' : 'Obesity')))",
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
    await textarea.type(simpleJson, { delay: 5 });

    // Wait for Import button to be enabled and click it
    await page.waitForSelector(
      'dialog button:has-text("Import Form"):not([disabled])',
      { timeout: 10000 }
    );
    await page.click('dialog button:has-text("Import Form")');

    // Wait for form to load
    await page.waitForSelector('input[readonly]', { timeout: 10000 });

    // Set weight and height values
    const weightInput = page.locator('input[type="number"]').first();
    const heightInput = page.locator('input[type="number"]').nth(1);

    await weightInput.fill('70');
    await heightInput.fill('175');

    // Wait for expressions to evaluate
    await page.waitForTimeout(2000);

    // Check the BMI value
    const bmiInput = page.locator('input[readonly]');
    const bmiValue = await bmiInput.inputValue();
    console.log('BMI value:', bmiValue);

    // BMI should be 22.9
    expect(bmiValue).toBe('22.9');

    // Check if the interpretation text is present anywhere on the page
    const pageContent = await page.content();
    console.log(
      'Page contains "Normal weight":',
      pageContent.includes('Normal weight')
    );
    console.log(
      'Page contains "Underweight":',
      pageContent.includes('Underweight')
    );
    console.log(
      'Page contains "Overweight":',
      pageContent.includes('Overweight')
    );
    console.log('Page contains "Obesity":', pageContent.includes('Obesity'));

    // The page should contain "Normal" since BMI 22.9 is normal
    expect(pageContent).toContain('Normal');
  });
});
