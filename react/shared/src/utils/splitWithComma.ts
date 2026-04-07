/**
 * Splits a comma-separated string into an array.
 * Returns undefined for falsy values, passes through non-strings unchanged.
 */
export function splitWithComma<T>(str: T): T extends string ? string[] : T | undefined {
  if (!str) return undefined as never;
  if (typeof str !== "string") return str as never;
  return str.split(",") as never;
}
