// Ambient declarations for diagram-js (dependency of bpmn-js)

declare module 'diagram-js' {
  export interface DiagramModule {
    __depends__?: DiagramModule[];
    __init__?: string[];
    [serviceName: string]: unknown;
  }
}

declare module 'diagram-js/lib/draw/BaseRenderer' {
  import type { BpmnElement } from '@studio/shared/types';

  export default class BaseRenderer {
    constructor(eventBus: any, renderPriority?: number);
    canRender(element: BpmnElement): boolean;
    drawShape(parentGfx: SVGElement, element: BpmnElement): SVGElement;
    drawConnection(parentGfx: SVGElement, element: BpmnElement): SVGElement;
    getShapePath(element: BpmnElement): string;
    getConnectionPath(element: BpmnElement): string;
  }
}

declare module 'diagram-js/lib/util/RenderUtil' {
  export function componentsToPath(components: any[]): string;
  export function createLine(points: any[], attrs?: Record<string, any>): SVGElement;
}

declare module 'diagram-js/lib/util/SvgTransformUtil' {
  export function transform(gfx: SVGElement, x: number, y: number, angle?: number, amount?: number): void;
  export function translate(gfx: SVGElement, x: number, y: number): void;
  export function rotate(gfx: SVGElement, angle: number): void;
  export function scale(gfx: SVGElement, amount: number): void;
}
