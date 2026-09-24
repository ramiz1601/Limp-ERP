/**
 * Utility for handling file uploads, image compression, and PDF handling for Firestore storage.
 */

export interface UploadedFilePayload {
  fileUrl: string; // Base64 data URL
  fileName: string;
  fileSize?: number;
  fileType?: string;
}

/**
 * Compresses image file to fit well within Firestore document limits (< 600KB base64).
 * If the file is a PDF or other document, keeps original if within reasonable size limit (< 900KB).
 */
export async function processUploadedFile(file: File): Promise<UploadedFilePayload> {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              fileUrl: e.target?.result as string,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve({
            fileUrl: compressedDataUrl,
            fileName: file.name,
            fileSize: Math.round((compressedDataUrl.length * 3) / 4),
            fileType: 'image/jpeg',
          });
        };
        img.onerror = () => {
          resolve({
            fileUrl: e.target?.result as string,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Non-image (e.g. PDF)
  return new Promise((resolve, reject) => {
    // Check if PDF is larger than 900KB
    if (file.size > 900 * 1024) {
      console.warn(`File "${file.name}" is larger than 900KB. PDFs over 900KB may encounter database document size limits.`);
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        fileUrl: reader.result as string,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
