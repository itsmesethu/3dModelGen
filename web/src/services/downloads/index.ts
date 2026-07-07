/**
 * Download and file utilities for the web app.
 */

/**
 * Save GLB data to the user's device.
 */
export async function saveModel(glbData: string, fileName: string): Promise<void> {
  const binaryString = atob(glbData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert GLB base64 to a data URL for preview.
 */
export function glbToDataUrl(glbData: string): string {
  return `data:model/gltf-binary;base64,${glbData}`;
}

/**
 * Read a file as base64.
 */
export async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
