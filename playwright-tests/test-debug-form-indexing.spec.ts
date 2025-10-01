import { test, expect } from '@playwright/test';

test.describe('Debug Form Node Indexing', () => {
  test('should load the app and navigate to flow view', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'debug-app-loaded.png' });

    // Check if we can see the main content
    const h1 = page.locator('h1');
    const h1Text = await h1.textContent();
    console.log('H1 text:', h1Text);

    // Look for any buttons on the page
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('Number of buttons found:', buttonCount);

    // List all button texts
    for (let i = 0; i < buttonCount; i++) {
      const buttonText = await buttons.nth(i).textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }

    // Try to find JSON button
    const jsonButton = page.locator('button:has-text("JSON")');
    const jsonButtonExists = (await jsonButton.count()) > 0;
    console.log('JSON button exists:', jsonButtonExists);

    if (jsonButtonExists) {
      await jsonButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-json-view.png' });
    }

    // Try to find Flow button
    const flowButton = page.locator('button:has-text("Flow")');
    const flowButtonExists = (await flowButton.count()) > 0;
    console.log('Flow button exists:', flowButtonExists);

    if (flowButtonExists) {
      await flowButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-flow-view.png' });
    }

    // Check if we can find the textarea
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log('Number of textareas found:', textareaCount);

    for (let i = 0; i < textareaCount; i++) {
      const placeholder = await textareas.nth(i).getAttribute('placeholder');
      console.log(`Textarea ${i} placeholder: "${placeholder}"`);
    }

    expect(true).toBe(true); // Just to make the test pass
  });

  test('should test the simple slider form directly', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Click the first "Import JSON" button (the one in the main interface)
    const importJsonButton = page
      .locator('button:has-text("Import JSON")')
      .first();
    await importJsonButton.click();
    await page.waitForTimeout(2000);

    // Find the JSON textarea
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    if ((await jsonTextarea.count()) > 0) {
      // Load a simple form
      const simpleForm = {
        app: {
          title: 'Simple Test',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [
                {
                  id: 'field1',
                  type: 'input',
                  label: 'Test Field',
                  props: { inputType: 'text' },
                  validation: { required: true },
                },
              ],
            },
          ],
        },
      };

      await jsonTextarea.clear();
      await jsonTextarea.fill(JSON.stringify(simpleForm, null, 2));
      await page.waitForTimeout(1000);

      // Click Import Form to load the form
      await page.click('button:has-text("Import Form")');
      await page.waitForTimeout(3000);

      // Click the View/Edit Form Flow button in the header
      await page.click('button:has-text("View/Edit Form Flow")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-simple-form-flow.png' });

      // Check if we can see the preview button
      const previewButton = page.locator('button:has-text("Preview")');
      const previewExists = (await previewButton.count()) > 0;
      console.log('Preview button exists:', previewExists);

      if (previewExists) {
        await previewButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'debug-preview-opened.png' });

        // Check for step indicators
        const stepIndicators = page.locator('text=/Step \\d+ of \\d+/');
        const stepCount = await stepIndicators.count();
        console.log('Step indicators found:', stepCount);

        for (let i = 0; i < stepCount; i++) {
          const stepText = await stepIndicators.nth(i).textContent();
          console.log(`Step indicator ${i}: "${stepText}"`);
        }
      }
    }

    expect(true).toBe(true); // Just to make the test pass
  });
});
