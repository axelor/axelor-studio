import { is } from "bpmn-js/lib/util/ModelUtil";
import type { ModdleElement } from "@studio/shared/types";

/**
 * Get extension elements of business object. Optionally filter by type.
 *
 * IMPORTANT: BPMN moddle elements use .get() for property access.
 * Direct property access (bo.extensionElements) returns undefined.
 */
export function getExtensionElementsList(
  businessObject: ModdleElement,
  type?: string,
): ModdleElement[] {
  const extensionElements = businessObject.get("extensionElements");

  if (!extensionElements) {
    return [];
  }

  const values = extensionElements.get("values");

  if (!values || !values.length) {
    return [];
  }

  if (type) {
    return values.filter((value: ModdleElement) => is(value, type));
  }

  return values;
}

/**
 * Legacy getExtensionElements (used by ListenerProps and other property panels).
 */
export function getExtensionElements(bo: ModdleElement, type: string): ModdleElement[] {
  let elements: ModdleElement[] = [];
  const extensionElements = bo.get("extensionElements");

  if (typeof extensionElements !== "undefined") {
    const extensionValues = extensionElements.get("values");
    if (typeof extensionValues !== "undefined") {
      elements = extensionValues.filter(function (value: ModdleElement) {
        return is(value, type);
      });
    }
  }

  return elements;
}
