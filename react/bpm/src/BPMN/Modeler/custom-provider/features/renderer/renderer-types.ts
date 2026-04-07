/**
 * Shared type definitions for BpmnRenderer handler factories.
 *
 * RendererContext is the bag of utilities and references passed from
 * BpmnRenderer constructor to each handler factory (createEventHandlers,
 * createTaskHandlers, etc.).
 */

import type { BpmnElement } from "@studio/shared/types";

/** A handler function that renders a BPMN element into SVG */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandlerFn = (...args: any[]) => any;

/** Map of BPMN type string to its rendering handler */
export type HandlersMap = Record<string, HandlerFn>;

/** SVG attribute record */
export type SvgAttrs = Record<string, unknown>;

/** Marker position offsets for task markers */
export interface MarkerPosition {
  seq: number;
  parallel: number;
  compensation: number;
  loop: number;
  adhoc: number;
}

/** The context object passed to all handler factory functions */
export interface RendererContext {
  // Drawing primitives
  drawCircle: (
    parentGfx: SVGElement,
    width: number,
    height: number,
    offsetOrAttrs?: number | SvgAttrs,
    attrs?: SvgAttrs,
  ) => SVGElement;
  drawRect: (
    parentGfx: SVGElement,
    width: number,
    height: number,
    r: number,
    offsetOrAttrs?: number | SvgAttrs,
    attrs?: SvgAttrs,
  ) => SVGElement;
  drawDiamond: (
    parentGfx: SVGElement,
    width: number,
    height: number,
    attrs?: SvgAttrs,
  ) => SVGElement;
  drawLine: (
    parentGfx: SVGElement,
    waypoints: Array<{ x: number; y: number }>,
    attrs?: SvgAttrs,
  ) => SVGElement;
  drawPath: (parentGfx: SVGElement, d: string, attrs?: SvgAttrs) => SVGElement;
  drawMarker: (type: string, parentGfx: SVGElement, path: string, attrs?: SvgAttrs) => SVGElement;

  // Renderer lookup
  renderer: (type: string) => HandlerFn;
  as: (type: string) => (parentGfx: SVGElement, element: BpmnElement) => SVGElement | void;

  // Rendering helpers
  renderEventContent: (
    element: BpmnElement,
    parentGfx: SVGElement,
    isThrowing?: boolean,
  ) => SVGElement | null | void;
  renderLabel: (
    parentGfx: SVGElement,
    label: string,
    options?: Record<string, unknown>,
  ) => SVGElement;
  renderEmbeddedLabel: (parentGfx: SVGElement, element: BpmnElement, align: string) => SVGElement;
  renderExternalLabel: (parentGfx: SVGElement, element: BpmnElement) => SVGElement;
  renderLaneLabel: (parentGfx: SVGElement, text: string, element: BpmnElement) => void;
  createPathFromConnection: (connection: BpmnElement) => string;
  attachTaskMarkers: (parentGfx: SVGElement, element: BpmnElement, taskMarkers?: string[]) => void;
  renderDataItemCollection: (parentGfx: SVGElement, element: BpmnElement) => void;

  // Marker utility
  marker: (type: string, fill: string, stroke: string) => string;

  // Default colors
  defaultFillColor: string | null | undefined;
  defaultStrokeColor: string | null | undefined;

  // Services
  computeStyle: (...args: unknown[]) => Record<string, unknown>;
  pathMap: {
    getScaledPath: (name: string, options: Record<string, unknown>) => string;
    getRawPath: (name: string) => string;
  };
  textRenderer: {
    createText: (text: string, options?: Record<string, unknown>) => SVGElement;
    getExternalStyle: () => Record<string, unknown>;
    getDefaultStyle: () => Record<string, unknown>;
  };
  canvas: { _svg: SVGElement };
  styles: {
    computeStyle: (...args: unknown[]) => Record<string, unknown>;
    style: (...args: unknown[]) => Record<string, unknown>;
  };

  // SVG utilities (from tiny-svg)
  svgAppend: (parent: SVGElement, child: SVGElement) => void;
  svgAttr: (element: SVGElement, attrs: Record<string, unknown>) => void;
  svgCreate: (type: string) => SVGElement;
  svgClasses: (element: SVGElement) => { add: (cls: string) => void };

  // Transform utilities (from diagram-js)
  rotate: (gfx: SVGElement, angle: number) => void;
  transform: (gfx: SVGElement, x: number, y: number, angle?: number) => void;
  translate: (gfx: SVGElement, x: number, y: number) => void;

  // Utility functions (from min-dash)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assign: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forEach: (...args: any[]) => any;
  isObject: (value: unknown) => boolean;

  // BPMN utility functions
  is: (element: unknown, type: string | string[]) => boolean;
  getDi: (element: unknown) => Record<string, unknown>;
  getSemantic: (element: unknown) => Record<string, unknown>;
  isTypedEvent: (event: unknown, eventDefinitionType: string) => boolean;
  isThrowEvent: (event: unknown) => boolean;
  isCollection: (element: unknown) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFillColor: (element: any, defaultColor?: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStrokeColor: (element: any, defaultColor?: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domQuery: (...args: any[]) => any;
  createLine: (points: unknown[], attrs?: Record<string, unknown>) => SVGElement;
  isExpanded: (element: unknown, di?: unknown) => boolean;
  isEventSubProcess: (element: unknown) => boolean;

  // Constants
  TASK_BORDER_RADIUS: number;
  INNER_OUTER_DIST: number;
  DEFAULT_FILL_OPACITY: number;
  HIGH_FILL_OPACITY: number;
}
