/**
 * Convert any Blob into a Base64 string (no “data:” prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is something like "data:application/zip;base64,ABCD..."
      const dataUrl = reader.result as string;
      // strip off the “data:*/*;base64,” part
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
