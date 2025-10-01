import { test, expect } from '@playwright/test';

test.describe('Form Node Indexing Improvements', () => {
  test('should maintain logical page order when adding nodes before existing pages', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Load the simple slider form
    const sliderFormJson = {
      app: {
        title: 'Simple Slider Test',
        version: '1.0.0',
        language: 'en',
        theme: 'default',
        settings: {
          showProgressBar: true,
          showStepNumbers: true,
          allowBackNavigation: true,
          submitButtonText: 'Submit',
          nextButtonText: 'Next',
          previousButtonText: 'Previous',
          showRestartButton: true,
          restartButtonText: 'Restart',
        },
        pages: [
          {
            id: 'page1',
            title: 'Slider Addition Test',
            route: '/slider-test',
            components: [
              {
                id: 'slider1',
                type: 'slider-range',
                label: 'First Number',
                props: {
                  min: 0,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Move this slider to change the first number',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'slider2',
                type: 'slider-range',
                label: 'Second Number',
                props: {
                  min: 0,
                  max: 100,
                  step: 1,
                  showLabels: true,
                  showValue: true,
                  mode: 'single',
                  helperText: 'Move this slider to change the second number',
                },
                validation: {
                  required: true,
                },
              },
              {
                id: 'sum',
                type: 'input',
                label: 'Sum (Readonly)',
                props: {
                  inputType: 'number',
                  readOnly: true,
                  helperText:
                    'This field shows the sum of the two sliders above',
                },
                expression: {
                  expression: 'slider1.value + slider2.value',
                  mode: 'value',
                  dependencies: ['slider1', 'slider2'],
                  evaluateOnChange: true,
                },
              },
            ],
          },
        ],
        thankYouPage: {
          title: 'Test Complete!',
          message: 'Thank you for testing the simple slider addition form.',
          showRestartButton: true,
        },
      },
    };

    // Switch to JSON view and load the form
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(1000);

    // Clear the textarea and paste the slider form JSON
    const textarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await textarea.clear();
    await textarea.fill(JSON.stringify(sliderFormJson, null, 2));

    // Switch back to Flow view
    await page.click('button:has-text("Flow")');
    await page.waitForTimeout(2000);

    // Wait for the flow to load
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(1000);

    // Verify initial state - should show "Step 1 of 1" since there's only one page
    const stepIndicator = page.locator('text=Step 1 of 1');
    await expect(stepIndicator).toBeVisible();

    // Close the preview sidebar
    await previewButton.click();
    await page.waitForTimeout(1000);

    // Now add a new node before the existing page
    // Click the "Create Node" button
    const createNodeButton = page.locator('button:has-text("Create Node")');
    await createNodeButton.click();
    await page.waitForTimeout(1000);

    // Fill in the new node details
    const titleInput = page.locator('input[placeholder*="title"]');
    await titleInput.fill('Introduction Page');

    const fieldsTextarea = page.locator('textarea[placeholder*="fields"]');
    await fieldsTextarea.fill('Name, Email');

    // Create the node
    const createButton = page.locator('button:has-text("Create")');
    await createButton.click();
    await page.waitForTimeout(2000);

    // Wait for the new node to appear
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    // Get all nodes to verify we have 2 nodes now
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBe(2);

    // Now we need to connect the new node to the existing slider page
    // First, let's find the new node (it should be the one with "Introduction Page" title)
    const newNode = page
      .locator('.react-flow__node')
      .filter({ hasText: 'Introduction Page' });
    const existingNode = page
      .locator('.react-flow__node')
      .filter({ hasText: 'Slider Addition Test' });

    // Get the positions of both nodes
    const newNodeBox = await newNode.boundingBox();
    const existingNodeBox = await existingNode.boundingBox();

    if (newNodeBox && existingNodeBox) {
      // Click and drag from the new node's output handle to the existing node's input handle
      const newNodeOutputX = newNodeBox.x + newNodeBox.width - 10;
      const newNodeOutputY = newNodeBox.y + newNodeBox.height / 2;

      const existingNodeInputX = existingNodeBox.x + 10;
      const existingNodeInputY = existingNodeBox.y + existingNodeBox.height / 2;

      // Start drag from new node output
      await page.mouse.move(newNodeOutputX, newNodeOutputY);
      await page.mouse.down();

      // Drag to existing node input
      await page.mouse.move(existingNodeInputX, existingNodeInputY);
      await page.mouse.up();

      await page.waitForTimeout(1000);
    }

    // Now open the preview sidebar again to check the step indicators
    await previewButton.click();
    await page.waitForTimeout(2000);

    // The form should now show "Step 1 of 2" since we added a page before the slider page
    // The logical order should be: Introduction Page (Step 1) -> Slider Addition Test (Step 2)
    const stepIndicator1 = page.locator('text=Step 1 of 2');
    await expect(stepIndicator1).toBeVisible();

    // Verify we're on the first page (Introduction Page)
    const pageTitle = page.locator('h2, h3').first();
    const pageTitleText = await pageTitle.textContent();
    expect(pageTitleText).toContain('Introduction Page');

    // Navigate to the next page
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Should now show "Step 2 of 2"
    const stepIndicator2 = page.locator('text=Step 2 of 2');
    await expect(stepIndicator2).toBeVisible();

    // Verify we're on the slider page
    const sliderPageTitle = page.locator('h2, h3').first();
    const sliderPageTitleText = await sliderPageTitle.textContent();
    expect(sliderPageTitleText).toContain('Slider Addition Test');

    // Navigate back to the first page
    const previousButton = page.locator('button:has-text("Previous")');
    await previousButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 1 of 2" again
    await expect(stepIndicator1).toBeVisible();

    // Verify we're back on the introduction page
    const backToIntroTitle = page.locator('h2, h3').first();
    const backToIntroTitleText = await backToIntroTitle.textContent();
    expect(backToIntroTitleText).toContain('Introduction Page');

    console.log(
      '✅ Form node indexing test passed! The logical page order is working correctly.'
    );
  });

  test('should handle complex branching flows with correct logical ordering', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Load a form with branching logic
    const branchingFormJson = {
      app: {
        title: 'Branching Form Test',
        pages: [
          {
            id: 'page1',
            title: 'First Page',
            route: '/page1',
            components: [
              {
                id: 'question1',
                type: 'input',
                label: 'What is your name?',
                props: {
                  inputType: 'text',
                  placeholder: 'Enter your name',
                },
                validation: { required: true },
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
                id: 'question2',
                type: 'input',
                label: 'What is your age?',
                props: {
                  inputType: 'number',
                  placeholder: 'Enter your age',
                },
                validation: { required: true },
              },
            ],
            branches: [
              {
                condition: {
                  field: 'question2',
                  operator: '>=',
                  value: '18',
                },
                nextPage: 'page3',
              },
              {
                condition: {
                  field: 'question2',
                  operator: '<',
                  value: '18',
                },
                nextPage: 'page4',
              },
            ],
          },
          {
            id: 'page3',
            title: 'Adult Page',
            route: '/page3',
            components: [
              {
                id: 'question3',
                type: 'input',
                label: 'What is your occupation?',
                props: {
                  inputType: 'text',
                  placeholder: 'Enter your occupation',
                },
                validation: { required: true },
              },
            ],
            isEndPage: true,
          },
          {
            id: 'page4',
            title: 'Minor Page',
            route: '/page4',
            components: [
              {
                id: 'question4',
                type: 'input',
                label: 'What grade are you in?',
                props: {
                  inputType: 'text',
                  placeholder: 'Enter your grade',
                },
                validation: { required: true },
              },
            ],
            isEndPage: true,
          },
        ],
      },
    };

    // Switch to JSON view and load the form
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(1000);

    const textarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await textarea.clear();
    await textarea.fill(JSON.stringify(branchingFormJson, null, 2));

    // Switch back to Flow view
    await page.click('button:has-text("Flow")');
    await page.waitForTimeout(2000);

    // Wait for the flow to load
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 1 of 4" (logical order: page1 -> page2 -> page3/page4)
    const stepIndicator = page.locator('text=Step 1 of 4');
    await expect(stepIndicator).toBeVisible();

    // Verify we're on the first page
    const pageTitle = page.locator('h2, h3').first();
    const pageTitleText = await pageTitle.textContent();
    expect(pageTitleText).toContain('First Page');

    console.log(
      '✅ Complex branching flow test passed! The logical page order correctly handles branching flows.'
    );
  });

  test('should maintain correct step indicators when pages are in wrong array order', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Load a form where pages are in the wrong array order but have correct logical flow
    const wrongOrderFormJson = {
      app: {
        title: 'Wrong Order Test',
        pages: [
          {
            id: 'page3',
            title: 'Third Page',
            route: '/page3',
            components: [
              {
                id: 'question3',
                type: 'input',
                label: 'Third question?',
                props: { inputType: 'text' },
                validation: { required: true },
              },
            ],
          },
          {
            id: 'page1',
            title: 'First Page',
            route: '/page1',
            components: [
              {
                id: 'question1',
                type: 'input',
                label: 'First question?',
                props: { inputType: 'text' },
                validation: { required: true },
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
                id: 'question2',
                type: 'input',
                label: 'Second question?',
                props: { inputType: 'text' },
                validation: { required: true },
              },
            ],
            nextPage: 'page3',
          },
        ],
      },
    };

    // Switch to JSON view and load the form
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(1000);

    const textarea = page.locator(
      'textarea[placeholder*="JSON form definition"]'
    );
    await textarea.clear();
    await textarea.fill(JSON.stringify(wrongOrderFormJson, null, 2));

    // Switch back to Flow view
    await page.click('button:has-text("Flow")');
    await page.waitForTimeout(2000);

    // Wait for the flow to load
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    // Open the form preview sidebar
    const previewButton = page.locator('button:has-text("Preview")');
    await previewButton.click();
    await page.waitForTimeout(1000);

    // Should show "Step 1 of 3" and be on the first page (logically, not by array order)
    const stepIndicator = page.locator('text=Step 1 of 3');
    await expect(stepIndicator).toBeVisible();

    // Verify we're on the first page (logically)
    const pageTitle = page.locator('h2, h3').first();
    const pageTitleText = await pageTitle.textContent();
    expect(pageTitleText).toContain('First Page');

    console.log(
      '✅ Wrong array order test passed! The logical page order correctly handles pages in wrong array order.'
    );
  });
});
