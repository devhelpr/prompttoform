import JSZip from 'jszip';
import { FormComponentFieldProps } from '@devhelpr/react-forms';

interface UIJson {
  app: {
    title: string;
    pages: Array<{
      id: string;
      title: string;
      route: string;
      layout?: string;
      components: FormComponentFieldProps[];
      isEndPage?: boolean;
    }>;
    dataSources?: Array<{
      type: string;
      [key: string]: unknown;
    }>;
  };
}

function generateHiddenFormFields(
  components: FormComponentFieldProps[]
): string {
  let html = '';

  for (const component of components) {
    if (component.type === 'section' && component.children) {
      html += generateHiddenFormFields(component.children);
    } else if (component.type === 'array' && component.children) {
      html += generateHiddenFormFields(component.children);
    } else if (component.type === 'form' && component.children) {
      html += generateHiddenFormFields(component.children);
    } else if (component.type === 'input') {
      const inputType = component.props?.inputType || 'text';
      html += `<input type="${inputType}" name="${component.id}" class="hidden" />\n`;
    } else if (component.type === 'textarea') {
      html += `<textarea name="${component.id}" class="hidden"></textarea>\n`;
    } else if (component.type === 'checkbox') {
      html += `<input type="checkbox" name="${component.id}" class="hidden" />\n`;
    } else if (component.type === 'radio') {
      html += `<input type="text" name="${component.id}" class="hidden" />\n`;
    } else if (component.type === 'select') {
      html += `<input type="text" name="${component.id}" class="hidden" />\n`;
    } else if (component.type === 'date') {
      html += `<input type="text" name="${component.id}" class="hidden" />\n`;
    }
  }

  return html;
}

function addHiddenFormToHtml(htmlContent: string, formFields: string): string {
  // Find the closing </body> tag and insert the hidden form before it
  const bodyCloseIndex = htmlContent.lastIndexOf('</body>');

  if (bodyCloseIndex === -1) {
    // If no </body> tag found, append to the end
    return (
      htmlContent +
      `\n<form data-netlify="true" class="hidden">\n${formFields}</form>\n`
    );
  }

  const hiddenForm = `\n  <form name="example-form" data-netlify="true" class="hidden">\n${formFields}  </form>\n`;

  return (
    htmlContent.slice(0, bodyCloseIndex) +
    hiddenForm +
    htmlContent.slice(bodyCloseIndex)
  );
}

export async function createFormZip(generatedJson: string): Promise<Blob> {
  try {
    // Load the template zip file
    const response = await fetch('/react-form.zip');
    if (!response.ok) {
      throw new Error('Failed to load template zip file');
    }

    const templateZipBlob = await response.blob();
    const zip = new JSZip();

    // Load the template zip
    const templateZip = await JSZip.loadAsync(templateZipBlob);

    // Parse the generated JSON to extract form fields
    const parsedJson: UIJson = JSON.parse(generatedJson);
    let allFormFields = '';

    // Extract all form fields from all pages
    for (const page of parsedJson.app.pages) {
      allFormFields += generateHiddenFormFields(page.components);
    }

    // Copy all files from template zip to new zip
    for (const [filename, file] of Object.entries(templateZip.files)) {
      if (!file.dir) {
        let content = await file.async('blob');

        // If this is the index.html file, add the hidden form
        if (filename === 'index.html') {
          const htmlContent = await file.async('string');
          const modifiedHtml = addHiddenFormToHtml(htmlContent, allFormFields);
          content = new Blob([modifiedHtml], { type: 'text/html' });
        }

        zip.file(filename, content);
      }
    }

    // Replace the example-form.json with the generated JSON
    zip.file('example-form.json', generatedJson);

    // Generate the final zip file
    const finalZipBlob = await zip.generateAsync({ type: 'blob' });

    return finalZipBlob;
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw new Error('Failed to create zip file');
  }
}

export function downloadZip(blob: Blob, filename = 'react-form.zip'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
