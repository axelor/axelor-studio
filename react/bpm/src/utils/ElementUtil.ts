import Ids from "ids";
import { is } from "bpmn-js/lib/util/ModelUtil";
import type {  ModdleElement, BpmnFactory } from "@studio/shared/types";

/**
 * Create a new element and (optionally) set its parent.
 */
export function createElement(
  type: string,
  properties: Record<string, unknown>,
  parent: ModdleElement,
  bpmnFactory: BpmnFactory,
): ModdleElement {
  const element = bpmnFactory.create(type, properties);

  if (parent) {
    element.$parent = parent;
  }

  return element;
}

/**
 * generate a semantic id with given prefix
 */
export function nextId(prefix: string): string {
  const ids = new Ids([32, 32, 1]);

  return ids.nextPrefixed(prefix);
}

export function getRoot(businessObject: ModdleElement): ModdleElement {
  let parent = businessObject;

  while (parent.$parent) {
    parent = parent.$parent;
  }

  return parent;
}

export function filterElementsByType(
  objectList: ModdleElement[] | undefined,
  type: string,
): ModdleElement[] {
  const list = objectList || [];

  return list.filter((element) => is(element, type));
}

export function findRootElementsByType(
  businessObject: ModdleElement,
  referencedType: string,
): ModdleElement[] {
  const root = getRoot(businessObject);

  return filterElementsByType(root["rootElements"] as ModdleElement[] | undefined, referencedType);
}
