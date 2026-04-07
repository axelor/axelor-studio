/**
 * Extracts the raw File/Blob from an upload item descriptor.
 */
export function getAttachmentBlob(file: { file: File | Blob }): File | Blob {
  return file.file;
}
