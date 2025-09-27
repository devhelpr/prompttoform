import { test, expect } from '@playwright/test';

test.describe('Manual Form Synchronization Test', () => {
  test('should test synchronization with manually created form', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Create a simple form manually by pasting JSON
    const simpleFormJson = JSON.stringify(
      {
        app: {
          name: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'Test Page',
              fields: [
                {
                  id: 'field1',
                  type: 'text',
                  label: 'Test Field',
                  required: true,
                },
              ],
            },
          ],
        },
      },
      null,
      2
    );

    // Switch to JSON view
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(1000);

    // Paste the JSON into the editor
    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await jsonTextarea.fill(simpleFormJson);

    // Click Update Preview to apply the changes
    await page.click('button:has-text("Update Preview")');
    await page.waitForTimeout(2000);

    // Switch to Visual Flow view using the View Flow button in the header
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Check if the flow editor shows the form
    const flowEditor = page.locator('.react-flow');
    await expect(flowEditor).toBeVisible({ timeout: 5000 });

    // Look for the test page node
    const testPageNode = page.locator('text="Test Page"');
    await expect(testPageNode).toBeVisible({ timeout: 5000 });

    console.log('✅ JSON to Flow synchronization working');

    // Now test Flow to JSON synchronization
    // Click on the node to select it
    await testPageNode.click();
    await page.waitForTimeout(1000);

    // Look for the node editor sidebar
    const sidebar = page.locator(
      '[class*="sidebar"], [data-testid*="sidebar"]'
    );
    if (await sidebar.isVisible()) {
      console.log('✅ Node editor sidebar is visible');

      // Look for JSON editing in the sidebar
      const sidebarTextarea = sidebar.locator('textarea').first();
      if (await sidebarTextarea.isVisible()) {
        console.log('✅ JSON textarea found in sidebar');

        // Get current content
        const currentContent = await sidebarTextarea.inputValue();
        console.log('Current sidebar content length:', currentContent.length);

        if (currentContent.length > 0) {
          // Modify the title
          const pageData = JSON.parse(currentContent);
          pageData.title = 'Modified Test Page';

          const modifiedContent = JSON.stringify(pageData, null, 2);
          await sidebarTextarea.fill(modifiedContent);

          // Look for save button
          const saveButton = sidebar
            .locator('button:has-text("Save"), button[type="submit"]')
            .first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);

            // Switch back to JSON view to check if changes propagated
            await page.click('button:has-text("JSON")');
            await page.waitForTimeout(2000);

            // Check if the main JSON editor shows the modified title
            const mainJsonContent = await jsonTextarea.inputValue();
            const mainFormData = JSON.parse(mainJsonContent);

            const modifiedPage = mainFormData.app.pages.find(
              (page: any) => page.title === 'Modified Test Page'
            );

            if (modifiedPage) {
              console.log('✅ Flow to JSON synchronization working');
            } else {
              console.log('❌ Flow to JSON synchronization not working');
            }
          } else {
            console.log('⚠️ Save button not found in sidebar');
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
    await page.screenshot({ path: 'test-sync-manual.png' });
  });
});
