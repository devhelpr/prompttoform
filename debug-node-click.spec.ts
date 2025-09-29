import { test, expect } from '@playwright/test';

test('Debug Node Click and Sidebar', async ({ page }) => {
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

  // Get all nodes
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  console.log('Flow nodes found:', nodeCount);

  // Click on the first node
  const firstNode = nodes.first();
  console.log('Clicking on first node...');
  await firstNode.click();
  await page.waitForTimeout(2000);

  // Take a screenshot after clicking
  await page.screenshot({ path: 'debug-node-click.png' });

  // Look for any sidebars or panels that might have appeared
  const allDivs = page.locator('div');
  const divCount = await allDivs.count();
  console.log('Total divs on page:', divCount);

  // Look for elements that might be sidebars
  const potentialSidebars = page.locator(
    '[class*="sidebar"], [class*="panel"], [class*="editor"], [class*="drawer"]'
  );
  const sidebarCount = await potentialSidebars.count();
  console.log('Potential sidebar elements found:', sidebarCount);

  for (let i = 0; i < sidebarCount; i++) {
    const className = await potentialSidebars.nth(i).getAttribute('class');
    const isVisible = await potentialSidebars.nth(i).isVisible();
    const text = await potentialSidebars.nth(i).textContent();
    console.log(
      `Sidebar ${i}: class="${className}", visible=${isVisible}, text="${text?.substring(
        0,
        100
      )}"`
    );
  }

  // Look for any textareas that might be for editing
  const textareas = page.locator('textarea');
  const textareaCount = await textareas.count();
  console.log('Textareas found:', textareaCount);

  for (let i = 0; i < textareaCount; i++) {
    const placeholder = await textareas.nth(i).getAttribute('placeholder');
    const isVisible = await textareas.nth(i).isVisible();
    const content = await textareas.nth(i).inputValue();
    console.log(
      `Textarea ${i}: placeholder="${placeholder}", visible=${isVisible}, content length=${content.length}`
    );
  }

  // Look for any buttons that might be save buttons
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log('Buttons found after node click:', buttonCount);

  for (let i = 0; i < buttonCount; i++) {
    const text = await buttons.nth(i).textContent();
    const isVisible = await buttons.nth(i).isVisible();
    if (
      isVisible &&
      (text?.includes('Save') ||
        text?.includes('Edit') ||
        text?.includes('Update'))
    ) {
      console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
    }
  }

  // Check if there are any console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Wait a bit more to see if anything appears
  await page.waitForTimeout(3000);

  // Take another screenshot
  await page.screenshot({ path: 'debug-node-click-after-wait.png' });
});
