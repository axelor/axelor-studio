export function sortBy<T extends Record<string, unknown>>(array: T[] = [], key: string): T[] {
  return array.sort(function (a, b) {
    const x = a[key] as string | number | null | undefined;
    const y = b[key] as string | number | null | undefined;
    return (x ?? "") < (y ?? "") ? -1 : (x ?? "") > (y ?? "") ? 1 : 0;
  });
}
