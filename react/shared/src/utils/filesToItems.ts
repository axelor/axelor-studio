/**
 * Converts a FileList into an array of upload item descriptors with
 * progress tracking metadata.
 */
interface UploadItem {
  file: File;
  index: number;
  progress: number;
  cancelled: boolean;
  completed: boolean;
  chunkProgress: number[];
  error: boolean;
  totalUploaded: number;
}

export function filesToItems(files: FileList | File[], maxFiles: number): UploadItem[] {
  const CHUNK_SIZE = 512 * 1024;
  return Array.prototype.slice
    .call(files)
    .slice(0, maxFiles)
    .map((f: File, i: number) => ({
      file: f,
      index: i,
      progress: 0,
      cancelled: false,
      completed: false,
      chunkProgress: new Array(Math.floor(f.size / CHUNK_SIZE) + 1).fill(0),
      error: false,
      totalUploaded: 0,
    }));
}
