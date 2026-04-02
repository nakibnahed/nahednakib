import imageCompression from "browser-image-compression";

/**
 * Client-side resize/compress before upload. Falls back to the original file on failure.
 * @param {File} file
 * @param {{ maxSizeMB?: number, maxWidthOrHeight?: number }} [options]
 * @returns {Promise<File>}
 */
export async function optimizeImageFile(file, options = {}) {
  if (!file || !(file instanceof Blob)) {
    return file;
  }
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB ?? 1,
      maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
      useWebWorker: true,
      fileType: file.type || "image/jpeg",
    });
    const name =
      file instanceof File && file.name
        ? file.name
        : `image-${Date.now()}.jpg`;
    if (compressed instanceof File) {
      return compressed;
    }
    return new File([compressed], name, {
      type: compressed.type || file.type || "image/jpeg",
    });
  } catch (err) {
    console.warn("optimizeImageFile:", err);
    return file instanceof File ? file : new File([file], "image.jpg", { type: file.type });
  }
}
