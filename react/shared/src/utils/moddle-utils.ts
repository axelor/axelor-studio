import type { ModdleElement } from "../types/moddl-types";

/**
 * Typed accessor for moddle $attrs properties.
 * Zero runtime overhead -- purely cosmetic wrapper around index access.
 */
export function getModdleAttr<T>(
  bo: ModdleElement,
  key: string,
): T | undefined {
  return bo.$attrs[key] as T | undefined;
}
