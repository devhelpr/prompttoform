import { test, expect } from '@playwright/test';

test('Debug Node Selection and Show Editor Button', async ({ page }) => {
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

  // Check if we have nodes
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  console.log('Flow nodes found:', nodeCount);

  expect(nodeCount).toBeGreaterThan(0);

  // Click on the first node to select it
  const firstNode = nodes.first();
  console.log('Clicking on first node...');
  await firstNode.click();
  await page.waitForTimeout(2000);

  // Take a screenshot after clicking
  await page.screenshot({ path: 'debug-node-selection.png' });

  // Check if the Show Editor button appears
  const showEditorButton = page.locator('button:has-text("Show Editor")');
  const showEditorExists = (await showEditorButton.count()) > 0;
  console.log('Show Editor button exists after node click:', showEditorExists);

  if (showEditorExists) {
    const isVisible = await showEditorButton.isVisible();
    console.log('Show Editor button visible:', isVisible);

    if (isVisible) {
      console.log('✅ Show Editor button is visible');

      // Click the Show Editor button
      await showEditorButton.click();
      await page.waitForTimeout(2000);

      // Check if the node editor sidebar opens
      const sidebar = page.locator(
        '[class*="sidebar"], [data-testid*="sidebar"]'
      );
      const sidebarExists = (await sidebar.count()) > 0;
      console.log(
        'Node editor sidebar exists after Show Editor click:',
        sidebarExists
      );

      if (sidebarExists && (await sidebar.isVisible())) {
        console.log('✅ Node editor sidebar is visible');

        // Look for JSON editing in the sidebar
        const sidebarTextarea = sidebar.locator('textarea').first();
        const sidebarTextareaExists = (await sidebarTextarea.count()) > 0;
        console.log('Sidebar JSON textarea exists:', sidebarTextareaExists);

        if (sidebarTextareaExists && (await sidebarTextarea.isVisible())) {
          console.log('✅ JSON textarea found in sidebar');

          // Get current content
          const currentContent = await sidebarTextarea.inputValue();
          console.log('Current sidebar content length:', currentContent.length);

          if (currentContent.length > 0) {
            console.log('✅ Sidebar has content - node editing is working!');
          } else {
            console.log('⚠️ Sidebar textarea is empty');
          }
        } else {
          console.log('⚠️ JSON textarea not found in sidebar');
        }
      } else {
        console.log('⚠️ Node editor sidebar not visible');
      }
    } else {
      console.log('❌ Show Editor button not visible');
    }
  } else {
    console.log('❌ Show Editor button not found');

    // Check what buttons are available
    const buttons = await page.locator('button').all();
    console.log('Available buttons after node click:');

    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      if (isVisible) {
        console.log(`Button ${i}: "${text}"`);
      }
    }
  }

  // Take another screenshot
  await page.screenshot({ path: 'debug-node-selection-final.png' });
});
