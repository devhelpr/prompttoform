import { test, expect } from '@playwright/test';

test('Test Import Form functionality', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Switch to JSON view
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(2000);

  // Create a simple form JSON
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

  // Fill the JSON textarea
  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  await jsonTextarea.fill(simpleFormJson);
  await page.waitForTimeout(1000);

  // Try clicking "Import Form" button
  const importFormButton = page.locator('button:has-text("Import Form")');
  const importFormExists = (await importFormButton.count()) > 0;
  console.log('Import Form button exists:', importFormExists);

  if (importFormExists && (await importFormButton.isVisible())) {
    await importFormButton.click();
    await page.waitForTimeout(3000);

    // Check if we now have view mode buttons
    const viewButtons = page.locator(
      'button:has-text("Form Preview"), button:has-text("Form Logic"), button:has-text("JSON")'
    );
    const viewButtonCount = await viewButtons.count();
    console.log('View mode buttons after Import Form:', viewButtonCount);

    if (viewButtonCount > 0) {
      // Switch to Form Logic view using the View/Edit Form Flow button in the header
      await page.click('button:has-text("View/Edit Form Flow")');
      await page.waitForTimeout(2000);

      // Check if the flow editor shows the form
      const flowEditor = page.locator('.react-flow');
      const flowEditorExists = (await flowEditor.count()) > 0;
      console.log('Flow editor exists:', flowEditorExists);

      if (flowEditorExists) {
        // Look for the test page node
        const testPageNode = page.locator('text="Test Page"');
        const testPageExists = (await testPageNode.count()) > 0;
        console.log('Test page node exists:', testPageExists);

        if (testPageExists) {
          console.log('✅ JSON to Flow synchronization working');

          // Test Flow to JSON synchronization
          await testPageNode.click();
          await page.waitForTimeout(1000);

          // Look for the node editor sidebar
          const sidebar = page.locator(
            '[class*="sidebar"], [data-testid*="sidebar"]'
          );
          const sidebarExists = (await sidebar.count()) > 0;
          console.log('Sidebar exists:', sidebarExists);

          if (sidebarExists && (await sidebar.isVisible())) {
            console.log('✅ Node editor sidebar is visible');

            // Look for JSON editing in the sidebar
            const sidebarTextarea = sidebar.locator('textarea').first();
            const sidebarTextareaExists = (await sidebarTextarea.count()) > 0;
            console.log('Sidebar textarea exists:', sidebarTextareaExists);

            if (sidebarTextareaExists && (await sidebarTextarea.isVisible())) {
              console.log('✅ JSON textarea found in sidebar');

              // Get current content
              const currentContent = await sidebarTextarea.inputValue();
              console.log(
                'Current sidebar content length:',
                currentContent.length
              );

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
        } else {
          console.log('❌ Test page node not found in flow editor');
        }
      } else {
        console.log('❌ Flow editor not found');
      }
    } else {
      console.log('❌ View mode buttons not found after Import Form');
    }
  } else {
    console.log('❌ Import Form button not found or not visible');
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-import-form.png' });
});
