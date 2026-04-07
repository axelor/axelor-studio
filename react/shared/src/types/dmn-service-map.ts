// Typed service map for DmnActiveViewer.get() -- covers 5 distinct services
// Usage: getDmnService(viewer, "sheet") returns DmnSheet
// Mirrors BpmnServiceMap pattern from Phase 31

import type { DmnElement } from "./dmn-types";

export interface DmnServiceMap {
  sheet: DmnSheet;
  eventBus: DmnEventBus;
  elementRegistry: DmnElementRegistry;
  modeling: DmnModeling;
  canvas: DmnCanvas;
}

// --- Service interfaces (minimal, usage-driven per D-04) ---

export interface DmnSheet {
  /** Returns the decision table root element */
  getRoot(): DmnDecisionTableRoot;
  // Extend when more methods are used (usage-driven per Phase 35 D-04)
}

export interface DmnDecisionTableRoot {
  rows?: DmnRow[];
  businessObject?: Record<string, unknown>;
  input?: DmnElement[];
  output?: DmnElement[];
  [key: string]: unknown;
}

export interface DmnRow {
  id: string;
  cells: DmnCell[];
  [key: string]: unknown;
}

export interface DmnCell {
  id: string;
  col: { id: string; [key: string]: unknown };
  row: { id: string; [key: string]: unknown };
  businessObject?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DmnEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- event callbacks are inherently variadic
  on(event: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, priority: number, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fire(event: string, data?: Record<string, unknown>): any;
  // Extend when more methods are used (usage-driven per Phase 35 D-04)
}

export interface DmnElementRegistry {
  get(id: string): DmnElement | undefined;
  // Extend when more methods are used (usage-driven per Phase 35 D-04)
}

export interface DmnModeling {
  updateProperties(element: unknown, properties: Record<string, unknown>): void;
  editCell(businessObject: unknown, value: string): void;
  /** @internal Private API -- fires events directly */
  _eventBus: { fire(event: string): void };
  // Extend when more methods are used (usage-driven per Phase 35 D-04)
}

export interface DmnCanvas {
  zoom(level: number | "fit-viewport", center?: { x: number; y: number }): void;
  // Extend when more methods are used (usage-driven per Phase 35 D-04)
}

/**
 * Typed dmn-js sub-viewer with DmnServiceMap-backed .get() resolution.
 * Structural interface -- matches what DmnModeler.getActiveViewer() returns.
 * Sub-viewers (decision-table, literal-expression, drd) all implement this shape.
 */
export interface DmnActiveViewer {
  get<K extends keyof DmnServiceMap>(name: K): DmnServiceMap[K];
  get(name: string): unknown;
}

/**
 * Typed dmn-js Modeler instance with DmnActiveViewer sub-viewers.
 * Structural interface -- consumers use InstanceType<typeof DmnModeler> from ambient.
 */
export interface TypedDmnModeler {
  importXML(xml: string): Promise<{ warnings: string[] }>;
  saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
  saveXML(
    options: { format?: boolean },
    callback: (err: Error | null, xml: string) => void,
  ): void;
  getActiveViewer(): DmnActiveViewer;
  getActiveView(): { type: string; element: unknown; id?: string } | null;
  getViews(): Array<{ type: string; element: unknown }>;
  getDefinitions(): Record<string, unknown> | undefined;
  open(view: { type: string; element: unknown }): Promise<void>;
  get(name: string): unknown;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  destroy(): void;
  attachTo(parentNode: HTMLElement): void;
  detach(): void;
  /** @internal Private API -- sub-viewer access (per D-09) */
  _viewers?: Record<string, DmnActiveViewer | undefined>;
  [key: string]: unknown;
}

// --- Typed getter function (per D-07, mirrors getBpmnService) ---

export function getDmnService<K extends keyof DmnServiceMap>(
  viewer: { get(name: string): unknown },
  name: K,
): DmnServiceMap[K];
export function getDmnService(
  viewer: { get(name: string): unknown },
  name: string,
): unknown;
export function getDmnService(
  viewer: { get(name: string): unknown },
  name: string,
): unknown {
  return viewer.get(name);
}
