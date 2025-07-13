import JSZip from 'jszip';

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

    // Copy all files from template zip to new zip
    for (const [filename, file] of Object.entries(templateZip.files)) {
      if (!file.dir) {
        const content = await file.async('blob');
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
