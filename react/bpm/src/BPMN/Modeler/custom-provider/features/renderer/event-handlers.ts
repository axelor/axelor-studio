/**
 * Event handler factories for BpmnRenderer.
 *
 * Contains handlers for container events: Event, StartEvent, EndEvent,
 * IntermediateEvent, IntermediateCatchEvent, IntermediateThrowEvent,
 * BoundaryEvent.
 *
 * EventDefinition handlers are in event-definition-handlers.ts.
 */
import type { BpmnElement } from "@studio/shared/types";

import type { RendererContext, HandlersMap, SvgAttrs } from "./renderer-types";

export function createEventHandlers(ctx: RendererContext): HandlersMap {
  const {
    drawCircle,
    renderer,
    as,
    renderEventContent,
    defaultFillColor,
    defaultStrokeColor,
    getFillColor,
    getStrokeColor,
    getSemantic,
    assign,
    DEFAULT_FILL_OPACITY,
    INNER_OUTER_DIST,
  } = ctx;

  return {
    "bpmn:Event": function (parentGfx: SVGElement, element: BpmnElement, attrs: SvgAttrs) {
      if (!("fillOpacity" in attrs)) {
        attrs.fillOpacity = DEFAULT_FILL_OPACITY;
      }

      return drawCircle(parentGfx, element.width, element.height, attrs);
    },
    "bpmn:StartEvent": function (parentGfx: SVGElement, element: BpmnElement) {
      let attrs: SvgAttrs = {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      const semantic = getSemantic(element);

      if (!semantic.isInterrupting) {
        attrs = {
          strokeDasharray: "6",
          strokeLinecap: "round",
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        };
      }

      const circle = renderer("bpmn:Event")(parentGfx, element, attrs);

      renderEventContent(element, parentGfx);

      return circle;
    },
    "bpmn:EndEvent": function (parentGfx: SVGElement, element: BpmnElement) {
      const circle = renderer("bpmn:Event")(parentGfx, element, {
        strokeWidth: 4,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      renderEventContent(element, parentGfx, true);

      return circle;
    },
    "bpmn:IntermediateEvent": function (parentGfx: SVGElement, element: BpmnElement) {
      const outer = renderer("bpmn:Event")(parentGfx, element, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      /* inner */
      drawCircle(parentGfx, element.width, element.height, INNER_OUTER_DIST, {
        strokeWidth: 1,
        fill: getFillColor(element, "none"),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      renderEventContent(element, parentGfx);

      return outer;
    },
    "bpmn:IntermediateCatchEvent": as("bpmn:IntermediateEvent"),
    "bpmn:IntermediateThrowEvent": as("bpmn:IntermediateEvent"),

    "bpmn:BoundaryEvent": function (parentGfx: SVGElement, element: BpmnElement) {
      const semantic = getSemantic(element),
        cancel = semantic.cancelActivity;

      const attrs: SvgAttrs = {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      if (!cancel) {
        attrs.strokeDasharray = "6";
        attrs.strokeLinecap = "round";
      }

      // apply fillOpacity
      const outerAttrs = assign({}, attrs, {
        fillOpacity: 1,
      });

      // apply no-fill
      const innerAttrs = assign({}, attrs, {
        fill: "none",
      });

      const outer = renderer("bpmn:Event")(parentGfx, element, outerAttrs);

      /* inner path */ drawCircle(
        parentGfx,
        element.width,
        element.height,
        INNER_OUTER_DIST,
        innerAttrs,
      );

      renderEventContent(element, parentGfx);

      return outer;
    },
  };
}
