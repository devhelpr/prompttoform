import { test, expect } from '@playwright/test';

test('Debug Back to Editor Button', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Load a sample form
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(1000);

  // Click on the first example form
  await page.click('button:has-text("Simple Contact Form")');
  await page.waitForTimeout(3000);

  // Click the View Flow button in the header
  await page.click('button:has-text("View Flow")');
  await page.waitForTimeout(2000);

  // Verify the flow editor is working
  const flowEditor = page.locator('.react-flow');
  await expect(flowEditor).toBeVisible({ timeout: 5000 });

  // Click on the first node
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(1000);

  // Look for the "Back to Editor" button
  const backToEditorButton = page.locator('button:has-text("Back to Editor")');
  const backButtonExists = (await backToEditorButton.count()) > 0;
  console.log('Back to Editor button exists:', backButtonExists);

  if (backButtonExists && (await backToEditorButton.isVisible())) {
    console.log('✅ Back to Editor button is visible');

    // Click the Back to Editor button
    await backToEditorButton.click();
    await page.waitForTimeout(2000);

    // Take a screenshot after clicking
    await page.screenshot({ path: 'debug-back-to-editor.png' });

    // Check what view we're in now
    const bodyText = await page.locator('body').textContent();
    console.log(
      'Body text after Back to Editor (first 500 chars):',
      bodyText?.substring(0, 500)
    );

    // Look for any editing interfaces
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log('Textareas found after Back to Editor:', textareaCount);

    for (let i = 0; i < textareaCount; i++) {
      const placeholder = await textareas.nth(i).getAttribute('placeholder');
      const isVisible = await textareas.nth(i).isVisible();
      const content = await textareas.nth(i).inputValue();
      if (isVisible) {
        console.log(
          `Visible textarea ${i}: placeholder="${placeholder}", content length=${content.length}`
        );
      }
    }

    // Look for any buttons that might be for editing
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('Buttons found after Back to Editor:', buttonCount);

    for (let i = 0; i < buttonCount; i++) {
      const text = await buttons.nth(i).textContent();
      const isVisible = await buttons.nth(i).isVisible();
      if (
        isVisible &&
        (text?.includes('Save') ||
          text?.includes('Edit') ||
          text?.includes('Update') ||
          text?.includes('Apply'))
      ) {
        console.log(`Editing button ${i}: "${text}"`);
      }
    }
  } else {
    console.log('❌ Back to Editor button not found or not visible');
  }

  // Also try double-clicking on the node to see if that opens an editor
  console.log('Trying double-click on node...');
  await firstNode.dblclick();
  await page.waitForTimeout(2000);

  // Check if anything appeared after double-click
  const textareasAfterDoubleClick = page.locator('textarea');
  const textareaCountAfterDoubleClick = await textareasAfterDoubleClick.count();
  console.log(
    'Textareas found after double-click:',
    textareaCountAfterDoubleClick
  );

  // Take a screenshot after double-click
  await page.screenshot({ path: 'debug-double-click.png' });
});
