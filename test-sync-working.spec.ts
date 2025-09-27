import { test, expect } from '@playwright/test';

test.describe('Working Bidirectional Synchronization Test', () => {
  test('should test synchronization with working flow editor', async ({
    page,
  }) => {
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

    // Test 1: JSON to Flow synchronization
    console.log('=== Testing JSON to Flow Synchronization ===');

    // Switch to JSON view first
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(2000);

    // Get the current JSON content
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    const originalJson = await jsonTextarea.inputValue();
    console.log('Original JSON length:', originalJson.length);

    if (originalJson.length > 0) {
      // Parse and modify the JSON
      const formData = JSON.parse(originalJson);

      // Modify a page title
      if (formData.app && formData.app.pages && formData.app.pages.length > 0) {
        const originalTitle = formData.app.pages[0].title;
        formData.app.pages[0].title = 'Modified Title from JSON';

        // Update the JSON
        const modifiedJson = JSON.stringify(formData, null, 2);
        await jsonTextarea.fill(modifiedJson);

        // Click Import Form to apply changes
        await page.click('button:has-text("Import Form")');
        await page.waitForTimeout(2000);

        // Switch to flow view using the View Flow button in the header
        await page.click('button:has-text("View Flow")');
        await page.waitForTimeout(2000);

        // Check if the flow editor shows the modified title
        const nodeWithModifiedTitle = page.locator(
          'text="Modified Title from JSON"'
        );
        const modifiedTitleExists = (await nodeWithModifiedTitle.count()) > 0;

        if (modifiedTitleExists) {
          console.log('✅ JSON to Flow synchronization working');
        } else {
          console.log('❌ JSON to Flow synchronization not working');
        }
      }
    } else {
      console.log('⚠️ JSON textarea is empty - cannot test JSON to Flow sync');
    }

    // Test 2: Flow to JSON synchronization
    console.log('=== Testing Flow to JSON Synchronization ===');

    // Make sure we're in the flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Click on the first node to select it
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    await page.waitForTimeout(1000);

    // Look for the node editor sidebar
    const sidebar = page.locator(
      '[class*="sidebar"], [data-testid*="sidebar"]'
    );
    const sidebarExists = (await sidebar.count()) > 0;
    console.log('Node editor sidebar exists:', sidebarExists);

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
          try {
            // Modify the title
            const pageData = JSON.parse(currentContent);
            const originalTitle = pageData.title;
            pageData.title = 'Modified Title from Flow Editor';

            const modifiedContent = JSON.stringify(pageData, null, 2);
            await sidebarTextarea.fill(modifiedContent);

            // Look for save button
            const saveButton = sidebar
              .locator('button:has-text("Save"), button[type="submit"]')
              .first();
            const saveButtonExists = (await saveButton.count()) > 0;
            console.log('Save button exists:', saveButtonExists);

            if (saveButtonExists && (await saveButton.isVisible())) {
              await saveButton.click();
              await page.waitForTimeout(2000);

              // Switch back to JSON view to check if changes propagated
              await page.click('button:has-text("JSON")');
              await page.waitForTimeout(2000);

              // Check if the main JSON editor shows the modified title
              const mainJsonContent = await jsonTextarea.inputValue();
              const mainFormData = JSON.parse(mainJsonContent);

              const modifiedPage = mainFormData.app.pages.find(
                (page: any) => page.title === 'Modified Title from Flow Editor'
              );

              if (modifiedPage) {
                console.log('✅ Flow to JSON synchronization working');
              } else {
                console.log('❌ Flow to JSON synchronization not working');
                console.log(
                  'Available page titles:',
                  mainFormData.app.pages.map((p: any) => p.title)
                );
              }
            } else {
              console.log('⚠️ Save button not found in sidebar');
            }
          } catch (e) {
            console.log('⚠️ Error parsing sidebar JSON:', e.message);
          }
        } else {
          console.log('⚠️ Sidebar textarea is empty');
        }
      } else {
        console.log('⚠️ JSON textarea not found in sidebar');
      }
    } else {
      console.log('⚠️ Node editor sidebar not visible');
    }

    // Test 3: Check for sync status indicators
    console.log('=== Testing Sync Status Indicators ===');

    // Look for sync status indicators
    const syncIndicators = page.locator(
      '[class*="bg-green"], [class*="bg-yellow"], [class*="bg-red"], [class*="sync"], [class*="status"]'
    );
    const syncCount = await syncIndicators.count();
    console.log('Sync indicators found:', syncCount);

    for (let i = 0; i < syncCount; i++) {
      const text = await syncIndicators.nth(i).textContent();
      const className = await syncIndicators.nth(i).getAttribute('class');
      console.log(`Sync indicator ${i}: "${text}" (class: ${className})`);
    }

    // Take a screenshot
    await page.screenshot({ path: 'test-sync-working.png' });
  });
});
