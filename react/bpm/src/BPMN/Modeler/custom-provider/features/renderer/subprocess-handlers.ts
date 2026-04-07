/**
 * Subprocess handler factories for BpmnRenderer.
 *
 * Contains handlers for: SubProcess, AdHocSubProcess, Transaction,
 * CallActivity, Participant, Lane.
 */
import type { BpmnElement } from "@studio/shared/types";

import type { RendererContext, HandlersMap, SvgAttrs } from "./renderer-types";

export function createSubprocessHandlers(ctx: RendererContext): HandlersMap {
  const {
    drawRect,
    drawLine,
    renderer,
    renderEmbeddedLabel,
    renderLabel,
    renderLaneLabel,
    attachTaskMarkers,
    defaultFillColor,
    defaultStrokeColor,
    styles,
    pathMap: _pathMap,
    getFillColor,
    getStrokeColor,
    getSemantic,
    svgAttr,
    isExpanded,
    isEventSubProcess,
    assign,
    DEFAULT_FILL_OPACITY,
    HIGH_FILL_OPACITY,
    TASK_BORDER_RADIUS,
    INNER_OUTER_DIST,
  } = ctx;

  return {
    "bpmn:SubProcess": function (parentGfx: SVGElement, element: BpmnElement, attrs?: SvgAttrs) {
      attrs = assign(
        {
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        },
        attrs,
      );

      const rect = renderer("bpmn:Activity")(parentGfx, element, attrs);

      const expanded = isExpanded(element);

      if (isEventSubProcess(element)) {
        svgAttr(rect, {
          strokeDasharray: "1,2",
        });
      }

      renderEmbeddedLabel(parentGfx, element, expanded ? "center-top" : "center-middle");

      if (expanded) {
        attachTaskMarkers(parentGfx, element);
      } else {
        attachTaskMarkers(parentGfx, element, ["SubProcessMarker"]);
      }

      return rect;
    },
    "bpmn:AdHocSubProcess": function (parentGfx: SVGElement, element: BpmnElement) {
      return renderer("bpmn:SubProcess")(parentGfx, element);
    },
    "bpmn:Transaction": function (parentGfx: SVGElement, element: BpmnElement) {
      const outer = renderer("bpmn:SubProcess")(parentGfx, element);

      const innerAttrs = styles.style(["no-fill", "no-events"], {
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      /* inner path */ drawRect(
        parentGfx,
        element.width,
        element.height,
        TASK_BORDER_RADIUS - 2,
        INNER_OUTER_DIST,
        innerAttrs,
      );

      return outer;
    },
    "bpmn:CallActivity": function (parentGfx: SVGElement, element: BpmnElement) {
      return renderer("bpmn:SubProcess")(parentGfx, element, {
        strokeWidth: 5,
      });
    },
    "bpmn:Participant": function (parentGfx: SVGElement, element: BpmnElement) {
      const attrs = {
        fillOpacity: DEFAULT_FILL_OPACITY,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      const lane = renderer("bpmn:Lane")(parentGfx, element, attrs);

      const expandedPool = isExpanded(element);

      if (expandedPool) {
        drawLine(
          parentGfx,
          [
            { x: 30, y: 0 },
            { x: 30, y: element.height },
          ],
          {
            stroke: getStrokeColor(element, defaultStrokeColor),
          },
        );
        const text = (getSemantic(element)).name as string;
        renderLaneLabel(parentGfx, text, element);
      } else {
        // Collapsed pool draw text inline
        const text2 = (getSemantic(element)).name as string;
        renderLabel(parentGfx, text2, {
          box: element,
          align: "center-middle",
          style: {
            fill: getStrokeColor(element, defaultStrokeColor),
          },
        });
      }

      const participantMultiplicity = !!getSemantic(element).participantMultiplicity;

      if (participantMultiplicity) {
        renderer("ParticipantMultiplicityMarker")(parentGfx, element);
      }

      return lane;
    },
    "bpmn:Lane": function (parentGfx: SVGElement, element: BpmnElement, attrs?: SvgAttrs) {
      const rect = drawRect(
        parentGfx,
        element.width,
        element.height,
        0,
        assign(
          {
            fill: getFillColor(element, defaultFillColor),
            fillOpacity: HIGH_FILL_OPACITY,
            stroke: getStrokeColor(element, defaultStrokeColor),
          },
          attrs,
        ),
      );

      const semantic = getSemantic(element);

      if (semantic.$type === "bpmn:Lane") {
        const text = semantic.name as string;
        renderLaneLabel(parentGfx, text, element);
      }

      return rect;
    },
  };
}
