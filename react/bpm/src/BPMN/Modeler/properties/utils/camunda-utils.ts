import type { ModdleElement } from "@studio/shared/types";

/**
 * Safe accessor for camunda:-prefixed attributes on moddle elements.
 *
 * Replaces the @ts-expect-error + `bo.$attrs["camunda:x"]` pattern with
 * a runtime type guard. Returns `undefined` if the element, $attrs, or
 * the attribute itself is missing or not a string.
 */
export function getCamundaAttr(
  bo: ModdleElement | undefined,
  name: string,
): string | undefined {
  const value = bo?.$attrs?.[`camunda:${name}`];
  return typeof value === "string" ? value : undefined;
}
