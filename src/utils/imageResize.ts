import imageCompression from "browser-image-compression";

export async function resizeImage(file: File): Promise<File> {
  // Only process image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const options = {
    maxSizeMB: 1,           // ไม่เกิน 1MB
    maxWidthOrHeight: 1600, // จำกัดความกว้าง/สูง
    useWebWorker: false,    // Disabled for LINE WebView compatibility
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Ensure the new file has the same name as the original
    return new File([compressedFile], file.name, {
      type: compressedFile.type || file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Resize image error:", error);
    return file; // fallback to original file
  }
}
