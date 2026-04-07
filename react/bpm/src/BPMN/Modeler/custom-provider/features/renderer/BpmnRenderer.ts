import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import { isEventSubProcess, isExpanded } from "bpmn-js/lib/util/DiUtil";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { getLabel } from "bpmn-js/lib/features/label-editing/LabelUtil";
import { createLine } from "diagram-js/lib/util/RenderUtil";
import {
  isTypedEvent,
  isThrowEvent,
  isCollection,
  getDi,
  getSemantic,
  getCirclePath,
  getRoundRectPath,
  getDiamondPath,
  getRectPath,
  getFillColor,
  getStrokeColor,
} from "bpmn-js/lib/draw/BpmnRenderUtil";
import { query as domQuery } from "min-dom";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses,
} from "tiny-svg";
import { rotate, transform, translate } from "diagram-js/lib/util/SvgTransformUtil";
import { isObject, assign, forEach } from "min-dash";
import Ids from "ids";
import type { BpmnElement } from "@studio/shared/types";

import { createDrawingUtils } from "./renderer-utils";
import { createRenderingHelpers } from "./renderer-helpers";
import { createEventHandlers } from "./event-handlers";
import { createEventDefinitionHandlers } from "./event-definition-handlers";
import { createTaskHandlers } from "./task-handlers";
import { createSubprocessHandlers } from "./subprocess-handlers";
import { createGatewayHandlers } from "./gateway-handlers";
import { createConnectionHandlers } from "./connection-handlers";
import { createDataLabelHandlers } from "./data-label-handlers";


const RENDERER_IDS = new Ids();

const TASK_BORDER_RADIUS = 10;
const INNER_OUTER_DIST = 3;

const DEFAULT_FILL_OPACITY = 0.95,
  HIGH_FILL_OPACITY = 0.35;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerFn = (...args: any[]) => any;
type HandlersMap = Record<string, HandlerFn>;

export default class BpmnRenderer extends BaseRenderer {
  static $inject = [
    "config.bpmnRenderer",
    "eventBus",
    "styles",
    "pathMap",
    "canvas",
    "textRenderer",
  ];

  handlers: HandlersMap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _drawPath: (...args: any[]) => SVGElement;

