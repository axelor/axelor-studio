// Typed service map for modeler.get() -- covers 8 distinct services across 25 call sites
// Usage: modeler.get<K extends keyof BpmnServiceMap>(name: K): BpmnServiceMap[K]

import type {
  ElementLike,
  DiagramElement,
  DiagramShape,
  DiagramRoot,
} from "./diagram-types";
import type { ModdleElement } from "./moddl-types";

export type {
  ElementLike,
  DiagramElement,
  DiagramShape,
  DiagramRoot,
} from "./diagram-types";

export interface BpmnServiceMap {
  bpmnFactory: BpmnFactory;
  canvas: Canvas;
  elementRegistry: ElementRegistry;
  eventBus: EventBus;
  modeling: Modeling;
  linting: Linting;
  propertiesPanel: PropertiesPanel;
  selection: BpmnSelection;
}

export interface BpmnFactory {
  create(type: string, attrs?: Record<string, unknown>): ModdleElement;
}

export interface Canvas {
  zoom(level: number | "fit-viewport", center?: { x: number; y: number }): void;
  getGraphics(element: ElementLike | string): SVGElement;
  getRootElement(): DiagramRoot;
  addMarker(element: ElementLike | string, marker: string): void;
  removeMarker(element: ElementLike | string, marker: string): void;
  viewbox(rect?: { x: number; y: number; width: number; height: number }): {
    x: number;
    y: number;
    width: number;
    height: number;
    inner: { x: number; y: number; width: number; height: number };
    outer: { x: number; y: number; width: number; height: number };
  };
}

export interface ElementRegistry {
  get(id: string): ElementLike | undefined;
  getAll(): ElementLike[];
  filter(fn: (element: ElementLike) => boolean): ElementLike[];
  forEach(fn: (element: ElementLike) => void): void;
  find(fn: (element: ElementLike) => boolean): ElementLike | undefined;
}

export interface EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- event callbacks are inherently variadic
  on(event: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, priority: number, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fire(event: string, data?: Record<string, unknown>): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once(event: string, callback: (...args: any[]) => void): void;
}

export interface Modeling {
  updateProperties(element: ElementLike, properties: Record<string, unknown>): void;
  setColor(
    elements: ElementLike | ElementLike[],
    colors: { stroke?: string; fill?: string },
  ): void;
  removeElements(elements: DiagramElement[]): void;
  createShape(
    shape: Partial<DiagramShape>,
    position: { x: number; y: number },
    target: DiagramElement,
    hints?: Record<string, unknown>,
  ): DiagramShape;
  moveShape(
    shape: DiagramShape,
    delta: { x: number; y: number },
    newParent?: DiagramElement,
    hints?: Record<string, unknown>,
  ): void;
  updateLabel(
    element: ElementLike,
    newLabel: string,
    newBounds?: { x: number; y: number; width: number; height: number },
    hints?: Record<string, unknown>,
  ): void;
}

export interface Linting {
  toggle(active?: boolean): boolean;
  isActive(): boolean;
  update(): void;
  lint(): Promise<Record<string, unknown>[]>;
  setLinterConfig(config: unknown): void;
  getLinterConfig(): unknown;
}

export interface PropertiesPanel {
  attachTo(parentNode: HTMLElement): void;
  detach(): void;
  update(element: ElementLike): void;
}

export interface BpmnSelection {
  select(element: ElementLike): void;
  deselect(element: ElementLike): void;
  get(): ElementLike[];
}

/**
 * Typed bpmn-js Modeler instance with BpmnServiceMap-backed .get() resolution.
 * Structural interface -- consumers cast `new BpmnModeler(config)` to this type.
 * The shipped Modeler<ServiceMap> generic already provides typed get() when ServiceMap
 * is non-null, but since @studio/shared has no dependency on bpmn-js, we define the
 * structural shape here for context typing and function signatures.
 */
export interface TypedBpmnModeler {
  // Typed service accessor backed by BpmnServiceMap
  get<K extends keyof BpmnServiceMap>(name: K): BpmnServiceMap[K];
  get(name: string): unknown;

  // Core modeler lifecycle
  importXML(xml: string): Promise<{ warnings: string[] }>;
  saveXML(options?: {
    format?: boolean;
    preamble?: boolean;
  }): Promise<{ xml: string }>;
  saveSVG(options?: { format?: boolean }): Promise<{ svg: string }>;
  destroy(): void;
  attachTo(parentNode: HTMLElement): void;
  detach(): void;
  createDiagram(): Promise<{ warnings: string[] }>;
  getDefinitions(): ModdleElement & {
    $attrs: Record<string, unknown>;
    rootElements?: ModdleElement[];
  };

  // Event handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- event callbacks are inherently variadic
  on(event: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, priority: number, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback: (...args: any[]) => void): void;

  // Index signature for dynamic property access (bpmn-js internal modules)
  [key: string]: unknown;
}

// Overloaded typed getter function
export function getBpmnService<K extends keyof BpmnServiceMap>(
  modeler: { get(name: string): unknown },
  name: K,
): BpmnServiceMap[K];
export function getBpmnService(
  modeler: { get(name: string): unknown },
  name: string,
): unknown;
export function getBpmnService(
  modeler: { get(name: string): unknown },
  name: string,
): unknown {
  return modeler.get(name);
}
