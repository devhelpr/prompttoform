import { test, expect } from '@playwright/test';

test('Translation Synchronization Test', async ({ page }) => {
  // Set up console logging
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const message = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(message);
    console.log(message);
  });

  // Navigate to the app
  await page.goto('http://localhost:4200');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Generate Forms with AI")', {
    timeout: 10000,
  });

  // Create a multi-language form with translations
  const multiLanguageForm = {
    app: {
      title: 'Multi-Language Test Form',
      pages: [
        {
          id: 'page1',
          title: 'Contact Information',
          route: '/contact',
          components: [
            {
              id: 'name',
              type: 'input',
              label: 'Name',
              props: {
                placeholder: 'Enter your name',
              },
              validation: {
                required: true,
              },
            },
            {
              id: 'email',
              type: 'input',
              label: 'Email',
              props: {
                placeholder: 'Enter your email',
              },
              validation: {
                required: true,
              },
            },
          ],
        },
      ],
    },
    translations: {
      es: {
        app: { title: 'Formulario de Prueba Multiidioma' },
        pages: [
          {
            id: 'page1',
            title: 'Información de Contacto',
            components: [
              {
                id: 'name',
                label: 'Nombre',
                props: { placeholder: 'Ingrese su nombre' },
              },
              {
                id: 'email',
                label: 'Correo Electrónico',
                props: { placeholder: 'Ingrese su correo electrónico' },
              },
            ],
          },
        ],
      },
      fr: {
        app: { title: 'Formulaire de Test Multilingue' },
        pages: [
          {
            id: 'page1',
            title: 'Informations de Contact',
            components: [
              {
                id: 'name',
                label: 'Nom',
                props: { placeholder: 'Entrez votre nom' },
              },
              {
                id: 'email',
                label: 'Email',
                props: { placeholder: 'Entrez votre email' },
              },
            ],
          },
        ],
      },
    },
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'fr'],
    languageDetails: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
    ],
  };

  // Import the multi-language form
  await page.click('button:has-text("Import JSON")');
  await page.waitForTimeout(2000);

  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );
  await jsonTextarea.clear();
  await jsonTextarea.fill(JSON.stringify(multiLanguageForm, null, 2));
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Import Form")');
  await page.waitForTimeout(3000);

  // Switch to JSON view to verify the form was imported
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(1000);

  // Verify the form was imported with translations
  const importedJson = await jsonTextarea.inputValue();
  console.log('Imported JSON length:', importedJson.length);
  console.log('Imported JSON preview:', importedJson.substring(0, 200));

  let importedForm;
  try {
    importedForm = JSON.parse(importedJson);
  } catch (error) {
    console.log('JSON parse error:', error);
    console.log('Raw JSON:', importedJson);
    throw error;
  }

  console.log(
    '✅ Form imported with translations:',
    !!importedForm.translations
  );
  console.log(
    '✅ Spanish translations present:',
    !!importedForm.translations?.es
  );
  console.log(
    '✅ French translations present:',
    !!importedForm.translations?.fr
  );

  // Navigate to flow editor
  await page.click('button:has-text("View/Edit Form Flow")');
  await page.waitForTimeout(2000);

  // Verify the flow editor is working
  const flowEditor = page.locator('.react-flow');
  await expect(flowEditor).toBeVisible({ timeout: 5000 });

  // Click on the first node to select it
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await page.waitForTimeout(1000);

  // Find the sidebar and modify the JSON
  const sidebar = page.locator(
    '.fixed.left-0.top-0.h-full.bg-white.shadow-lg.border-r.border-gray-200'
  );
  const sidebarTextarea = sidebar.locator('textarea').first();

  // Get current content and modify it
  const currentContent = await sidebarTextarea.inputValue();
  if (currentContent.length > 0) {
    const pageData = JSON.parse(currentContent);
    pageData.title = 'Modified Contact Information';
    const modifiedContent = JSON.stringify(pageData, null, 2);
    await sidebarTextarea.fill(modifiedContent);

    // Click save button
    const saveButton = sidebar
      .locator('button:has-text("Save"), button[type="submit"]')
      .first();
    await saveButton.click();
    await page.waitForTimeout(2000);
  }

  // Close the sidebar
  const hideEditorButton = page.locator('button:has-text("Hide Editor")');
  if (await hideEditorButton.isVisible()) {
    await hideEditorButton.click();
    await page.waitForTimeout(1000);
  }

  // Clear console messages before navigation
  consoleMessages.length = 0;

  // Click Back to Editor
  const backToEditorButton = page.locator('button:has-text("Back to Editor")');
  await backToEditorButton.click();
  await page.waitForTimeout(3000);

  // Check if translations are preserved
  const finalJson = await jsonTextarea.inputValue();
  const finalForm = JSON.parse(finalJson);

  console.log('=== TRANSLATION PRESERVATION CHECK ===');
  console.log('Final form has translations:', !!finalForm.translations);
  console.log('Spanish translations preserved:', !!finalForm.translations?.es);
  console.log('French translations preserved:', !!finalForm.translations?.fr);

  if (finalForm.translations?.es) {
    console.log('Spanish app title:', finalForm.translations.es.app?.title);
    console.log(
      'Spanish page title:',
      finalForm.translations.es.pages?.[0]?.title
    );
  }

  if (finalForm.translations?.fr) {
    console.log('French app title:', finalForm.translations.fr.app?.title);
    console.log(
      'French page title:',
      finalForm.translations.fr.pages?.[0]?.title
    );
  }

  // Check if the modified title appears
  const modifiedTitle = page.locator('text="Modified Contact Information"');
  const modifiedTitleExists = (await modifiedTitle.count()) > 0;
  console.log('Modified title found:', modifiedTitleExists);

  // Verify translations are preserved
  const translationsPreserved = !!(
    finalForm.translations &&
    finalForm.translations.es &&
    finalForm.translations.fr &&
    finalForm.translations.es.app?.title ===
      'Formulario de Prueba Multiidioma' &&
    finalForm.translations.fr.app?.title === 'Formulaire de Test Multilingue'
  );

  if (translationsPreserved) {
    console.log('✅ SUCCESS: Translations preserved during sync!');
  } else {
    console.log('❌ FAILED: Translations lost during sync!');
    console.log('Expected Spanish title: Formulario de Prueba Multiidioma');
    console.log('Expected French title: Formulaire de Test Multilingue');
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-translation-sync.png' });

  // Assert that translations are preserved
  expect(translationsPreserved).toBe(true);
});
