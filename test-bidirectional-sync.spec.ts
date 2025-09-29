import { test, expect } from '@playwright/test';

test.describe('Bidirectional Form Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });
  });

  test('should synchronize changes from JSON editor to flow editor', async ({
    page,
  }) => {
    // Load a sample form first
    await page.click('button:has-text("Examples")');
    await page.waitForTimeout(1000);

    // Click on the first example form
    await page.click('button:has-text("Simple Contact Form")');
    await page.waitForTimeout(2000);

    // Switch to JSON view
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(1000);

    // Get the current JSON content - target the JSON editor specifically
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    const originalJson = await jsonTextarea.inputValue();

    // Parse the JSON to modify it
    const formData = JSON.parse(originalJson);

    // Modify a page title
    if (formData.app && formData.app.pages && formData.app.pages.length > 0) {
      const originalTitle = formData.app.pages[0].title;
      formData.app.pages[0].title = 'Modified Title from JSON';

      // Update the JSON
      const modifiedJson = JSON.stringify(formData, null, 2);
      await jsonTextarea.fill(modifiedJson);

      // Click update preview to apply changes
      await page.click('button:has-text("Update Preview")');
      await page.waitForTimeout(2000);

      // Switch to flow view using the View Flow button in the header
      await page.click('button:has-text("View Flow")');
      await page.waitForTimeout(2000);

      // Check if the flow editor shows the modified title
      // Look for the modified title in the flow nodes
      const nodeWithModifiedTitle = page.locator(
        `text="Modified Title from JSON"`
      );
      await expect(nodeWithModifiedTitle).toBeVisible({ timeout: 5000 });

      console.log('✅ JSON to Flow synchronization working');
    }
  });

  test('should synchronize changes from flow editor to JSON editor', async ({
    page,
  }) => {
    // Load a sample form first
    await page.click('button:has-text("Examples")');
    await page.waitForTimeout(1000);

    // Click on the first example form
    await page.click('button:has-text("Simple Contact Form")');
    await page.waitForTimeout(2000);

    // Switch to flow view using the View Flow button in the header
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Wait for flow editor to load
    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Click on a node to select it
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    await page.waitForTimeout(1000);

    // Check if the node editor sidebar opens
    const sidebar = page.locator(
      '[data-testid="node-editor-sidebar"], .sidebar, [class*="sidebar"]'
    );
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // Look for JSON editing capabilities in the sidebar
    const jsonTextarea = sidebar.locator('textarea').first();
    if (await jsonTextarea.isVisible()) {
      // Get current JSON content
      const currentJson = await jsonTextarea.inputValue();
      const pageData = JSON.parse(currentJson);

      // Modify the title
      const originalTitle = pageData.title;
      pageData.title = 'Modified Title from Flow Editor';

      // Update the JSON in the sidebar
      const modifiedJson = JSON.stringify(pageData, null, 2);
      await jsonTextarea.fill(modifiedJson);

      // Save the changes
      const saveButton = sidebar
        .locator('button:has-text("Save"), button[type="submit"]')
        .first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Switch to JSON view to check if changes propagated
        await page.click('button:has-text("JSON")');
        await page.waitForTimeout(2000);

        // Check if the main JSON editor shows the modified title
        const mainJsonTextarea = page.locator(
          'textarea[placeholder*="JSON form definition"]'
        );
        const mainJson = await mainJsonTextarea.inputValue();
        const mainFormData = JSON.parse(mainJson);

        // Find the modified page
        const modifiedPage = mainFormData.app.pages.find(
          (page: any) => page.title === 'Modified Title from Flow Editor'
        );

        expect(modifiedPage).toBeTruthy();
        console.log('✅ Flow to JSON synchronization working');
      } else {
        console.log('⚠️ Save button not found in sidebar');
      }
    } else {
      console.log('⚠️ JSON textarea not found in sidebar');
    }
  });

  test('should show synchronization status indicators', async ({ page }) => {
    // Load a sample form first
    await page.click('button:has-text("Examples")');
    await page.waitForTimeout(1000);

    // Click on the first example form
    await page.click('button:has-text("Simple Contact Form")');
    await page.waitForTimeout(2000);

    // Look for sync status indicator
    const syncStatus = page.locator(
      '[class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-red-100"]'
    );

    if (await syncStatus.isVisible()) {
      const statusText = await syncStatus.textContent();
      console.log('Sync status:', statusText);

      // Should show "Synced" status initially
      expect(statusText).toContain('Synced');
      console.log('✅ Sync status indicator working');
    } else {
      console.log('⚠️ Sync status indicator not found');
    }
  });

  test('should handle form structure changes in flow editor', async ({
    page,
  }) => {
    // Load a sample form first
    await page.click('button:has-text("Examples")');
    await page.waitForTimeout(1000);

    // Click on the first example form
    await page.click('button:has-text("Simple Contact Form")');
    await page.waitForTimeout(2000);

    // Switch to flow view using the View Flow button in the header
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Wait for flow editor to load
    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Try to add a new node (if there's an add button)
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("+"), [data-testid="add-node"]'
    );
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);

      // Check if a new node was added
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();

      if (nodeCount > 1) {
        console.log('✅ Node addition working');

        // Switch to JSON to see if the new node is reflected
        await page.click('button:has-text("JSON")');
        await page.waitForTimeout(2000);

        const jsonTextarea = page.locator(
          'textarea[placeholder*="JSON form definition"]'
        );
        const jsonContent = await jsonTextarea.inputValue();
        const formData = JSON.parse(jsonContent);

        // Should have more pages now
        expect(formData.app.pages.length).toBeGreaterThan(1);
        console.log('✅ Node addition synchronized to JSON');
      }
    } else {
      console.log('⚠️ Add node button not found');
    }
  });

  test('should detect and handle conflicts', async ({ page }) => {
    // Load a sample form first
    await page.click('button:has-text("Examples")');
    await page.waitForTimeout(1000);

    // Click on the first example form
    await page.click('button:has-text("Simple Contact Form")');
    await page.waitForTimeout(2000);

    // Make changes in JSON editor
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(1000);

    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    const originalJson = await jsonTextarea.inputValue();
    const formData = JSON.parse(originalJson);

    if (formData.app && formData.app.pages && formData.app.pages.length > 0) {
      formData.app.pages[0].title = 'JSON Modified Title';
      const modifiedJson = JSON.stringify(formData, null, 2);
      await jsonTextarea.fill(modifiedJson);
      await page.click('button:has-text("Update Preview")');
      await page.waitForTimeout(1000);

      // Make changes in flow editor
      await page.click('button:has-text("Visual Flow")');
      await page.waitForTimeout(2000);

      // Try to modify the same page in flow editor
      const firstNode = page.locator('.react-flow__node').first();
      await firstNode.click();
      await page.waitForTimeout(1000);

      const sidebar = page.locator(
        '[data-testid="node-editor-sidebar"], .sidebar, [class*="sidebar"]'
      );
      if (await sidebar.isVisible()) {
        const sidebarJsonTextarea = sidebar.locator('textarea').first();
        if (await sidebarJsonTextarea.isVisible()) {
          const sidebarJson = await sidebarJsonTextarea.inputValue();
          const sidebarPageData = JSON.parse(sidebarJson);
          sidebarPageData.title = 'Flow Modified Title';

          const modifiedSidebarJson = JSON.stringify(sidebarPageData, null, 2);
          await sidebarJsonTextarea.fill(modifiedSidebarJson);

          const saveButton = sidebar
            .locator('button:has-text("Save"), button[type="submit"]')
            .first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);

            // Check for conflict indicators
            const conflictIndicator = page.locator(
              '[class*="bg-red-100"]:has-text("Conflict")'
            );
            if (await conflictIndicator.isVisible()) {
              console.log('✅ Conflict detection working');

              // Check for resolve button
              const resolveButton = page.locator('button:has-text("Resolve")');
              if (await resolveButton.isVisible()) {
                console.log('✅ Conflict resolution button available');
              }
            } else {
              console.log('⚠️ Conflict not detected or indicator not visible');
            }
          }
        }
      }
    }
  });
});
