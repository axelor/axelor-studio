/**
 * Core diagram element types mirroring diagram-js model hierarchy.
 *
 * These types are defined locally (not imported from diagram-js) because
 * @studio/shared has no dependency on diagram-js. They are structurally
 * compatible with diagram-js/lib/model/Types so that values flow freely
 * between our typed wrappers and native bpmn-js/diagram-js APIs.
 *
 * Hierarchy: ElementLike -> Element -> Shape / Connection / Root / Label
 */

/** Minimal element shape -- compatible with diagram-js ElementLike. */
export interface ElementLike {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- businessObject is inherently dynamic (moddle)
  businessObject?: any;
  [key: string]: unknown;
}

/** Full element with graph relations -- compatible with diagram-js Element. */
export interface DiagramElement extends ElementLike {
  label?: DiagramLabel;
  labels: DiagramLabel[];
  parent?: DiagramElement;
  incoming: DiagramConnection[];
  outgoing: DiagramConnection[];
}

/** Shape with position and size -- compatible with diagram-js Shape. */
export interface DiagramShape extends DiagramElement {
  x: number;
  y: number;
  width: number;
  height: number;
  isFrame?: boolean;
  children: DiagramElement[];
  host?: DiagramShape;
  attachers: DiagramShape[];
}

/** Root element -- compatible with diagram-js Root. */
export interface DiagramRoot extends DiagramElement {
  isImplicit?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  children: DiagramElement[];
}

/** Label shape -- compatible with diagram-js Label. */
export interface DiagramLabel extends DiagramShape {
  labelTarget?: DiagramElement;
}

/** Connection with waypoints -- compatible with diagram-js Connection. */
export interface DiagramConnection extends DiagramElement {
  waypoints: Array<{ x: number; y: number }>;
  source?: DiagramElement;
  target?: DiagramElement;
}
