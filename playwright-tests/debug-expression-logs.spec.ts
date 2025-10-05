import { test, expect } from '@playwright/test';

test.describe('Debug Expression Logs', () => {
  test('should capture console logs from expression system', async ({
    page,
  }) => {
    const messages: Array<{ type: string; text: string }> = [];

    // Listen to console messages
    page.on('console', (msg) => {
      messages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

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

    // Wait a bit for any initial expression evaluations
    await page.waitForTimeout(2000);

    // Get the form fields
    const weightInput = page.locator('input[placeholder="Enter weight in kg"]');
    const heightInput = page.locator('input[placeholder="Enter height in cm"]');
    const bmiInput = page.locator('input[readonly]');

    console.log('=== CONSOLE MESSAGES AFTER FORM LOAD ===');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });

    // Enter weight: 70 kg
    console.log('=== ENTERING WEIGHT: 70 kg ===');
    await weightInput.fill('70');
    await weightInput.blur();

    // Wait for calculations
    await page.waitForTimeout(2000);

    console.log('=== CONSOLE MESSAGES AFTER WEIGHT INPUT ===');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });

    // Enter height: 175 cm
    console.log('=== ENTERING HEIGHT: 175 cm ===');
    await heightInput.fill('175');
    await heightInput.blur();

    // Wait for calculations
    await page.waitForTimeout(2000);

    console.log('=== CONSOLE MESSAGES AFTER HEIGHT INPUT ===');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });

    // Check the BMI value
    const bmiValue = await bmiInput.inputValue();
    console.log('Final BMI value:', bmiValue);

    // The test should pass regardless of the BMI value
    expect(true).toBe(true);
  });
});
