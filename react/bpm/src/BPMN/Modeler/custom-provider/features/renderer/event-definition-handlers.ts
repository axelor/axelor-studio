/**
 * EventDefinition handler factories for BpmnRenderer.
 *
 * Contains handlers for all EventDefinition types:
 * MessageEventDefinition, TimerEventDefinition, EscalationEventDefinition,
 * ConditionalEventDefinition, LinkEventDefinition, ErrorEventDefinition,
 * CancelEventDefinition, CompensateEventDefinition, SignalEventDefinition,
 * MultipleEventDefinition, ParallelMultipleEventDefinition,
 * TerminateEventDefinition.
 */
import type { BpmnElement } from "@studio/shared/types";

import type { RendererContext, HandlersMap } from "./renderer-types";

export function createEventDefinitionHandlers(ctx: RendererContext): HandlersMap {
  const {
    drawCircle,
    drawPath,
    defaultFillColor,
    defaultStrokeColor,
    pathMap,
    getFillColor,
    getStrokeColor,
    rotate,
  } = ctx;

  return {
    "bpmn:MessageEventDefinition": function (
      parentGfx: SVGElement,
      element: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_MESSAGE", {
        xScaleFactor: 0.9,
        yScaleFactor: 0.9,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.235,
          my: 0.315,
        },
      });

      const fill = isThrowing
        ? getStrokeColor(element, defaultStrokeColor)
        : getFillColor(element, defaultFillColor);
      const stroke = isThrowing
        ? getFillColor(element, defaultFillColor)
        : getStrokeColor(element, defaultStrokeColor);

      const messagePath = drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: stroke,
      });

      return messagePath;
    },
    "bpmn:TimerEventDefinition": function (parentGfx: SVGElement, element: BpmnElement) {
      const circle = drawCircle(parentGfx, element.width, element.height, 0.2 * element.height, {
        strokeWidth: 2,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      const pathData = pathMap.getScaledPath("EVENT_TIMER_WH", {
        xScaleFactor: 0.75,
        yScaleFactor: 0.75,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.5,
          my: 0.5,
        },
      });

      drawPath(parentGfx, pathData, {
        strokeWidth: 2,
        strokeLinecap: "square",
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      for (let i = 0; i < 12; i++) {
        const linePathData = pathMap.getScaledPath("EVENT_TIMER_LINE", {
          xScaleFactor: 0.75,
          yScaleFactor: 0.75,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.5,
            my: 0.5,
          },
        });

        const width = element.width / 2;
        const height = element.height / 2;

        drawPath(parentGfx, linePathData, {
          strokeWidth: 1,
          strokeLinecap: "square",
          transform: "rotate(" + i * 30 + "," + height + "," + width + ")",
          stroke: getStrokeColor(element, defaultStrokeColor),
        });
      }

      return circle;
    },
    "bpmn:EscalationEventDefinition": function (
      parentGfx: SVGElement,
      event: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_ESCALATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.2,
        },
      });

      const fill = isThrowing ? getStrokeColor(event, defaultStrokeColor) : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:ConditionalEventDefinition": function (parentGfx: SVGElement, event: BpmnElement) {
      const pathData = pathMap.getScaledPath("EVENT_CONDITIONAL", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.222,
        },
      });

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:LinkEventDefinition": function (
      parentGfx: SVGElement,
      event: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_LINK", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.57,
          my: 0.263,
        },
      });

      const fill = isThrowing ? getStrokeColor(event, defaultStrokeColor) : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:ErrorEventDefinition": function (
      parentGfx: SVGElement,
      event: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_ERROR", {
        xScaleFactor: 1.1,
        yScaleFactor: 1.1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.2,
          my: 0.722,
        },
      });

      const fill = isThrowing ? getStrokeColor(event, defaultStrokeColor) : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:CancelEventDefinition": function (
      parentGfx: SVGElement,
      event: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_CANCEL_45", {
        xScaleFactor: 1.0,
        yScaleFactor: 1.0,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.638,
          my: -0.055,
        },
      });

      const fill = isThrowing ? getStrokeColor(event, defaultStrokeColor) : "none";

      const path = drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });

      rotate(path, 45);

      return path;
    },
    "bpmn:CompensateEventDefinition": function (
      parentGfx: SVGElement,
      event: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_COMPENSATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.22,
          my: 0.5,
        },
      });

      const fill = isThrowing ? getStrokeColor(event, defaultStrokeColor) : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:SignalEventDefinition": function (
      parentGfx: SVGElement,
      event: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_SIGNAL", {
        xScaleFactor: 0.9,
        yScaleFactor: 0.9,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.2,
        },
      });

      const fill = isThrowing ? getStrokeColor(event, defaultStrokeColor) : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:MultipleEventDefinition": function (
      parentGfx: SVGElement,
      event: BpmnElement,
      isThrowing?: boolean,
    ) {
      const pathData = pathMap.getScaledPath("EVENT_MULTIPLE", {
        xScaleFactor: 1.1,
        yScaleFactor: 1.1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.222,
          my: 0.36,
        },
      });

      const fill = isThrowing ? getStrokeColor(event, defaultStrokeColor) : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
      });
    },
    "bpmn:ParallelMultipleEventDefinition": function (parentGfx: SVGElement, event: BpmnElement) {
      const pathData = pathMap.getScaledPath("EVENT_PARALLEL_MULTIPLE", {
        xScaleFactor: 1.2,
        yScaleFactor: 1.2,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.458,
          my: 0.194,
        },
      });

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getStrokeColor(event, defaultStrokeColor),
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:TerminateEventDefinition": function (parentGfx: SVGElement, element: BpmnElement) {
      const circle = drawCircle(parentGfx, element.width, element.height, 8, {
        strokeWidth: 4,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return circle;
    },
  };
}
