/**
 * Merges two arrays of models (meta models and meta JSON models) into one.
 * Returns undefined if both arrays are empty, otherwise concatenates or
 * returns whichever is non-empty.
 */
export function mergeModels<T>(
  metaModels: T[] | null | undefined,
  metaJsonModels: T[] | null | undefined,
): T[] | undefined {
  if (metaModels?.length === 0 && metaJsonModels?.length === 0) return;

  return metaModels?.length &&
    metaModels.length > 0 &&
    metaJsonModels?.length &&
    metaJsonModels.length > 0
    ? metaModels.concat(metaJsonModels)
    : metaModels?.length && metaModels.length > 0
      ? metaModels
      : metaJsonModels?.length && metaJsonModels.length > 0
        ? metaJsonModels
        : [];
}
