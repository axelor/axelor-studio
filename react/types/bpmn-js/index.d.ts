// Ambient declarations for bpmn-js@18.2.0
// typeRoots-loaded: this file IS the type definition for bpmn-js (shipped .d.ts are shadowed).
// Typed service access via TypedBpmnModeler + BpmnServiceMap in @studio/shared/types.

declare module "bpmn-js/lib/Modeler" {
  import type { TypedBpmnModeler } from "@studio/shared/types";

  // Re-export TypedBpmnModeler as the default export class shape.
  // This replaces the former flat BpmnModeler interface with a proper class
  // backed by BpmnServiceMap for typed .get() resolution.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Modeler: { new (options?: Record<string, any>): TypedBpmnModeler };
  export default Modeler;

  // Project-specific event types -- not in shipped types. Used by consumer code.
  export interface BpmnElementClickEvent {
    element: { id: string; type: string; businessObject?: unknown };
    originalEvent: MouseEvent;
  }

  export interface BpmnElementHoverEvent {
    element: { id: string; type: string; businessObject?: unknown };
  }

  export interface ReadOnlyChangedEvent {
    readOnly: boolean;
  }
}

declare module "bpmn-js/lib/util/ModelUtil" {
  import type { ModdleElement, BpmnElement } from "@studio/shared/types";
  export function is(
    element: BpmnElement | ModdleElement | unknown,
    type: string | string[],
  ): boolean;
  export function getBusinessObject(
    element: BpmnElement | ModdleElement | unknown,
  ): ModdleElement;
}

declare module "bpmn-js/lib/util/DiUtil" {
  import type { BpmnElement } from "@studio/shared/types";
  export function isExpanded(element: BpmnElement | unknown, di?: unknown): boolean;
  export function isEventSubProcess(element: BpmnElement | unknown): boolean;
  export function isInterrupting(element: BpmnElement | unknown): boolean;
}

declare module "bpmn-js/lib/draw/BpmnRenderUtil" {
  import type { BpmnElement } from "@studio/shared/types";
  export function isTypedEvent(
    element: BpmnElement | unknown,
    eventDefinitionType: string,
  ): boolean;
  export function isThrowEvent(element: BpmnElement | unknown): boolean;
  export function isCollection(element: BpmnElement | unknown): boolean;
  export function getDi(element: BpmnElement | unknown): Record<string, unknown>;
  export function getSemantic(element: BpmnElement | unknown): Record<string, unknown>;
  export function getCirclePath(shape: BpmnElement | unknown): string;
  export function getRoundRectPath(
    shape: BpmnElement | unknown,
    borderRadius?: number,
  ): string;
  export function getDiamondPath(shape: BpmnElement | unknown): string;
  export function getRectPath(shape: BpmnElement | unknown): string;
  export function getFillColor(
    element: BpmnElement | unknown,
    defaultColor?: string,
  ): string;
  export function getStrokeColor(
    element: BpmnElement | unknown,
    defaultColor?: string,
  ): string;
  export function getLabelColor(
    element: BpmnElement | unknown,
    defaultColor?: string,
    defaultStrokeColor?: string,
  ): string;
}

declare module "bpmn-js/lib/features/copy-paste/ModdleCopy" {
  export function getPropertyNames(
    descriptor: unknown,
    keepDefault?: boolean,
  ): string[];
  const ModdleCopy: unknown;
  export default ModdleCopy;
}

declare module "bpmn-js/lib/features/label-editing/LabelUtil" {
  import type { BpmnElement } from "@studio/shared/types";
  export function getLabel(element: BpmnElement | unknown): string;
  export function setLabel(
    element: BpmnElement | unknown,
    text: string,
    isExternal?: boolean,
  ): unknown;
}

declare module "bpmn-js/lib/features/modeling/util/ModelingUtil" {
  import type { BpmnElement } from "@studio/shared/types";
  export function isAny(element: BpmnElement | unknown, types: string[]): boolean;
}

declare module "bpmn-js/lib/features/popup-menu/util/TypeUtil" {
  import type { BpmnElement } from "@studio/shared/types";
  export function isDifferentType(
    element: BpmnElement | unknown,
  ): (entry: unknown) => boolean;
  export function isDifferentType(
    element: BpmnElement | unknown,
    target: unknown,
  ): boolean;
}

declare module "bpmn-js/lib/Viewer" {
  const Viewer: unknown;
  export default Viewer;
}

declare module "bpmn-js/lib/NavigatedViewer" {
  const NavigatedViewer: unknown;
  export default NavigatedViewer;
}
