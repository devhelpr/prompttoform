import { test, expect } from '@playwright/test';

test('Sync Engine Translation Fix Test', async ({ page }) => {
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

  // Load a sample form first
  await page.click('button:has-text("Examples")');
  await page.waitForTimeout(1000);

  // Click on the first example form
  await page.click('button:has-text("Simple Contact Form")');
  await page.waitForTimeout(3000);

  // Switch to JSON view to manually add translations
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(1000);

  const jsonTextarea = page.locator(
    'textarea[placeholder*="JSON form definition"]'
  );

  // Wait for the textarea to be populated
  await page.waitForTimeout(2000);

  const currentJson = await jsonTextarea.inputValue();
  console.log('Current JSON length:', currentJson.length);
  console.log('Current JSON preview:', currentJson.substring(0, 200));

  if (currentJson.length === 0) {
    console.log('JSON textarea is empty, waiting longer...');
    await page.waitForTimeout(3000);
    const retryJson = await jsonTextarea.inputValue();
    console.log('Retry JSON length:', retryJson.length);
    if (retryJson.length === 0) {
      throw new Error('JSON textarea is still empty after waiting');
    }
  }

  const currentForm = JSON.parse(currentJson);

  // Add translations to the form
  const formWithTranslations = {
    ...currentForm,
    translations: {
      es: {
        app: { title: 'Formulario de Contacto Simple' },
        pages: [
          {
            id: 'contact-page',
            title: 'Página de Contacto',
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
              {
                id: 'message',
                label: 'Mensaje',
                props: { placeholder: 'Ingrese su mensaje' },
              },
            ],
          },
        ],
      },
      fr: {
        app: { title: 'Formulaire de Contact Simple' },
        pages: [
          {
            id: 'contact-page',
            title: 'Page de Contact',
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
              {
                id: 'message',
                label: 'Message',
                props: { placeholder: 'Entrez votre message' },
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

  // Update the JSON with translations
  await jsonTextarea.clear();
  await jsonTextarea.fill(JSON.stringify(formWithTranslations, null, 2));
  await page.waitForTimeout(1000);

  // Click Update Preview to apply the changes
  await page.click('button:has-text("Update Preview")');
  await page.waitForTimeout(2000);

  // Verify translations are present before sync
  const jsonBeforeSync = await jsonTextarea.inputValue();
  const formBeforeSync = JSON.parse(jsonBeforeSync);
  console.log('=== BEFORE SYNC ===');
  console.log('Form has translations:', !!formBeforeSync.translations);
  console.log(
    'Spanish translations present:',
    !!formBeforeSync.translations?.es
  );
  console.log(
    'French translations present:',
    !!formBeforeSync.translations?.fr
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
    pageData.title = 'Modified Contact Page';
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

  // Switch back to JSON view to check translations
  await page.click('button:has-text("JSON")');
  await page.waitForTimeout(1000);

  // Check if translations are preserved
  const finalJson = await jsonTextarea.inputValue();
  const finalForm = JSON.parse(finalJson);

  console.log('=== AFTER SYNC ===');
  console.log('Form has translations:', !!finalForm.translations);
  console.log('Spanish translations present:', !!finalForm.translations?.es);
  console.log('French translations present:', !!finalForm.translations?.fr);

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
  const modifiedTitle = page.locator('text="Modified Contact Page"');
  const modifiedTitleExists = (await modifiedTitle.count()) > 0;
  console.log('Modified title found:', modifiedTitleExists);

  // Verify translations are preserved
  const translationsPreserved = !!(
    finalForm.translations &&
    finalForm.translations.es &&
    finalForm.translations.fr &&
    finalForm.translations.es.app?.title === 'Formulario de Contacto Simple' &&
    finalForm.translations.fr.app?.title === 'Formulaire de Contact Simple'
  );

  if (translationsPreserved) {
    console.log('✅ SUCCESS: Translations preserved during sync!');
  } else {
    console.log('❌ FAILED: Translations lost during sync!');
    console.log('Expected Spanish title: Formulario de Contacto Simple');
    console.log('Expected French title: Formulaire de Contact Simple');
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-sync-translation-fix.png' });

  // Assert that translations are preserved
  expect(translationsPreserved).toBe(true);
});
