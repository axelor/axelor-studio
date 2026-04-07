// Centralized wrapper for bpmn-js API access.
// All definition/element access goes through here -- grep-able, replaceable.
// Uses public bpmn-js API (getDefinitions(), get('elementRegistry')).
// The only semi-private access is $attrs on the definitions object,
// which is a moddle convention (not a bpmn-js internal).
/* bpmn-js $attrs is a private moddle convention -- no public alternative as of v18.2.
   Monitoring upstream: https://github.com/bpmn-io/bpmn-js/issues */

import type { TypedBpmnModeler, ModdleElement, ElementLike } from "@studio/shared/types";

/**
 * Returns $attrs from the BPMN definitions object.
 */
export function getDefinitionAttrs(modeler: TypedBpmnModeler): Record<string, unknown> {
  const definitions = modeler.getDefinitions();
  return definitions?.$attrs || {};
}

/**
 * Returns the camunda:diagramName from definitions $attrs.
 */
export function getDiagramName(modeler: TypedBpmnModeler): string | undefined {
  return getDefinitionAttrs(modeler)["camunda:diagramName"] as string | undefined;
}

/**
 * Returns the rootElements array from definitions.
 */
export function getRootElements(modeler: TypedBpmnModeler): ModdleElement[] {
  const definitions = modeler.getDefinitions();
  return definitions?.rootElements || [];
}

/**
 * Returns only bpmn:Process elements from rootElements.
 */
export function getProcesses(modeler: TypedBpmnModeler): ModdleElement[] {
  return getRootElements(modeler).filter((e) => e.$type === "bpmn:Process");
}

/**
 * Returns all elements from the element registry (public API).
 */
export function getAllElements(modeler: TypedBpmnModeler): ElementLike[] {
  const elementRegistry = modeler.get("elementRegistry");
  return elementRegistry.getAll();
}

/**
 * Returns a single element by id (public API).
 */
export function getElementById(modeler: TypedBpmnModeler, id: string): ElementLike | undefined {
  const elementRegistry = modeler.get("elementRegistry");
  return elementRegistry.get(id);
}
