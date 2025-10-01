import { test, expect } from '@playwright/test';

test('Test Slider Form Validation in Flow Editor', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Load the slider form by pasting the JSON
  const sliderFormJson = {
    app: {
      title: 'Simple Slider Test',
      version: '1.0.0',
      language: 'en',
      theme: 'default',
      settings: {
        showProgressBar: true,
        showStepNumbers: true,
        allowBackNavigation: true,
        submitButtonText: 'Submit',
        nextButtonText: 'Next',
        previousButtonText: 'Previous',
        showRestartButton: true,
        restartButtonText: 'Restart',
      },
      pages: [
        {
          id: 'page1',
          title: 'Slider Addition Test',
          route: '/slider-test',
          components: [
            {
              id: 'slider1',
              type: 'slider-range',
              label: 'First Number',
              props: {
                min: 0,
                max: 100,
                step: 1,
                showLabels: true,
                showValue: true,
                mode: 'single',
                helperText: 'Move this slider to change the first number',
              },
              validation: {
                required: true,
              },
            },
            {
              id: 'slider2',
              type: 'slider-range',
              label: 'Second Number',
              props: {
                min: 0,
                max: 100,
                step: 1,
                showLabels: true,
                showValue: true,
                mode: 'single',
                helperText: 'Move this slider to change the second number',
              },
              validation: {
                required: true,
              },
            },
            {
              id: 'sum',
              type: 'input',
              label: 'Sum (Readonly)',
              props: {
                inputType: 'number',
                readOnly: true,
                helperText: 'This field shows the sum of the two sliders above',
              },
              expression: {
                expression: 'slider1.value + slider2.value',
                mode: 'value',
                dependencies: ['slider1', 'slider2'],
                evaluateOnChange: true,
              },
            },
          ],
        },
      ],
      thankYouPage: {
        title: 'Test Complete!',
        message: 'Thank you for testing the simple slider addition form.',
        showRestartButton: true,
      },
    },
    _lastModified: '2025-09-27T17:37:15.002Z',
  };

  // Switch to JSON view
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(1000);

  // Clear the textarea and paste the slider form JSON
  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  await jsonTextarea.clear();
  await jsonTextarea.fill(JSON.stringify(sliderFormJson, null, 2));

  // Click Import Form to load the form
  await page.click('button:has-text("Import Form")');
  await page.waitForTimeout(3000);

  // Click the View/Edit Form Flow button in the header
  await page.click('button:has-text("View/Edit Form Flow")');
  await page.waitForTimeout(2000);

  // Verify the flow editor is working
  const flowEditor = page.locator('.react-flow');
  await expect(flowEditor).toBeVisible({ timeout: 5000 });

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(1000);

  // Find the sidebar and check if it's valid
  const sidebar = page.locator(
    '.fixed.left-0.top-0.h-full.bg-white.shadow-lg.border-r.border-gray-200'
  );
  const sidebarTextarea = sidebar.locator('textarea').first();

  // Get current content
  const currentContent = await sidebarTextarea.inputValue();
  console.log('Current sidebar content length:', currentContent.length);

  if (currentContent.length > 0) {
    try {
      const pageData = JSON.parse(currentContent);
      console.log('✅ JSON is valid:', pageData.title);

      // Check if the save button is enabled (indicating valid JSON)
      const saveButton = sidebar
        .locator('button:has-text("Save"), button[type="submit"]')
        .first();
      const isSaveButtonEnabled = await saveButton.isEnabled();
      console.log('Save button enabled:', isSaveButtonEnabled);

      if (isSaveButtonEnabled) {
        console.log('✅ SUCCESS: Slider form validation is working correctly!');
      } else {
        console.log(
          '❌ FAILED: Save button is disabled - validation still failing'
        );
      }
    } catch (error) {
      console.log('❌ FAILED: JSON parsing error:', error);
    }
  } else {
    console.log('❌ FAILED: No content in sidebar textarea');
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-slider-form-validation.png' });
});
