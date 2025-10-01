import { test, expect } from '@playwright/test';

test('Debug View/Edit Form Flow Button', async ({ page }) => {
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

  // Check what buttons are available
  const buttons = await page.locator('button').all();
  console.log('Buttons after loading example form:');

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    if (isVisible) {
      console.log(`Button ${i}: "${text}"`);
    }
  }

  // Look for View/Edit Form Flow button specifically - use the first one
  const viewFlowButton = page
    .locator('button:has-text("View/Edit Form Flow")')
    .first();
  const viewFlowExists = (await viewFlowButton.count()) > 0;
  console.log('View/Edit Form Flow button exists:', viewFlowExists);

  if (viewFlowExists) {
    const isVisible = await viewFlowButton.isVisible();
    console.log('View/Edit Form Flow button visible:', isVisible);

    if (isVisible) {
      // Click the View/Edit Form Flow button
      await viewFlowButton.click();
      await page.waitForTimeout(3000);

      // Check if we now have a flow editor
      const flowEditor = page.locator('.react-flow');
      const flowEditorExists = (await flowEditor.count()) > 0;
      console.log(
        'Flow editor exists after View/Edit Form Flow:',
        flowEditorExists
      );

      if (flowEditorExists) {
        const isVisible = await flowEditor.isVisible();
        console.log('Flow editor visible:', isVisible);

        // Look for nodes
        const nodes = page.locator('.react-flow__node');
        const nodeCount = await nodes.count();
        console.log('Flow nodes found:', nodeCount);

        for (let i = 0; i < nodeCount; i++) {
          const text = await nodes.nth(i).textContent();
          const isVisible = await nodes.nth(i).isVisible();
          console.log(`Node ${i}: "${text}" (visible: ${isVisible})`);
        }
      }
    }
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-view-flow.png' });
});
