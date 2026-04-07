/**
 * Data, label, and marker handler factories for BpmnRenderer.
 *
 * Contains handlers for: DataObject, DataObjectReference, DataInput,
 * DataOutput, DataStoreReference, Group, TextAnnotation, label,
 * and all 7 Marker handlers (ParticipantMultiplicityMarker,
 * SubProcessMarker, ParallelMarker, SequentialMarker,
 * CompensationMarker, LoopMarker, AdhocMarker).
 */
import type { BpmnElement } from "@studio/shared/types";

import type { RendererContext, HandlersMap, MarkerPosition } from "./renderer-types";

export function createDataLabelHandlers(ctx: RendererContext): HandlersMap {
  const {
    drawRect,
    drawPath,
    drawMarker,
    renderer,
    as,
    renderLabel,
    renderExternalLabel,
    renderDataItemCollection,
    defaultFillColor,
    defaultStrokeColor,
    pathMap,
    getFillColor,
    getStrokeColor,
    getSemantic,
    isCollection,
    translate,
    DEFAULT_FILL_OPACITY,
    TASK_BORDER_RADIUS,
  } = ctx;

  return {
    "bpmn:DataObject": function (parentGfx: SVGElement, element: BpmnElement) {
      const pathData = pathMap.getScaledPath("DATA_OBJECT_PATH", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.474,
          my: 0.296,
        },
      });

      const elementObject = drawPath(parentGfx, pathData, {
        fill: getFillColor(element, defaultFillColor),
        fillOpacity: DEFAULT_FILL_OPACITY,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      const semantic = getSemantic(element);

      if (isCollection(semantic)) {
        renderDataItemCollection(parentGfx, element);
      }

      return elementObject;
    },
    "bpmn:DataObjectReference": as("bpmn:DataObject"),
    "bpmn:DataInput": function (parentGfx: SVGElement, element: BpmnElement) {
      const arrowPathData = pathMap.getRawPath("DATA_ARROW");

      // page
      const elementObject = renderer("bpmn:DataObject")(parentGfx, element);

      /* input arrow path */ drawPath(parentGfx, arrowPathData, {
        strokeWidth: 1,
      });

      return elementObject;
    },
    "bpmn:DataOutput": function (parentGfx: SVGElement, element: BpmnElement) {
      const arrowPathData = pathMap.getRawPath("DATA_ARROW");

      // page
      const elementObject = renderer("bpmn:DataObject")(parentGfx, element);

      /* output arrow path */ drawPath(parentGfx, arrowPathData, {
        strokeWidth: 1,
        fill: "black",
      });

      return elementObject;
    },
    "bpmn:DataStoreReference": function (parentGfx: SVGElement, element: BpmnElement) {
      const DATA_STORE_PATH = pathMap.getScaledPath("DATA_STORE", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0,
          my: 0.133,
        },
      });

      const elementStore = drawPath(parentGfx, DATA_STORE_PATH, {
        strokeWidth: 2,
        fill: getFillColor(element, defaultFillColor),
        fillOpacity: DEFAULT_FILL_OPACITY,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return elementStore;
    },
    "bpmn:Group": function (parentGfx: SVGElement, element: BpmnElement) {
      const group = drawRect(parentGfx, element.width, element.height, TASK_BORDER_RADIUS, {
        stroke: getStrokeColor(element, defaultStrokeColor),
        strokeWidth: 1,
        strokeDasharray: "8,3,1,3",
        fill: "none",
        pointerEvents: "none",
      });

      return group;
    },
    label: function (parentGfx: SVGElement, element: BpmnElement) {
      return renderExternalLabel(parentGfx, element);
    },
    "bpmn:TextAnnotation": function (parentGfx: SVGElement, element: BpmnElement) {
      const style = {
        fill: "none",
        stroke: "none",
      };

      const textElement = drawRect(parentGfx, element.width, element.height, 0, 0, style);

      const textPathData = pathMap.getScaledPath("TEXT_ANNOTATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.0,
          my: 0.0,
        },
      });

      drawPath(parentGfx, textPathData, {
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      const text = ((getSemantic(element)).text as string) || "";
      renderLabel(parentGfx, text, {
        box: element,
        align: "left-top",
        padding: 5,
        style: {
          fill: getStrokeColor(element, defaultStrokeColor),
        },
      });

      return textElement;
    },
    ParticipantMultiplicityMarker: function (parentGfx: SVGElement, element: BpmnElement) {
      const markerPath = pathMap.getScaledPath("MARKER_PARALLEL", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: element.width / 2 / element.width,
          my: (element.height - 15) / element.height,
        },
      });

      drawMarker("participant-multiplicity", parentGfx, markerPath, {
        strokeWidth: 2,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
    SubProcessMarker: function (parentGfx: SVGElement, element: BpmnElement) {
      const markerRect = drawRect(parentGfx, 14, 14, 0, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      // Process marker is placed in the middle of the box
      // therefore fixed values can be used here
      translate(markerRect, element.width / 2 - 7.5, element.height - 20);

      const markerPath = pathMap.getScaledPath("MARKER_SUB_PROCESS", {
        xScaleFactor: 1.5,
        yScaleFactor: 1.5,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 - 7.5) / element.width,
          my: (element.height - 20) / element.height,
        },
      });

      drawMarker("sub-process", parentGfx, markerPath, {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
    ParallelMarker: function (
      parentGfx: SVGElement,
      element: BpmnElement,
      position: MarkerPosition,
    ) {
      const markerPath = pathMap.getScaledPath("MARKER_PARALLEL", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 + position.parallel) / element.width,
          my: (element.height - 20) / element.height,
        },
      });

      drawMarker("parallel", parentGfx, markerPath, {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
    SequentialMarker: function (
      parentGfx: SVGElement,
      element: BpmnElement,
      position: MarkerPosition,
    ) {
      const markerPath = pathMap.getScaledPath("MARKER_SEQUENTIAL", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 + position.seq) / element.width,
          my: (element.height - 19) / element.height,
        },
      });

      drawMarker("sequential", parentGfx, markerPath, {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
    CompensationMarker: function (
      parentGfx: SVGElement,
      element: BpmnElement,
      position: MarkerPosition,
    ) {
      const markerMath = pathMap.getScaledPath("MARKER_COMPENSATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 + position.compensation) / element.width,
          my: (element.height - 13) / element.height,
        },
      });

      drawMarker("compensation", parentGfx, markerMath, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
    LoopMarker: function (parentGfx: SVGElement, element: BpmnElement, position: MarkerPosition) {
      const markerPath = pathMap.getScaledPath("MARKER_LOOP", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 + position.loop) / element.width,
          my: (element.height - 7) / element.height,
        },
      });

      drawMarker("loop", parentGfx, markerPath, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
        strokeLinecap: "round",
        strokeMiterlimit: 0.5,
      });
    },
    AdhocMarker: function (parentGfx: SVGElement, element: BpmnElement, position: MarkerPosition) {
      const markerPath = pathMap.getScaledPath("MARKER_ADHOC", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 + position.adhoc) / element.width,
          my: (element.height - 15) / element.height,
        },
      });

      drawMarker("adhoc", parentGfx, markerPath, {
        strokeWidth: 1,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
  };
}
