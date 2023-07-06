import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  remove as svgRemove,
} from "tiny-svg";

import { getBusinessObject, is } from "../../util/ModelUtil";

import { translate } from "diagram-js/lib/util/SvgTransformUtil";

let MARKER_HIDDEN = "djs-element-hidden",
  MARKER_LABEL_HIDDEN = "djs-label-hidden";

export default function LabelEditingPreview(
  eventBus,
  canvas,
  elementRegistry,
  pathMap
) {
  let self = this;

  let defaultLayer = canvas.getDefaultLayer();

  let element, absoluteElementBBox, gfx;

  eventBus.on("directEditing.activate", function (context) {
    let activeProvider = context.active;

    element = activeProvider.element.label || activeProvider.element;

    // text annotation
    if (is(element, "bpmn:TextAnnotation")) {
      absoluteElementBBox = canvas.getAbsoluteBBox(element);

      gfx = svgCreate("g");

      let textPathData = pathMap.getScaledPath("TEXT_ANNOTATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.0,
          my: 0.0,
        },
      });

      let path = (self.path = svgCreate("path"));

      svgAttr(path, {
        d: textPathData,
        strokeWidth: 2,
        stroke: getStrokeColor(element),
      });

      svgAppend(gfx, path);

      svgAppend(defaultLayer, gfx);

      translate(gfx, element.x, element.y);
    }

    if (is(element, "bpmn:TextAnnotation") || element.labelTarget) {
      canvas.addMarker(element, MARKER_HIDDEN);
    } else if (
      is(element, "bpmn:Task") ||
      is(element, "bpmn:CallActivity") ||
      is(element, "bpmn:Loop") ||
      is(element, "bpmn:Conditional") ||
      is(element, "bpmn:Participant")
    ) {
      canvas.addMarker(element, MARKER_LABEL_HIDDEN);
    }
  });

  eventBus.on("directEditing.resize", function (context) {
    // text annotation
    if (is(element, "bpmn:TextAnnotation")) {
      let height = context.height,
        dy = context.dy;

      let newElementHeight = Math.max(
        (element.height / absoluteElementBBox.height) * (height + dy),
        0
      );

      let textPathData = pathMap.getScaledPath("TEXT_ANNOTATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: newElementHeight,
        position: {
          mx: 0.0,
          my: 0.0,
        },
      });

      svgAttr(self.path, {
        d: textPathData,
      });
    }
  });

  eventBus.on(
    ["directEditing.complete", "directEditing.cancel"],
    function (context) {
      let activeProvider = context.active;

      if (activeProvider) {
        canvas.removeMarker(
          activeProvider.element.label || activeProvider.element,
          MARKER_HIDDEN
        );
        canvas.removeMarker(element, MARKER_LABEL_HIDDEN);
      }

      element = undefined;
      absoluteElementBBox = undefined;

      if (gfx) {
        svgRemove(gfx);

        gfx = undefined;
      }
    }
  );
}

LabelEditingPreview.$inject = [
  "eventBus",
  "canvas",
  "elementRegistry",
  "pathMap",
];

// helpers ///////////////////

function getStrokeColor(element, defaultColor) {
  let bo = getBusinessObject(element);

  return bo.di.get("stroke") || defaultColor || "black";
}
