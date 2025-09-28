import { test, expect } from '@playwright/test';

test.describe('Flow Editor Sync - Connection Preservation', () => {
  test('should preserve nextPage connections when syncing from flow editor to main editor', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a form with explicit nextPage connections
    const formWithConnections = {
      app: {
        title: 'Connection Test Form',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
        },
        pages: [
          {
            id: 'page1',
            title: 'First Page',
            route: '/page1',
            components: [
              {
                id: 'field1',
                type: 'input',
                label: 'First Field',
                props: { inputType: 'text' },
              },
            ],
            nextPage: 'page2', // Explicit connection
          },
          {
            id: 'page2',
            title: 'Second Page',
            route: '/page2',
            components: [
              {
                id: 'field2',
                type: 'input',
                label: 'Second Field',
                props: { inputType: 'text' },
              },
            ],
            nextPage: 'page3', // Explicit connection
          },
          {
            id: 'page3',
            title: 'Third Page',
            route: '/page3',
            components: [
              {
                id: 'field3',
                type: 'input',
                label: 'Third Field',
                props: { inputType: 'text' },
              },
            ],
          },
        ],
      },
    };

    // Import the form
    const importJsonButton = page
      .locator('button:has-text("Import JSON")')
      .first();
    await importJsonButton.click();
    await page.waitForTimeout(2000);

    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await jsonTextarea.clear();
    await jsonTextarea.fill(JSON.stringify(formWithConnections, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Switch to Flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Verify the flow editor loaded with nodes
    const flowNodes = page.locator('.react-flow__node');
    const nodeCount = await flowNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
    console.log(`✅ Flow editor loaded with ${nodeCount} nodes`);

    // Switch back to JSON view to check if connections are preserved
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(2000);

    // Get the current JSON content
    const currentJsonText = await jsonTextarea.inputValue();
    const currentForm = JSON.parse(currentJsonText);

    console.log(
      'Current form after flow sync:',
      JSON.stringify(currentForm, null, 2)
    );

    // Check if nextPage connections are preserved
    const page1 = currentForm.app.pages.find((p: any) => p.id === 'page1');
    const page2 = currentForm.app.pages.find((p: any) => p.id === 'page2');
    const page3 = currentForm.app.pages.find((p: any) => p.id === 'page3');

    console.log('Page1 nextPage:', page1?.nextPage);
    console.log('Page2 nextPage:', page2?.nextPage);
    console.log('Page3 nextPage:', page3?.nextPage);

    // Verify connections are preserved
    expect(page1?.nextPage).toBe('page2');
    expect(page2?.nextPage).toBe('page3');
    expect(page3?.nextPage).toBeUndefined();

    console.log('✅ nextPage connections preserved after flow sync');
  });

  test('should preserve branch connections when syncing from flow editor to main editor', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a form with branch connections
    const formWithBranches = {
      app: {
        title: 'Branch Test Form',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
        },
        pages: [
          {
            id: 'page1',
            title: 'First Page',
            route: '/page1',
            components: [
              {
                id: 'field1',
                type: 'input',
                label: 'First Field',
                props: { inputType: 'text' },
              },
            ],
            branches: [
              {
                condition: {
                  field: 'field1',
                  operator: '==',
                  value: 'yes',
                },
                nextPage: 'page2',
              },
              {
                condition: {
                  field: 'field1',
                  operator: '==',
                  value: 'no',
                },
                nextPage: 'page3',
              },
            ],
          },
          {
            id: 'page2',
            title: 'Yes Page',
            route: '/page2',
            components: [
              {
                id: 'field2',
                type: 'input',
                label: 'Yes Field',
                props: { inputType: 'text' },
              },
            ],
          },
          {
            id: 'page3',
            title: 'No Page',
            route: '/page3',
            components: [
              {
                id: 'field3',
                type: 'input',
                label: 'No Field',
                props: { inputType: 'text' },
              },
            ],
          },
        ],
      },
    };

    // Import the form
    const importJsonButton = page
      .locator('button:has-text("Import JSON")')
      .first();
    await importJsonButton.click();
    await page.waitForTimeout(2000);

    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await jsonTextarea.clear();
    await jsonTextarea.fill(JSON.stringify(formWithBranches, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Switch to Flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Verify the flow editor loaded with nodes
    const flowNodes = page.locator('.react-flow__node');
    const nodeCount = await flowNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
    console.log(`✅ Flow editor loaded with ${nodeCount} nodes`);

    // Switch back to JSON view to check if branches are preserved
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(2000);

    // Get the current JSON content
    const currentJsonText = await jsonTextarea.inputValue();
    const currentForm = JSON.parse(currentJsonText);

    console.log(
      'Current form after flow sync:',
      JSON.stringify(currentForm, null, 2)
    );

    // Check if branch connections are preserved
    const page1 = currentForm.app.pages.find((p: any) => p.id === 'page1');

    console.log('Page1 branches:', JSON.stringify(page1?.branches, null, 2));

    // Verify branches are preserved
    expect(page1?.branches).toBeDefined();
    expect(page1?.branches).toHaveLength(2);
    expect(page1?.branches[0].nextPage).toBe('page2');
    expect(page1?.branches[1].nextPage).toBe('page3');
    expect(page1?.branches[0].condition.field).toBe('field1');
    expect(page1?.branches[1].condition.field).toBe('field1');

    console.log('✅ Branch connections preserved after flow sync');
  });

  test('should preserve connections when adding new nodes in flow editor', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
      timeout: 10000,
    });

    // Load a simple form
    const simpleForm = {
      app: {
        title: 'Simple Form',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
        },
        pages: [
          {
            id: 'page1',
            title: 'First Page',
            route: '/page1',
            components: [
              {
                id: 'field1',
                type: 'input',
                label: 'First Field',
                props: { inputType: 'text' },
              },
            ],
            nextPage: 'page2',
          },
          {
            id: 'page2',
            title: 'Second Page',
            route: '/page2',
            components: [
              {
                id: 'field2',
                type: 'input',
                label: 'Second Field',
                props: { inputType: 'text' },
              },
            ],
          },
        ],
      },
    };

    // Import the form
    const importJsonButton = page
      .locator('button:has-text("Import JSON")')
      .first();
    await importJsonButton.click();
    await page.waitForTimeout(2000);

    const jsonTextarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await jsonTextarea.clear();
    await jsonTextarea.fill(JSON.stringify(simpleForm, null, 2));
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Import Form")');
    await page.waitForTimeout(3000);

    // Switch to Flow view
    await page.click('button:has-text("View Flow")');
    await page.waitForTimeout(2000);

    // Add a new node
    const createNodeButton = page.locator('button:has-text("Create Node")');
    await createNodeButton.click();
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[placeholder*="title"]');
    await titleInput.fill('New Page');

    const fieldsTextarea = page.locator('textarea[placeholder*="fields"]');
    await fieldsTextarea.fill('New Field');

    const createButton = page.locator('button:has-text("Create")');
    await createButton.click();
    await page.waitForTimeout(2000);

    // Switch back to JSON view to check if original connections are preserved
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(2000);

    // Get the current JSON content
    const currentJsonText = await jsonTextarea.inputValue();
    const currentForm = JSON.parse(currentJsonText);

    console.log(
      'Current form after adding node:',
      JSON.stringify(currentForm, null, 2)
    );

    // Check if original connections are preserved
    const page1 = currentForm.app.pages.find((p: any) => p.id === 'page1');
    const page2 = currentForm.app.pages.find((p: any) => p.id === 'page2');

    console.log('Page1 nextPage after adding node:', page1?.nextPage);
    console.log('Page2 nextPage after adding node:', page2?.nextPage);

    // The original connection should still be preserved
    expect(page1?.nextPage).toBe('page2');

    console.log('✅ Original connections preserved after adding new node');
  });
});
