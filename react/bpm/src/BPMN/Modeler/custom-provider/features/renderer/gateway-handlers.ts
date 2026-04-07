/**
 * Gateway handler factories for BpmnRenderer.
 *
 * Contains handlers for: InclusiveGateway, ExclusiveGateway,
 * ComplexGateway, ParallelGateway, EventBasedGateway, Gateway.
 */
import type { BpmnElement } from "@studio/shared/types";

import type { RendererContext, HandlersMap } from "./renderer-types";

export function createGatewayHandlers(ctx: RendererContext): HandlersMap {
  const {
    drawCircle,
    drawDiamond,
    drawPath,
    renderer,
    defaultFillColor,
    defaultStrokeColor,
    pathMap,
    getFillColor,
    getStrokeColor,
    getSemantic,
    getDi,
    svgAttr,
    DEFAULT_FILL_OPACITY,
  } = ctx;

  return {
    "bpmn:InclusiveGateway": function (parentGfx: SVGElement, element: BpmnElement) {
      const diamond = renderer("bpmn:Gateway")(parentGfx, element);

      /* circle path */
      drawCircle(parentGfx, element.width, element.height, element.height * 0.24, {
        strokeWidth: 2.5,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return diamond;
    },
    "bpmn:ExclusiveGateway": function (parentGfx: SVGElement, element: BpmnElement) {
      const diamond = renderer("bpmn:Gateway")(parentGfx, element);

      const pathData = pathMap.getScaledPath("GATEWAY_EXCLUSIVE", {
        xScaleFactor: 0.4,
        yScaleFactor: 0.4,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.32,
          my: 0.3,
        },
      });

      if (getDi(element).isMarkerVisible) {
        drawPath(parentGfx, pathData, {
          strokeWidth: 1,
          fill: getStrokeColor(element, defaultStrokeColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        });
      }

      return diamond;
    },
    "bpmn:ComplexGateway": function (parentGfx: SVGElement, element: BpmnElement) {
      const diamond = renderer("bpmn:Gateway")(parentGfx, element);

      const pathData = pathMap.getScaledPath("GATEWAY_COMPLEX", {
        xScaleFactor: 0.5,
        yScaleFactor: 0.5,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.46,
          my: 0.26,
        },
      });

      /* complex path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return diamond;
    },
    "bpmn:ParallelGateway": function (parentGfx: SVGElement, element: BpmnElement) {
      const diamond = renderer("bpmn:Gateway")(parentGfx, element);

      const pathData = pathMap.getScaledPath("GATEWAY_PARALLEL", {
        xScaleFactor: 0.6,
        yScaleFactor: 0.6,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.46,
          my: 0.2,
        },
      });

      /* parallel path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return diamond;
    },
    "bpmn:EventBasedGateway": function (parentGfx: SVGElement, element: BpmnElement) {
      const semantic = getSemantic(element);

      const diamond = renderer("bpmn:Gateway")(parentGfx, element);

      /* outer circle path */ drawCircle(
        parentGfx,
        element.width,
        element.height,
        element.height * 0.2,
        {
          strokeWidth: 1,
          fill: "none",
          stroke: getStrokeColor(element, defaultStrokeColor),
        },
      );

      const type = semantic.eventGatewayType;
      const instantiate = !!semantic.instantiate;

      function drawEvent() {
        const pathData = pathMap.getScaledPath("GATEWAY_EVENT_BASED", {
          xScaleFactor: 0.18,
          yScaleFactor: 0.18,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.36,
            my: 0.44,
          },
        });

        const attrs = {
          strokeWidth: 2,
          fill: getFillColor(element, "none"),
          stroke: getStrokeColor(element, defaultStrokeColor),
        };

        /* event path */ drawPath(parentGfx, pathData, attrs);
      }

      if (type === "Parallel") {
        const pathData = pathMap.getScaledPath("GATEWAY_PARALLEL", {
          xScaleFactor: 0.4,
          yScaleFactor: 0.4,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.474,
            my: 0.296,
          },
        });

        const parallelPath = drawPath(parentGfx, pathData);
        svgAttr(parallelPath, {
          strokeWidth: 1,
          fill: "none",
        });
      } else if (type === "Exclusive") {
        if (!instantiate) {
          const innerCircle = drawCircle(
            parentGfx,
            element.width,
            element.height,
            element.height * 0.26,
          );
          svgAttr(innerCircle, {
            strokeWidth: 1,
            fill: "none",
            stroke: getStrokeColor(element, defaultStrokeColor),
          });
        }

        drawEvent();
      }

      return diamond;
    },
    "bpmn:Gateway": function (parentGfx: SVGElement, element: BpmnElement) {
      const attrs = {
        fill: getFillColor(element, defaultFillColor),
        fillOpacity: DEFAULT_FILL_OPACITY,
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      return drawDiamond(parentGfx, element.width, element.height, attrs);
    },
  };
}