  constructor(
    config: Record<string, unknown> | null,
    eventBus: unknown,
    styles: {
      computeStyle: (...args: unknown[]) => Record<string, unknown>;
      style: (...args: unknown[]) => Record<string, unknown>;
    },
    pathMap: {
      getScaledPath: (name: string, options: Record<string, unknown>) => string;
      getRawPath: (name: string) => string;
    },
    canvas: { _svg: SVGElement },
    textRenderer: {
      createText: (text: string, options?: Record<string, unknown>) => SVGElement;
      getExternalStyle: () => Record<string, unknown>;
      getDefaultStyle: () => Record<string, unknown>;
    },
    priority?: number,
  ) {
    super(eventBus, priority);

    const defaultFillColor = config && (config as Record<string, string>).defaultFillColor,
      defaultStrokeColor = config && (config as Record<string, string>).defaultStrokeColor;

    const rendererId = RENDERER_IDS.next();

    const markers: Record<string, SVGElement> = {};

    const computeStyle = styles.computeStyle;

    // Create drawing primitives and marker utilities
    const utils = createDrawingUtils({
      svgAppend: svgAppend,
      svgAttr: svgAttr,
      svgCreate: svgCreate,
      domQuery: domQuery,
      createLine: createLine,
      isObject: isObject,
      assign: assign,
      canvas: canvas,
      computeStyle: computeStyle,
      rendererId: rendererId,
      markers: markers,
    });

    const drawCircle = utils.drawCircle;
    const drawRect = utils.drawRect;
    const drawDiamond = utils.drawDiamond;
    const drawLine = utils.drawLine;
    const drawPath = utils.drawPath;
    const drawMarker = utils.drawMarker;
    const markerFn = utils.marker;

    function as(type: string) {
      return function (parentGfx: SVGElement, element: BpmnElement) {
        return handlers[type](parentGfx, element);
      };
    }

    function renderer(type: string) {
      return handlers[type];
    }

    // Create rendering helpers (label, event content, task markers)
    const helpers = createRenderingHelpers({
      renderer: renderer,
      drawPath: drawPath,
      drawCircle: drawCircle,
      textRenderer: textRenderer,
      defaultFillColor: defaultFillColor,
      defaultStrokeColor: defaultStrokeColor,
      pathMap: pathMap,
      svgAppend: svgAppend,
      svgClasses: svgClasses,
      transform: transform,
      assign: assign,
      forEach: forEach,
      getSemantic: getSemantic,
      isThrowEvent: isThrowEvent,
      isTypedEvent: isTypedEvent,
      getLabel: getLabel,
      getFillColor: getFillColor,
      getStrokeColor: getStrokeColor,
    });

    // Build context object for handler factories
    const ctx = {
      drawCircle: drawCircle,
      drawRect: drawRect,
      drawDiamond: drawDiamond,
      drawLine: drawLine,
      drawPath: drawPath,
      drawMarker: drawMarker,
      renderer: renderer,
      as: as,
      renderEventContent: helpers.renderEventContent,
      renderLabel: helpers.renderLabel,
      renderEmbeddedLabel: helpers.renderEmbeddedLabel,
      renderExternalLabel: helpers.renderExternalLabel,
      renderLaneLabel: helpers.renderLaneLabel,
      createPathFromConnection: helpers.createPathFromConnection,
      attachTaskMarkers: helpers.attachTaskMarkers,
      renderDataItemCollection: helpers.renderDataItemCollection,
      marker: markerFn,
      defaultFillColor: defaultFillColor,
      defaultStrokeColor: defaultStrokeColor,
      computeStyle: computeStyle,
      pathMap: pathMap,
      textRenderer: textRenderer,
      canvas: canvas,
      styles: styles,
      svgAppend: svgAppend,
      svgAttr: svgAttr,
      svgCreate: svgCreate,
      svgClasses: svgClasses,
      rotate: rotate,
      transform: transform,
      translate: translate,
      assign: assign,
      forEach: forEach,
      isObject: isObject,
      is: is,
      getDi: getDi,
      getSemantic: getSemantic,
      isTypedEvent: isTypedEvent,
      isThrowEvent: isThrowEvent,
      isCollection: isCollection,
      getFillColor: getFillColor,
      getStrokeColor: getStrokeColor,
      domQuery: domQuery,
      createLine: createLine,
      isExpanded: isExpanded,
      isEventSubProcess: isEventSubProcess,
      TASK_BORDER_RADIUS: TASK_BORDER_RADIUS,
      INNER_OUTER_DIST: INNER_OUTER_DIST,
      DEFAULT_FILL_OPACITY: DEFAULT_FILL_OPACITY,
      HIGH_FILL_OPACITY: HIGH_FILL_OPACITY,
    };

    // Cast ctx to satisfy handler factory parameter types (structural compat)
    const typedCtx = ctx as unknown as import("./renderer-types").RendererContext; // safety: bpmn-js renderer context shape not in typed API

    const handlers: HandlersMap = (this.handlers = Object.assign(
      {},
      createEventHandlers(typedCtx),
      createEventDefinitionHandlers(typedCtx),
      createTaskHandlers(typedCtx),
      createSubprocessHandlers(typedCtx),
      createGatewayHandlers(typedCtx),
      createConnectionHandlers(typedCtx),
      createDataLabelHandlers(typedCtx),
    ));

    // extension API, use at your own risk
    this._drawPath = drawPath;
  }

  canRender(element: BpmnElement): boolean {
    return is(element, "bpmn:BaseElement");
  }

  drawShape(parentGfx: SVGElement, element: BpmnElement): SVGElement {
    const type = element.type;
    const h = this.handlers[type];

    /* jshint -W040 */
    return h(parentGfx, element) as SVGElement;
  }

  drawConnection(parentGfx: SVGElement, element: BpmnElement): SVGElement {
    const type = element.type;
    const h = this.handlers[type];

    /* jshint -W040 */
    return h(parentGfx, element) as SVGElement;
  }

  getShapePath(element: BpmnElement): string {
    if (is(element, "bpmn:Event")) {
      return getCirclePath(element);
    }

    if (is(element, "bpmn:Activity")) {
      return getRoundRectPath(element, TASK_BORDER_RADIUS);
    }

    if (is(element, "bpmn:Gateway")) {
      return getDiamondPath(element);
    }

    return getRectPath(element);
  }
}
