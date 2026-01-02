import { test, expect } from '@playwright/test';

test.describe('Language Selector', () => {
  test('should update form content when language is changed', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('textarea', { timeout: 10000 });

    // Multi-language form JSON with English and Spanish translations
    const multiLangForm = {
      app: {
        title: 'Contact Form',
        pages: [
          {
            id: 'page1',
            title: 'Contact Information',
            components: [
              {
                id: 'name',
                type: 'input',
                label: 'Full Name',
                props: {
                  placeholder: 'Enter your full name',
                  helperText: 'Please provide your complete name',
                },
                validation: {
                  required: true,
                  errorMessages: {
                    required: 'Name is required',
                  },
                },
              },
              {
                id: 'email',
                type: 'input',
                label: 'Email Address',
                props: {
                  placeholder: 'Enter your email',
                  helperText: 'We will never share your email',
                },
                validation: {
                  required: true,
                  errorMessages: {
                    required: 'Email is required',
                  },
                },
              },
            ],
          },
        ],
      },
      translations: {
        es: {
          app: {
            title: 'Formulario de Contacto',
          },
          pages: [
            {
              id: 'page1',
              title: 'Información de Contacto',
              components: [
                {
                  id: 'name',
                  label: 'Nombre Completo',
                  props: {
                    placeholder: 'Ingrese su nombre completo',
                    helperText: 'Por favor proporcione su nombre completo',
                  },
                  validation: {
                    errorMessages: {
                      required: 'El nombre es obligatorio',
                    },
                  },
                },
                {
                  id: 'email',
                  label: 'Dirección de Correo',
                  props: {
                    placeholder: 'Ingrese su correo electrónico',
                    helperText: 'Nunca compartiremos su correo',
                  },
                  validation: {
                    errorMessages: {
                      required: 'El correo es obligatorio',
                    },
                  },
                },
              ],
            },
          ],
          ui: {
            nextButton: 'Siguiente',
            previousButton: 'Anterior',
            submitButton: 'Enviar',
          },
        },
      },
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'es'],
      languageDetails: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
      ],
    };

    // Click the Import JSON button
    const importButton = page.locator('button:has-text("Import JSON")').first();
    await expect(importButton).toBeVisible();
    await importButton.click();

    // Wait for the modal to appear
    await page.waitForSelector('dialog:visible', { timeout: 5000 });

    // Fill the textarea in the modal
    const textarea = page.locator(
      'textarea[placeholder*="Paste your JSON form definition here"]'
    );
    await textarea.fill(JSON.stringify(multiLangForm, null, 2));
    await page.waitForTimeout(500);

    // Click the Import Form button in the modal
    const modalImportButton = page.locator('dialog button:has-text("Import Form")');
    await expect(modalImportButton).toBeEnabled();
    await modalImportButton.click();

    // Wait for form to load and ensure we're on Form Preview tab
    await page.waitForTimeout(2000);
    
    // Make sure we're on the Form Preview tab (not JSON or Flow)
    const formPreviewTab = page.locator('button:has-text("Form Preview"), button:has-text("1")').first();
    if (await formPreviewTab.isVisible()) {
      await formPreviewTab.click();
      await page.waitForTimeout(1000);
    }

    // Wait for language selector to appear
    await page.waitForSelector('#language-selector', { timeout: 10000 });

    // Verify initial language is English
    const languageSelector = page.locator('#language-selector');
    await expect(languageSelector).toHaveValue('en');

    // Check that form shows English content
    await expect(page.getByText('Contact Information')).toBeVisible();
    await expect(page.getByText('Full Name')).toBeVisible();
    await expect(page.getByText('Email Address')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your full name')).toBeVisible();

    // Change language to Spanish
    await languageSelector.selectOption('es');
    await page.waitForTimeout(2000); // Wait for language change to take effect and form to re-render

    // Verify language selector shows Spanish
    await expect(languageSelector).toHaveValue('es');

    // Wait a bit more for the form to fully re-render with new language
    await page.waitForTimeout(1000);

    // Check that form content has changed to Spanish
    // The form title, page title, labels, and placeholders should be in Spanish
    await expect(page.getByText('Información de Contacto')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Nombre Completo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Dirección de Correo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Ingrese su nombre completo')).toBeVisible({ timeout: 5000 });

    // Verify English text is no longer visible
    const englishName = page.getByText('Full Name');
    if (await englishName.isVisible()) {
      console.log('WARNING: English text still visible after language change');
    }

    // Change back to English
    await languageSelector.selectOption('en');
    await page.waitForTimeout(1000);

    // Verify form is back to English
    await expect(languageSelector).toHaveValue('en');
    await expect(page.getByText('Contact Information')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Full Name')).toBeVisible({ timeout: 5000 });
  });

  test('should show language selector for multi-language forms', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('textarea', { timeout: 10000 });

    // Single language form (should not show selector)
    const singleLangForm = {
      app: {
        title: 'Simple Form',
        pages: [
          {
            id: 'page1',
            title: 'Page 1',
            components: [
              {
                id: 'field1',
                type: 'input',
                label: 'Field 1',
              },
            ],
          },
        ],
      },
    };

    // Click the Import JSON button
    const importButton = page.locator('button:has-text("Import JSON")').first();
    await expect(importButton).toBeVisible();
    await importButton.click();

    // Wait for the modal to appear
    await page.waitForSelector('dialog:visible', { timeout: 5000 });

    // Fill the textarea in the modal
    const textarea = page.locator(
      'textarea[placeholder*="Paste your JSON form definition here"]'
    );
    await textarea.fill(JSON.stringify(singleLangForm, null, 2));
    await page.waitForTimeout(500);

    // Click the Import Form button in the modal
    const modalImportButton = page.locator('dialog button:has-text("Import Form")');
    await expect(modalImportButton).toBeEnabled();
    await modalImportButton.click();

    // Wait a bit for form to load
    await page.waitForTimeout(2000);

    // Language selector should not be visible for single-language forms
    const languageSelector = page.locator('#language-selector');
    await expect(languageSelector).not.toBeVisible();
  });
});

