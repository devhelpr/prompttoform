import { test, expect } from '@playwright/test';

test('Debug Node Editor Sidebar', async ({ page }) => {
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

  // Click the View/Edit Form Flow button in the header
  await page.click('button:has-text("View/Edit Form Flow")');
  await page.waitForTimeout(2000);

  // Verify the flow editor is working
  const flowEditor = page.locator('.react-flow');
  await expect(flowEditor).toBeVisible({ timeout: 5000 });

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(2000);

  // Check if Hide Editor button exists (editor should be open)
  const hideEditorButton = page.locator('button:has-text("Hide Editor")');
  const hideEditorExists = (await hideEditorButton.count()) > 0;
  console.log('Hide Editor button exists:', hideEditorExists);

  if (hideEditorExists) {
    console.log('✅ Node editor is open');

    // Look for any sidebar elements
    const allSidebars = page.locator('[class*="sidebar"]');
    const sidebarCount = await allSidebars.count();
    console.log('Total sidebar elements found:', sidebarCount);

    for (let i = 0; i < sidebarCount; i++) {
      const className = await allSidebars.nth(i).getAttribute('class');
      const isVisible = await allSidebars.nth(i).isVisible();
      const text = await allSidebars.nth(i).textContent();
      console.log(
        `Sidebar ${i}: class="${className}", visible=${isVisible}, text="${text?.substring(
          0,
          100
        )}"`
      );
    }

    // Look for any elements with "editor" in the class name
    const editorElements = page.locator('[class*="editor"]');
    const editorCount = await editorElements.count();
    console.log('Total editor elements found:', editorCount);

    for (let i = 0; i < editorCount; i++) {
      const className = await editorElements.nth(i).getAttribute('class');
      const isVisible = await editorElements.nth(i).isVisible();
      const text = await editorElements.nth(i).textContent();
      console.log(
        `Editor element ${i}: class="${className}", visible=${isVisible}, text="${text?.substring(
          0,
          100
        )}"`
      );
    }

    // Look for any textareas
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log('Total textareas found:', textareaCount);

    for (let i = 0; i < textareaCount; i++) {
      const placeholder = await textareas.nth(i).getAttribute('placeholder');
      const isVisible = await textareas.nth(i).isVisible();
      const content = await textareas.nth(i).inputValue();
      console.log(
        `Textarea ${i}: placeholder="${placeholder}", visible=${isVisible}, content length=${content.length}`
      );
    }

    // Look for any elements with "node" in the class name
    const nodeElements = page.locator('[class*="node"]');
    const nodeElementCount = await nodeElements.count();
    console.log('Total node elements found:', nodeElementCount);

    // Check for any elements that might be the sidebar
    const potentialSidebars = page.locator(
      'div[class*="fixed"], div[class*="absolute"], div[class*="right"], div[class*="left"]'
    );
    const potentialSidebarCount = await potentialSidebars.count();
    console.log('Potential sidebar elements found:', potentialSidebarCount);

    for (let i = 0; i < Math.min(potentialSidebarCount, 10); i++) {
      const className = await potentialSidebars.nth(i).getAttribute('class');
      const isVisible = await potentialSidebars.nth(i).isVisible();
      const text = await potentialSidebars.nth(i).textContent();
      if (isVisible && text && text.length > 0) {
        console.log(
          `Potential sidebar ${i}: class="${className}", visible=${isVisible}, text="${text.substring(
            0,
            100
          )}"`
        );
      }
    }
  } else {
    console.log('❌ Node editor is not open');
  }

  // Take a screenshot
  await page.screenshot({ path: 'debug-sidebar.png' });
});
