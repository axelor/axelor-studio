/**
 * Converts the first character of a string to lowercase.
 */
export function lowerCaseFirstLetter(str: string | null | undefined): string | undefined {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}
