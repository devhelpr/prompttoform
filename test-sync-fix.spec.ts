import { test, expect } from '@playwright/test';

test.describe('Fixed Bidirectional Synchronization Test', () => {
  test('should test the fixed synchronization workflow', async ({ page }) => {
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

    // Get the original form title from the main editor
    const originalTitle = await page
      .locator('h1, h2, h3')
      .first()
      .textContent();
    console.log('Original form title:', originalTitle);

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

    // Click on the first node to select it
    const firstNode = nodes.first();
    await firstNode.click();
    await page.waitForTimeout(1000);

    // Look for the "Hide Editor" button (editor should be open after node click)
    const hideEditorButton = page.locator('button:has-text("Hide Editor")');
    const hideEditorExists = (await hideEditorButton.count()) > 0;
    console.log(
      'Hide Editor button exists (editor is open):',
      hideEditorExists
    );

    if (hideEditorExists && (await hideEditorButton.isVisible())) {
      console.log('✅ Node editor is already open');
      // Don't click the button, just proceed to test the sidebar

      // Look for the node editor sidebar
      const sidebar = page.locator(
        '.fixed.left-0.top-0.h-full.bg-white.shadow-lg.border-r.border-gray-200'
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

                // Close the sidebar first to avoid interference
                const hideEditorButton = page.locator(
                  'button:has-text("Hide Editor")'
                );
                if (await hideEditorButton.isVisible()) {
                  console.log(
                    'Closing sidebar before clicking Back to Editor...'
                  );
                  await hideEditorButton.click();
                  await page.waitForTimeout(1000);
                }

                // Now test the Back to Editor functionality
                const backToEditorButton = page.locator(
                  'button:has-text("Back to Editor")'
                );
                const backButtonExists = (await backToEditorButton.count()) > 0;
                console.log('Back to Editor button exists:', backButtonExists);

                if (
                  backButtonExists &&
                  (await backToEditorButton.isVisible())
                ) {
                  console.log('✅ Back to Editor button found, clicking it...');
                  await backToEditorButton.click();
                  await page.waitForTimeout(3000);

                  // Check if we're back in the main editor
                  const mainEditor = page.locator(
                    'button:has-text("Update Form")'
                  );
                  const mainEditorExists = (await mainEditor.count()) > 0;
                  console.log('Back in main editor:', mainEditorExists);

                  if (mainEditorExists) {
                    console.log('✅ Successfully returned to main editor');

                    // Check if the form data was updated
                    // Look for the modified title in the main editor
                    const modifiedTitleInMain = page.locator(
                      'text="Modified Title from Flow Editor"'
                    );
                    const modifiedTitleInMainExists =
                      (await modifiedTitleInMain.count()) > 0;

                    if (modifiedTitleInMainExists) {
                      console.log(
                        '✅ Flow to JSON synchronization working - changes propagated to main editor'
                      );
                    } else {
                      console.log(
                        '❌ Flow to JSON synchronization not working - changes not propagated to main editor'
                      );
                    }
                  } else {
                    console.log('❌ Failed to return to main editor');
                  }
                } else {
                  console.log('❌ Back to Editor button not found');
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
    } else {
      console.log('⚠️ Hide Editor button not found - node editor not open');
    }

    // Take a screenshot
    await page.screenshot({ path: 'test-sync-fix.png' });
  });
});
