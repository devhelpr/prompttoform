import { test, expect } from '@playwright/test';

test.describe('BMI Calculator Expression System Test', () => {
  test('should test that expressions work correctly in BMI calculator', async ({
    page,
  }) => {
    // Navigate to the form
    await page.goto('http://localhost:4200');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click the Import JSON button
    await page.locator('button:has-text("Import JSON")').first().click();

    // Wait for the dialog to appear
    await page.waitForSelector('dialog:visible', { timeout: 5000 });

    // Get the specific textarea in the Import JSON dialog
    const textarea = page.locator(
      'dialog textarea[placeholder="Paste your JSON form definition here..."]'
    );

    // Clear the textarea first
    await textarea.click();
    await textarea.press('Control+a');
    await textarea.press('Delete');

    // Type the BMI calculator JSON manually (simulating human input)
    const jsonString = `{
  "app": {
    "title": "BMI Calculator",
    "pages": [
      {
        "id": "bmi-input",
        "title": "Enter measurements",
        "route": "/",
        "layout": "vertical",
        "components": [
          {
            "type": "input",
            "id": "weightKg",
            "label": "Body weight (kg)",
            "props": {
              "inputType": "number",
              "placeholder": "Enter weight in kg"
            }
          },
          {
            "type": "input",
            "id": "heightCm",
            "label": "Height (cm)",
            "props": {
              "inputType": "number",
              "placeholder": "Enter height in cm"
            }
          },
          {
            "type": "input",
            "id": "bmi",
            "label": "Body Mass Index (BMI)",
            "props": {
              "inputType": "number",
              "readOnly": true,
              "helperText": "Calculated automatically",
              "expression": {
                "expression": "round(weightKg / pow(heightCm/100, 2) * 10) / 10",
                "mode": "value",
                "dependencies": ["weightKg", "heightCm"],
                "evaluateOnChange": true,
                "debounceMs": 100
              }
            }
          }
        ],
        "isEndPage": true
      }
    ]
  },
  "defaultLanguage": "en",
  "supportedLanguages": ["en"],
  "languageDetails": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English"
    }
  ]
}`;

    // Type the JSON character by character to simulate human input
    await textarea.type(jsonString, { delay: 10 });

    // Wait for validation to complete
    await page.waitForTimeout(3000);

    // Click Import button
    const importButton = page.locator('dialog button:has-text("Import Form")');
    await importButton.click();

    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter weight in kg"]', {
      timeout: 10000,
    });

    // Get the form fields
    const weightInput = page.locator('input[placeholder="Enter weight in kg"]');
    const heightInput = page.locator('input[placeholder="Enter height in cm"]');
    const bmiInput = page.locator('input[readonly]');

    // Check initial state
    console.log('=== INITIAL STATE ===');
    console.log('Weight input value:', await weightInput.inputValue());
    console.log('Height input value:', await heightInput.inputValue());
    console.log('BMI input value:', await bmiInput.inputValue());

    // Enter weight: 70 kg
    console.log('=== ENTERING WEIGHT: 70 kg ===');
    await weightInput.fill('70');
    await weightInput.blur();

    // Wait for calculations
    await page.waitForTimeout(1000);

    console.log('After weight=70:');
    console.log('Weight input value:', await weightInput.inputValue());
    console.log('BMI input value:', await bmiInput.inputValue());

    // Enter height: 175 cm
    console.log('=== ENTERING HEIGHT: 175 cm ===');
    await heightInput.fill('175');
    await heightInput.blur();

    // Wait for calculations
    await page.waitForTimeout(1000);

    console.log('After height=175:');
    console.log('Height input value:', await heightInput.inputValue());
    console.log('BMI input value:', await bmiInput.inputValue());

    // Calculate expected BMI: 70 / (1.75)^2 = 70 / 3.0625 = 22.86
    const expectedBMI = Math.round((70 / Math.pow(175 / 100, 2)) * 10) / 10;
    const actualBMI = await bmiInput.inputValue();

    console.log('Expected BMI:', expectedBMI);
    console.log('Actual BMI:', actualBMI);

    // Verify the BMI calculation
    expect(actualBMI).toBe(expectedBMI.toString());

    console.log('✅ BMI Calculator expression system working correctly!');
    console.log('✅ Weight: 70 kg');
    console.log('✅ Height: 175 cm');
    console.log(`✅ BMI: ${actualBMI} (expected: ${expectedBMI})`);
  });
});
