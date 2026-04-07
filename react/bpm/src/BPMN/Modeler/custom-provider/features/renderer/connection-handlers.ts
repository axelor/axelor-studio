/**
 * Connection handler factories for BpmnRenderer.
 *
 * Contains handlers for: SequenceFlow, Association,
 * DataInputAssociation, DataOutputAssociation, MessageFlow.
 */
import type { BpmnElement } from "@studio/shared/types";

import type { RendererContext, HandlersMap, SvgAttrs } from "./renderer-types";

export function createConnectionHandlers(ctx: RendererContext): HandlersMap {
  const {
    drawLine,
    drawPath,
    renderer,
    createPathFromConnection,
    marker,
    defaultFillColor,
    defaultStrokeColor,
    pathMap,
    getFillColor,
    getStrokeColor,
    getSemantic,
    getDi,
    svgAttr,
    assign,
  } = ctx;

  return {
    "bpmn:SequenceFlow": function (parentGfx: SVGElement, element: BpmnElement) {
      const pathData = createPathFromConnection(element);

      const fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      const attrs = {
        strokeLinejoin: "round",
        markerEnd: marker("sequenceflow-end", fill, stroke),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      const path = drawPath(parentGfx, pathData, attrs);

      const sequenceFlow = getSemantic(element);

      const el = element as unknown as Record<string, unknown>; // safety: bpmn-js element properties are dynamic
      let source: Record<string, unknown> & {
        $instanceOf: (type: string) => boolean;
        default?: unknown;
      };

      if (el.source) {
        source = (el.source as Record<string, unknown>).businessObject as typeof source;

        // conditional flow marker
        if (sequenceFlow.conditionExpression && source.$instanceOf("bpmn:Activity")) {
          svgAttr(path, {
            markerStart: marker("conditional-flow-marker", fill, stroke),
          });
        }

        // default marker
        if (
          source.default &&
          (source.$instanceOf("bpmn:Gateway") || source.$instanceOf("bpmn:Activity")) &&
          source.default === sequenceFlow
        ) {
          svgAttr(path, {
            markerStart: marker("conditional-default-flow-marker", fill, stroke),
          });
        }
      }

      return path;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "bpmn:Association": function (parentGfx: SVGElement, element: any, attrs?: SvgAttrs) {
      const semantic = getSemantic(element);

      const fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      attrs = assign(
        {
          strokeDasharray: "0.5, 5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          stroke: getStrokeColor(element, defaultStrokeColor),
        },
        attrs || {},
      );

      if (!attrs) return;
      if (semantic.associationDirection === "One" || semantic.associationDirection === "Both") {
        attrs.markerEnd = marker("association-end", fill, stroke);
      }

      if (semantic.associationDirection === "Both") {
        attrs.markerStart = marker("association-start", fill, stroke);
      }

      return drawLine(parentGfx, element.waypoints, attrs);
    },
    "bpmn:DataInputAssociation": function (parentGfx: SVGElement, element: BpmnElement) {
      const fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      return renderer("bpmn:Association")(parentGfx, element, {
        markerEnd: marker("association-end", fill, stroke),
      });
    },
    "bpmn:DataOutputAssociation": function (parentGfx: SVGElement, element: BpmnElement) {
      const fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      return renderer("bpmn:Association")(parentGfx, element, {
        markerEnd: marker("association-end", fill, stroke),
      });
    },
    "bpmn:MessageFlow": function (parentGfx: SVGElement, element: BpmnElement) {
      const semantic = getSemantic(element),
        di = getDi(element);

      const fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      const pathData = createPathFromConnection(element);

      const attrs = {
        markerEnd: marker("messageflow-end", fill, stroke),
        markerStart: marker("messageflow-start", fill, stroke),
        strokeDasharray: "10, 12",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "1.5px",
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      const path = drawPath(parentGfx, pathData, attrs);

      if (semantic.messageRef) {
        const midPoint = (path as unknown as SVGPathElement).getPointAtLength( // safety: SVG path element created by bpmn-js renderer
          (path as unknown as SVGPathElement).getTotalLength() / 2, // safety: SVG path element created by bpmn-js renderer
        );

        const markerPathData = pathMap.getScaledPath("MESSAGE_FLOW_MARKER", {
          abspos: {
            x: midPoint.x,
            y: midPoint.y,
          },
        });

        const messageAttrs: SvgAttrs = { strokeWidth: 1 };

        if (di.messageVisibleKind === "initiating") {
          messageAttrs.fill = "white";
          messageAttrs.stroke = "black";
        } else {
          messageAttrs.fill = "#888";
          messageAttrs.stroke = "white";
        }

        drawPath(parentGfx, markerPathData, messageAttrs);
      }

      return path;
    },
  };
}
