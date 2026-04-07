/**
 * Shared rendering helpers for BpmnRenderer.
 *
 * Contains: renderEventContent, renderLabel, renderEmbeddedLabel,
 * renderExternalLabel, renderLaneLabel, createPathFromConnection,
 * attachTaskMarkers, renderDataItemCollection.
 */

import type { BpmnElement } from "@studio/shared/types";

import type { HandlerFn, SvgAttrs } from "./renderer-types";

interface RenderingHelpersDeps {
  renderer: (type: string) => HandlerFn;
  drawPath: (parentGfx: SVGElement, d: string, attrs?: SvgAttrs) => SVGElement;
  drawCircle: (
    parentGfx: SVGElement,
    width: number,
    height: number,
    offsetOrAttrs?: number | SvgAttrs,
    attrs?: SvgAttrs,
  ) => SVGElement;
  textRenderer: {
    createText: (text: string, options?: Record<string, unknown>) => SVGElement;
    getExternalStyle: () => Record<string, unknown>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultFillColor: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultStrokeColor: any;
  pathMap: { getScaledPath: (name: string, options: Record<string, unknown>) => string };
  svgAppend: (parent: SVGElement, child: SVGElement) => void;
  svgClasses: (element: SVGElement) => { add: (cls: string) => void };
  transform: (gfx: SVGElement, x: number, y: number, angle?: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assign: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forEach: (...args: any[]) => any;
  getSemantic: (element: unknown) => Record<string, unknown>;
  isThrowEvent: (event: unknown) => boolean;
  isTypedEvent: (event: unknown, type: string) => boolean;
  getLabel: (element: unknown) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFillColor: (element: any, defaultColor?: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStrokeColor: (element: any, defaultColor?: any) => string;
}

export function createRenderingHelpers(deps: RenderingHelpersDeps) {
  const {
    renderer,
    drawPath,
    drawCircle: _drawCircle,
    textRenderer,
    defaultFillColor: _defaultFillColor,
    defaultStrokeColor,
    pathMap,
    svgAppend,
    svgClasses,
    transform,
    assign,
    forEach,
    getSemantic,
    isThrowEvent,
    isTypedEvent,
    getLabel,
    getFillColor: _getFillColor,
    getStrokeColor,
  } = deps;

  function renderEventContent(element: BpmnElement, parentGfx: SVGElement) {
    const event = getSemantic(element);
    const isThrowing = isThrowEvent(event);

    const eventDefinitions = event.eventDefinitions as unknown[] | undefined; // safety: bpmn-js eventDefinitions is untyped array
    if (eventDefinitions && eventDefinitions.length > 1) {
      if (event.parallelMultiple) {
        return renderer("bpmn:ParallelMultipleEventDefinition")(parentGfx, element, isThrowing);
      } else {
        return renderer("bpmn:MultipleEventDefinition")(parentGfx, element, isThrowing);
      }
    }

    if (isTypedEvent(event, "bpmn:MessageEventDefinition")) {
      return renderer("bpmn:MessageEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:TimerEventDefinition")) {
      return renderer("bpmn:TimerEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:ConditionalEventDefinition")) {
      return renderer("bpmn:ConditionalEventDefinition")(parentGfx, element);
    }

    if (isTypedEvent(event, "bpmn:SignalEventDefinition")) {
      return renderer("bpmn:SignalEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:EscalationEventDefinition")) {
      return renderer("bpmn:EscalationEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:LinkEventDefinition")) {
      return renderer("bpmn:LinkEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:ErrorEventDefinition")) {
      return renderer("bpmn:ErrorEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:CancelEventDefinition")) {
      return renderer("bpmn:CancelEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:CompensateEventDefinition")) {
      return renderer("bpmn:CompensateEventDefinition")(parentGfx, element, isThrowing);
    }

    if (isTypedEvent(event, "bpmn:TerminateEventDefinition")) {
      return renderer("bpmn:TerminateEventDefinition")(parentGfx, element, isThrowing);
    }

    return null;
  }

  function renderLabel(parentGfx: SVGElement, label: string, options?: Record<string, unknown>) {
    options = assign(
      {
        size: {
          width: 100,
        },
      },
      options,
    );

    const text = textRenderer.createText(label || "", options);
    if (
      (options as Record<string, Record<string, unknown>> | undefined)?.box?.type ===
      "bpmn:TextAnnotation"
    ) {
      /** To avoid generic djs-label css */
      svgClasses(text).add("djs-annotation-label");
    } else {
      svgClasses(text).add("djs-label");
    }

    svgAppend(parentGfx, text);

    return text;
  }

  function renderEmbeddedLabel(parentGfx: SVGElement, element: BpmnElement, align: string) {
    const semantic = getSemantic(element);

    return renderLabel(parentGfx, (semantic.name as string) || "", {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: getStrokeColor(element, defaultStrokeColor),
      },
    });
  }

  function renderExternalLabel(parentGfx: SVGElement, element: BpmnElement) {
    const box = {
      width: 90,
      height: 30,
      x: element.width / 2 + element.x,
      y: element.height / 2 + element.y,
    };

    return renderLabel(parentGfx, getLabel(element) || "", {
      box: box,
      fitBox: true,
      style: assign({}, textRenderer.getExternalStyle(), {
        fill: getStrokeColor(element, defaultStrokeColor),
      }),
    });
  }

  function renderLaneLabel(parentGfx: SVGElement, text: string, element: BpmnElement) {
    const textBox = renderLabel(parentGfx, text, {
      box: {
        height: 30,
        width: element.height,
      },
      align: "center-middle",
      style: {
        fill: getStrokeColor(element, defaultStrokeColor),
      },
    });

    const top = -1 * element.height;

    transform(textBox, 0, -top, 270);
  }

  function createPathFromConnection(connection: BpmnElement) {
    const waypoints = (connection as unknown as { waypoints: Array<{ x: number; y: number }> }) // safety: bpmn-js connection has waypoints not in typed interface
      .waypoints;
    if (!waypoints?.length) return "";

    let pathData = "m  " + waypoints[0].x + "," + waypoints[0].y;
    for (let i = 1; i < waypoints.length; i++) {
      pathData += "L" + waypoints[i].x + "," + waypoints[i].y + " ";
    }
    return pathData;
  }

  function attachTaskMarkers(parentGfx: SVGElement, element: BpmnElement, taskMarkers?: string[]) {
    const obj = getSemantic(element);

    const subprocess = taskMarkers && taskMarkers.indexOf("SubProcessMarker") !== -1;
    let position: {
      seq: number;
      parallel: number;
      compensation: number;
      loop: number;
      adhoc: number;
    };

    if (subprocess) {
      position = {
        seq: -21,
        parallel: -22,
        compensation: -42,
        loop: -18,
        adhoc: 10,
      };
    } else {
      position = {
        seq: -3,
        parallel: -6,
        compensation: -27,
        loop: 0,
        adhoc: 10,
      };
    }

    forEach(taskMarkers, function (marker: string) {
      renderer(marker)(parentGfx, element, position);
    });

    if (obj.isForCompensation) {
      renderer("CompensationMarker")(parentGfx, element, position);
    }

    if (obj.$type === "bpmn:AdHocSubProcess") {
      renderer("AdhocMarker")(parentGfx, element, position);
    }

    const loopCharacteristics = obj.loopCharacteristics as Record<string, unknown> | undefined,
      isSequential = loopCharacteristics && loopCharacteristics.isSequential;

    if (loopCharacteristics) {
      if (isSequential === undefined) {
        renderer("LoopMarker")(parentGfx, element, position);
      }

      if (isSequential === false) {
        renderer("ParallelMarker")(parentGfx, element, position);
      }

      if (isSequential === true) {
        renderer("SequentialMarker")(parentGfx, element, position);
      }
    }
  }

  function renderDataItemCollection(parentGfx: SVGElement, element: BpmnElement) {
    const yPosition = (element.height - 18) / element.height;

    const pathData = pathMap.getScaledPath("DATA_OBJECT_COLLECTION_PATH", {
      xScaleFactor: 1,
      yScaleFactor: 1,
      containerWidth: element.width,
      containerHeight: element.height,
      position: {
        mx: 0.33,
        my: yPosition,
      },
    });

    /* collection path */ drawPath(parentGfx, pathData, {
      strokeWidth: 2,
      stroke: getStrokeColor(element, defaultStrokeColor),
    });
  }

  return {
    renderEventContent: renderEventContent,
    renderLabel: renderLabel,
    renderEmbeddedLabel: renderEmbeddedLabel,
    renderExternalLabel: renderExternalLabel,
    renderLaneLabel: renderLaneLabel,
    createPathFromConnection: createPathFromConnection,
    attachTaskMarkers: attachTaskMarkers,
    renderDataItemCollection: renderDataItemCollection,
  };
}
