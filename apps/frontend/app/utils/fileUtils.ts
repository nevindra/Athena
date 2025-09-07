// Utility functions for file processing on frontend

export interface FileData {
  name: string;
  type: string;
  data: string; // base64 encoded
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function filesToFileData(files: File[]): Promise<FileData[]> {
  const fileDataPromises = files.map(async (file) => {
    const base64 = await fileToBase64(file);
    return {
      name: file.name,
      type: file.type,
      data: base64,
    };
  });

  return Promise.all(fileDataPromises);
}

export function isImageFile(fileType: string): boolean {
  return fileType.startsWith("image/");
}

export function validateImageFile(file: FileData): boolean {
  if (!isImageFile(file.type)) {
    return false;
  }

  // Check if it's a supported image format for Gemini
  const supportedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
  ];

  return supportedTypes.includes(file.type);
}
