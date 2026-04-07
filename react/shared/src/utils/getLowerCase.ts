export function getLowerCase(str: string | null | undefined): string | undefined {
  if (!str) return;
  return str.trim().toLowerCase();
}
