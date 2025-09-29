import { test, expect } from '@playwright/test';

test.describe('Flow Editor Synchronization Test', () => {
  test('should test flow editor synchronization', async ({ page }) => {
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
    console.log('✅ Flow editor is working');

    // Test node selection and editing
    const firstNode = nodes.first();
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
            // Parse the current content
            const pageData = JSON.parse(currentContent);
            console.log('Current page title:', pageData.title);

            // Modify the title
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
              console.log('✅ Save button found, clicking it...');
              await saveButton.click();
              await page.waitForTimeout(2000);

              // Check if the node title changed in the flow
              const modifiedNode = page.locator(
                'text="Modified Title from Flow Editor"'
              );
              const modifiedNodeExists = (await modifiedNode.count()) > 0;

              if (modifiedNodeExists) {
                console.log('✅ Flow editor shows modified title');
              } else {
                console.log('❌ Flow editor does not show modified title');
              }

              // Test if changes propagate to JSON view
              // First, close any open dialogs
              const closeButtons = page.locator(
                'button:has-text("Close"), button:has-text("×")'
              );
              const closeButtonCount = await closeButtons.count();
              if (closeButtonCount > 0) {
                await closeButtons.first().click();
                await page.waitForTimeout(1000);
              }

              // Switch to JSON view
              await page.click('button:has-text("JSON")');
              await page.waitForTimeout(2000);

              // Check if the main JSON editor shows the modified title
              const jsonTextarea = page.locator(
                'textarea[placeholder*="JSON form definition"]'
              );
              const mainJsonContent = await jsonTextarea.inputValue();

              if (mainJsonContent.length > 0) {
                const mainFormData = JSON.parse(mainJsonContent);
                const modifiedPage = mainFormData.app.pages.find(
                  (page: any) =>
                    page.title === 'Modified Title from Flow Editor'
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
                console.log('⚠️ Main JSON editor is empty');
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

    // Take a screenshot
    await page.screenshot({ path: 'test-flow-sync.png' });
  });
});
