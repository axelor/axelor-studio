import inherits from "inherits";
import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import Ids from "ids";
import { createLine } from "diagram-js/lib/util/RenderUtil";
import { isObject, assign, forEach } from "min-dash";
import { query as domQuery } from "min-dom";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses,
} from "tiny-svg";
import {
  rotate,
  transform,
  translate,
} from "diagram-js/lib/util/SvgTransformUtil";

import { isExpanded, isEventLoop } from "../util/DiUtil";
import { getLabel } from "../features/label-editing/LabelUtil";
import { is } from "../util/ModelUtil";
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
} from "./BpmnRenderUtil";

const RENDERER_IDS = new Ids();

const TASK_BORDER_RADIUS = 10;
const INNER_OUTER_DIST = 3;

const DEFAULT_FILL_OPACITY = 0.95,
  HIGH_FILL_OPACITY = 0.35;

export default function BpmnRenderer(
  config,
  eventBus,
  styles,
  pathMap,
  canvas,
  textRenderer,
  priority
) {
  BaseRenderer.call(this, eventBus, priority);

  let defaultFillColor = config && config.defaultFillColor,
    defaultStrokeColor = config && config.defaultStrokeColor;

  let rendererId = RENDERER_IDS.next();

  let markers = {};

  let computeStyle = styles.computeStyle;

  function addMarker(id, options) {
    let attrs = assign(
      {
        fill: "black",
        strokeWidth: 1,
        strokeLinecap: "round",
        strokeDasharray: "none",
      },
      options.attrs
    );

    let ref = options.ref || { x: 0, y: 0 };

    let scale = options.scale || 1;

    // fix for safari / chrome / firefox bug not correctly
    // resetting stroke dash array
    if (attrs.strokeDasharray === "none") {
      attrs.strokeDasharray = [10000, 1];
    }

    let marker = svgCreate("marker");

    svgAttr(options.element, attrs);

    svgAppend(marker, options.element);

    svgAttr(marker, {
      id: id,
      viewBox: "0 0 20 20",
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: "auto",
    });

    let defs = domQuery("defs", canvas._svg);

    if (!defs) {
      defs = svgCreate("defs");

      svgAppend(canvas._svg, defs);
    }

    svgAppend(defs, marker);

    markers[id] = marker;
  }

  function colorEscape(str) {
    // only allow characters and numbers
    return str.replace(/[^0-9a-zA-z]+/g, "_");
  }

  function marker(type, fill, stroke) {
    let id =
      type +
      "-" +
      colorEscape(fill) +
      "-" +
      colorEscape(stroke) +
      "-" +
      rendererId;

    if (!markers[id]) {
      createMarker(id, type, fill, stroke);
    }

    return "url(#" + id + ")";
  }

  function createMarker(id, type, fill, stroke) {
    if (type === "sequenceflow-end") {
      let sequenceflowEnd = svgCreate("path");
      svgAttr(sequenceflowEnd, { d: "M 1 5 L 11 10 L 1 15 Z" });

      addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill: stroke,
          stroke: stroke,
        },
      });
    }

    if (type === "messageflow-start") {
      let messageflowStart = svgCreate("circle");
      svgAttr(messageflowStart, { cx: 6, cy: 6, r: 3.5 });

      addMarker(id, {
        element: messageflowStart,
        attrs: {
          fill: fill,
          stroke: stroke,
        },
        ref: { x: 6, y: 6 },
      });
    }

    if (type === "messageflow-end") {
      let messageflowEnd = svgCreate("path");
      svgAttr(messageflowEnd, { d: "m 1 5 l 0 -3 l 7 3 l -7 3 z" });

      addMarker(id, {
        element: messageflowEnd,
        attrs: {
          fill: fill,
          stroke: stroke,
          strokeLinecap: "butt",
        },
        ref: { x: 8.5, y: 5 },
      });
    }

    if (type === "association-start") {
      let associationStart = svgCreate("path");
      svgAttr(associationStart, { d: "M 11 5 L 1 10 L 11 15" });

      addMarker(id, {
        element: associationStart,
        attrs: {
          fill: "none",
          stroke: stroke,
          strokeWidth: 1.5,
        },
        ref: { x: 1, y: 10 },
        scale: 0.5,
      });
    }

    if (type === "association-end") {
      let associationEnd = svgCreate("path");
      svgAttr(associationEnd, { d: "M 1 5 L 11 10 L 1 15" });

      addMarker(id, {
        element: associationEnd,
        attrs: {
          fill: "none",
          stroke: stroke,
          strokeWidth: 1.5,
        },
        ref: { x: 12, y: 10 },
        scale: 0.5,
      });
    }

    if (type === "conditional-flow-marker") {
      let conditionalflowMarker = svgCreate("path");
      svgAttr(conditionalflowMarker, { d: "M 0 10 L 8 6 L 16 10 L 8 14 Z" });

      addMarker(id, {
        element: conditionalflowMarker,
        attrs: {
          fill: fill,
          stroke: stroke,
        },
        ref: { x: -1, y: 10 },
        scale: 0.5,
      });
    }

    if (type === "conditional-default-flow-marker") {
      let conditionaldefaultflowMarker = svgCreate("path");
      svgAttr(conditionaldefaultflowMarker, { d: "M 6 4 L 10 16" });

      addMarker(id, {
        element: conditionaldefaultflowMarker,
        attrs: {
          stroke: stroke,
        },
        ref: { x: 0, y: 10 },
        scale: 0.5,
      });
    }
  }

  function drawCircle(parentGfx, width, height, offset, attrs) {
    if (isObject(offset)) {
      attrs = offset;
      offset = 0;
    }

    offset = offset || 0;

    attrs = computeStyle(attrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white",
    });

    if (attrs.fill === "none") {
      delete attrs.fillOpacity;
    }

    let cx = width / 2,
      cy = height / 2;

    let circle = svgCreate("circle");
    svgAttr(circle, {
      cx: cx,
      cy: cy,
      r: Math.round((width + height) / 4 - offset),
    });
    svgAttr(circle, attrs);

    svgAppend(parentGfx, circle);

    return circle;
  }

  function drawRect(parentGfx, width, height, r, offset, attrs) {
    if (isObject(offset)) {
      attrs = offset;
      offset = 0;
    }

    offset = offset || 0;

    attrs = computeStyle(attrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white",
    });

    let rect = svgCreate("rect");
    svgAttr(rect, {
      x: offset,
      y: offset,
      width: width - offset * 2,
      height: height - offset * 2,
      rx: r,
      ry: r,
    });
    svgAttr(rect, attrs);

    svgAppend(parentGfx, rect);

    return rect;
  }

  function drawDiamond(parentGfx, width, height, attrs) {
    let x_2 = width / 2;
    let y_2 = height / 2;

    let points = [
      { x: x_2, y: 0 },
      { x: width, y: y_2 },
      { x: x_2, y: height },
      { x: 0, y: y_2 },
    ];

    let pointsString = points
      .map(function (point) {
        return point.x + "," + point.y;
      })
      .join(" ");

    attrs = computeStyle(attrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white",
    });

    let polygon = svgCreate("polygon");
    svgAttr(polygon, {
      points: pointsString,
    });
    svgAttr(polygon, attrs);

    svgAppend(parentGfx, polygon);

    return polygon;
  }

  function drawLine(parentGfx, waypoints, attrs) {
    attrs = computeStyle(attrs, ["no-fill"], {
      stroke: "black",
      strokeWidth: 2,
      fill: "none",
    });

    let line = createLine(waypoints, attrs);

    svgAppend(parentGfx, line);

    return line;
  }

  function drawPath(parentGfx, d, attrs) {
    attrs = computeStyle(attrs, ["no-fill"], {
      strokeWidth: 2,
      stroke: "black",
    });

    let path = svgCreate("path");
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }

  function drawMarker(type, parentGfx, path, attrs) {
    return drawPath(parentGfx, path, assign({ "data-marker": type }, attrs));
  }

  function as(type) {
    return function (parentGfx, element) {
      return handlers[type](parentGfx, element);
    };
  }

  function renderer(type) {
    return handlers[type];
  }

  function renderEventContent(element, parentGfx) {
    let event = getSemantic(element);
    let isThrowing = isThrowEvent(event);

    if (event.eventDefinitions && event.eventDefinitions.length > 1) {
      if (event.parallelMultiple) {
        return renderer("bpmn:ParallelMultipleEventDefinition")(
          parentGfx,
          element,
          isThrowing
        );
      } else {
        return renderer("bpmn:MultipleEventDefinition")(
          parentGfx,
          element,
          isThrowing
        );
      }
    }

    if (isTypedEvent(event, "bpmn:MessageEventDefinition")) {
      return renderer("bpmn:MessageEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:TimerEventDefinition")) {
      return renderer("bpmn:TimerEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:ConditionalEventDefinition")) {
      return renderer("bpmn:ConditionalEventDefinition")(parentGfx, element);
    }

    if (isTypedEvent(event, "bpmn:SignalEventDefinition")) {
      return renderer("bpmn:SignalEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:EscalationEventDefinition")) {
      return renderer("bpmn:EscalationEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:LinkEventDefinition")) {
      return renderer("bpmn:LinkEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:ErrorEventDefinition")) {
      return renderer("bpmn:ErrorEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:CancelEventDefinition")) {
      return renderer("bpmn:CancelEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:CompensateEventDefinition")) {
      return renderer("bpmn:CompensateEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    if (isTypedEvent(event, "bpmn:TerminateEventDefinition")) {
      return renderer("bpmn:TerminateEventDefinition")(
        parentGfx,
        element,
        isThrowing
      );
    }

    return null;
  }

  function renderLabel(parentGfx, label, options) {
    options = assign(
      {
        size: {
          width: 100,
        },
      },
      options
    );

    let text = textRenderer.createText(label || "", options);

    svgClasses(text).add("djs-label");

    svgAppend(parentGfx, text);

    return text;
  }

  function renderEmbeddedLabel(parentGfx, element, align) {
    let semantic = getSemantic(element);

    return renderLabel(parentGfx, semantic.name, {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: getStrokeColor(element, defaultStrokeColor),
      },
    });
  }

  function renderExternalLabel(parentGfx, element) {
    let box = {
      width: 90,
      height: 30,
      x: element.width / 2 + element.x,
      y: element.height / 2 + element.y,
    };

    return renderLabel(parentGfx, getLabel(element), {
      box: box,
      fitBox: true,
      style: assign({}, textRenderer.getExternalStyle(), {
        fill: getStrokeColor(element, defaultStrokeColor),
      }),
    });
  }

  function renderLaneLabel(parentGfx, text, element) {
    let textBox = renderLabel(parentGfx, text, {
      box: {
        height: 30,
        width: element.height,
      },
      align: "center-middle",
      style: {
        fill: getStrokeColor(element, defaultStrokeColor),
      },
    });

    let top = -1 * element.height;

    transform(textBox, 0, -top, 270);
  }

  function createPathFromConnection(connection) {
    let waypoints = connection.waypoints;

    let pathData = "m  " + waypoints[0].x + "," + waypoints[0].y;
    for (let i = 1; i < waypoints.length; i++) {
      pathData += "L" + waypoints[i].x + "," + waypoints[i].y + " ";
    }
    return pathData;
  }

  let handlers = (this.handlers = {
    "bpmn:Event": function (parentGfx, element, attrs) {
      if (!("fillOpacity" in attrs)) {
        attrs.fillOpacity = DEFAULT_FILL_OPACITY;
      }

      return drawCircle(parentGfx, element.width, element.height, attrs);
    },
    "bpmn:StartEvent": function (parentGfx, element) {
      let attrs = {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      let semantic = getSemantic(element);

      if (!semantic.isInterrupting) {
        attrs = {
          strokeDasharray: "6",
          strokeLinecap: "round",
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        };
      }

      let circle = renderer("bpmn:Event")(parentGfx, element, attrs);

      renderEventContent(element, parentGfx);

      return circle;
    },
    "bpmn:MessageEventDefinition": function (parentGfx, element, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_MESSAGE", {
        xScaleFactor: 0.9,
        yScaleFactor: 0.9,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.235,
          my: 0.315,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(element, defaultStrokeColor)
        : getFillColor(element, defaultFillColor);
      let stroke = isThrowing
        ? getFillColor(element, defaultFillColor)
        : getStrokeColor(element, defaultStrokeColor);

      let messagePath = drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: stroke,
      });

      return messagePath;
    },
    "bpmn:TimerEventDefinition": function (parentGfx, element) {
      let circle = drawCircle(
        parentGfx,
        element.width,
        element.height,
        0.2 * element.height,
        {
          strokeWidth: 2,
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        }
      );

      let pathData = pathMap.getScaledPath("EVENT_TIMER_WH", {
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
        let linePathData = pathMap.getScaledPath("EVENT_TIMER_LINE", {
          xScaleFactor: 0.75,
          yScaleFactor: 0.75,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.5,
            my: 0.5,
          },
        });

        let width = element.width / 2;
        let height = element.height / 2;

        drawPath(parentGfx, linePathData, {
          strokeWidth: 1,
          strokeLinecap: "square",
          transform: "rotate(" + i * 30 + "," + height + "," + width + ")",
          stroke: getStrokeColor(element, defaultStrokeColor),
        });
      }

      return circle;
    },
    "bpmn:EscalationEventDefinition": function (parentGfx, event, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_ESCALATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.2,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(event, defaultStrokeColor)
        : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:ConditionalEventDefinition": function (parentGfx, event) {
      let pathData = pathMap.getScaledPath("EVENT_CONDITIONAL", {
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
    "bpmn:LinkEventDefinition": function (parentGfx, event, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_LINK", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.57,
          my: 0.263,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(event, defaultStrokeColor)
        : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:ErrorEventDefinition": function (parentGfx, event, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_ERROR", {
        xScaleFactor: 1.1,
        yScaleFactor: 1.1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.2,
          my: 0.722,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(event, defaultStrokeColor)
        : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:CancelEventDefinition": function (parentGfx, event, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_CANCEL_45", {
        xScaleFactor: 1.0,
        yScaleFactor: 1.0,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.638,
          my: -0.055,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(event, defaultStrokeColor)
        : "none";

      let path = drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });

      rotate(path, 45);

      return path;
    },
    "bpmn:CompensateEventDefinition": function (parentGfx, event, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_COMPENSATION", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.22,
          my: 0.5,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(event, defaultStrokeColor)
        : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:SignalEventDefinition": function (parentGfx, event, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_SIGNAL", {
        xScaleFactor: 0.9,
        yScaleFactor: 0.9,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.2,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(event, defaultStrokeColor)
        : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: getStrokeColor(event, defaultStrokeColor),
      });
    },
    "bpmn:MultipleEventDefinition": function (parentGfx, event, isThrowing) {
      let pathData = pathMap.getScaledPath("EVENT_MULTIPLE", {
        xScaleFactor: 1.1,
        yScaleFactor: 1.1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.222,
          my: 0.36,
        },
      });

      let fill = isThrowing
        ? getStrokeColor(event, defaultStrokeColor)
        : "none";

      return drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: fill,
      });
    },
    "bpmn:ParallelMultipleEventDefinition": function (parentGfx, event) {
      let pathData = pathMap.getScaledPath("EVENT_PARALLEL_MULTIPLE", {
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
    "bpmn:EndEvent": function (parentGfx, element) {
      let circle = renderer("bpmn:Event")(parentGfx, element, {
        strokeWidth: 4,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      renderEventContent(element, parentGfx, true);

      return circle;
    },
    "bpmn:TerminateEventDefinition": function (parentGfx, element) {
      let circle = drawCircle(parentGfx, element.width, element.height, 8, {
        strokeWidth: 4,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return circle;
    },
    "bpmn:IntermediateEvent": function (parentGfx, element) {
      let outer = renderer("bpmn:Event")(parentGfx, element, {
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

    "bpmn:Activity": function (parentGfx, element, attrs) {
      attrs = attrs || {};

      if (!("fillOpacity" in attrs)) {
        attrs.fillOpacity = DEFAULT_FILL_OPACITY;
      }

      return drawRect(
        parentGfx,
        element.width,
        element.height,
        TASK_BORDER_RADIUS,
        attrs
      );
    },

    "bpmn:Task": function (parentGfx, element) {
      let attrs = {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      let rect = renderer("bpmn:Activity")(parentGfx, element, attrs);

      renderEmbeddedLabel(parentGfx, element, "center-middle");
      attachTaskMarkers(parentGfx, element);

      return rect;
    },
    "bpmn:Mapper": function (parentGfx, element) {
      let attrs = {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      let rect = renderer("bpmn:Activity")(parentGfx, element, attrs);

      renderEmbeddedLabel(parentGfx, element, "center-middle");
      attachTaskMarkers(parentGfx, element);

      return rect;
    },
    "bpmn:Function": function (parentGfx, element) {
      let attrs = {
        fill: getFillColor(element, defaultFillColor),
        stroke: "#00b0ff",
      };

      let rect = renderer("bpmn:Activity")(parentGfx, element, attrs);

      renderEmbeddedLabel(parentGfx, element, "center-middle");
      attachTaskMarkers(parentGfx, element);

      return rect;
    },
    "bpmn:ServiceTask": function (parentGfx, element) {
      let task = renderer("bpmn:Task")(parentGfx, element);

      let pathDataBG = pathMap.getScaledPath("TASK_TYPE_SERVICE", {
        abspos: {
          x: 12,
          y: 18,
        },
      });

      /* service bg */ drawPath(parentGfx, pathDataBG, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      let fillPathData = pathMap.getScaledPath("TASK_TYPE_SERVICE_FILL", {
        abspos: {
          x: 17.2,
          y: 18,
        },
      });

      /* service fill */ drawPath(parentGfx, fillPathData, {
        strokeWidth: 0,
        fill: getFillColor(element, defaultFillColor),
      });

      let pathData = pathMap.getScaledPath("TASK_TYPE_SERVICE", {
        abspos: {
          x: 17,
          y: 22,
        },
      });

      /* service */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:UserTask": function (parentGfx, element) {
      let task = renderer("bpmn:Task")(parentGfx, element);

      let x = 15;
      let y = 12;

      let pathData = pathMap.getScaledPath("TASK_TYPE_USER_1", {
        abspos: {
          x: x,
          y: y,
        },
      });

      /* user path */ drawPath(parentGfx, pathData, {
        strokeWidth: 0.5,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      let pathData2 = pathMap.getScaledPath("TASK_TYPE_USER_2", {
        abspos: {
          x: x,
          y: y,
        },
      });

      /* user2 path */ drawPath(parentGfx, pathData2, {
        strokeWidth: 0.5,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      let pathData3 = pathMap.getScaledPath("TASK_TYPE_USER_3", {
        abspos: {
          x: x,
          y: y,
        },
      });

      /* user3 path */ drawPath(parentGfx, pathData3, {
        strokeWidth: 0.5,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:ManualTask": function (parentGfx, element) {
      let task = renderer("bpmn:Task")(parentGfx, element);

      let pathData = pathMap.getScaledPath("TASK_TYPE_MANUAL", {
        abspos: {
          x: 17,
          y: 15,
        },
      });

      /* manual path */ drawPath(parentGfx, pathData, {
        strokeWidth: 0.5, // 0.25,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:SendTask": function (parentGfx, element) {
      let task = renderer("bpmn:Task")(parentGfx, element);

      let pathData = pathMap.getScaledPath("TASK_TYPE_SEND", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: 21,
        containerHeight: 14,
        position: {
          mx: 0.285,
          my: 0.357,
        },
      });

      /* send path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getFillColor(element, defaultFillColor),
      });

      return task;
    },
    "bpmn:ReceiveTask": function (parentGfx, element) {
      let semantic = getSemantic(element);

      let task = renderer("bpmn:Task")(parentGfx, element);
      let pathData;

      if (semantic.instantiate) {
        drawCircle(parentGfx, 28, 28, 20 * 0.22, { strokeWidth: 1 });

        pathData = pathMap.getScaledPath("TASK_TYPE_INSTANTIATING_SEND", {
          abspos: {
            x: 7.77,
            y: 9.52,
          },
        });
      } else {
        pathData = pathMap.getScaledPath("TASK_TYPE_SEND", {
          xScaleFactor: 0.9,
          yScaleFactor: 0.9,
          containerWidth: 21,
          containerHeight: 14,
          position: {
            mx: 0.3,
            my: 0.4,
          },
        });
      }

      /* receive path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:ScriptTask": function (parentGfx, element) {
      let task = renderer("bpmn:Task")(parentGfx, element);

      let pathData = pathMap.getScaledPath("TASK_TYPE_SCRIPT", {
        abspos: {
          x: 15,
          y: 20,
        },
      });

      /* script path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:BusinessRuleTask": function (parentGfx, element) {
      let task = renderer("bpmn:Task")(parentGfx, element);

      let headerPathData = pathMap.getScaledPath(
        "TASK_TYPE_BUSINESS_RULE_HEADER",
        {
          abspos: {
            x: 8,
            y: 8,
          },
        }
      );

      let businessHeaderPath = drawPath(parentGfx, headerPathData);
      svgAttr(businessHeaderPath, {
        strokeWidth: 1,
        fill: getFillColor(element, "#aaaaaa"),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      let headerData = pathMap.getScaledPath("TASK_TYPE_BUSINESS_RULE_MAIN", {
        abspos: {
          x: 8,
          y: 8,
        },
      });

      let businessPath = drawPath(parentGfx, headerData);
      svgAttr(businessPath, {
        strokeWidth: 1,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:Loop": function (parentGfx, element, attrs) {
      attrs = assign(
        {
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        },
        attrs
      );

      let rect = renderer("bpmn:Activity")(parentGfx, element, attrs);

      if (isEventLoop(element)) {
        svgAttr(rect, {
          strokeDasharray: "1,2",
        });
      }

      renderEmbeddedLabel(parentGfx, element, "center-top");
      attachTaskMarkers(parentGfx, element, ["LoopProcessMarker"]);
      return rect;
    },
    "bpmn:Conditional": function (parentGfx, element, attrs) {
      attrs = assign(
        {
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        },
        attrs
      );

      let rect = renderer("bpmn:Activity")(parentGfx, element, attrs);

      if (isEventLoop(element)) {
        svgAttr(rect, {
          strokeDasharray: "1,2",
        });
      }
      renderEmbeddedLabel(parentGfx, element, "center-top");
      attachTaskMarkers(parentGfx, element, ["ConditionalMarker"]);
      return rect;
    },
    "bpmn:AdHocSubProcess": function (parentGfx, element) {
      return renderer("bpmn:Loop")(parentGfx, element);
    },
    "bpmn:Transaction": function (parentGfx, element) {
      let outer = renderer("bpmn:Loop")(parentGfx, element);

      let innerAttrs = styles.style(["no-fill", "no-events"], {
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      /* inner path */ drawRect(
        parentGfx,
        element.width,
        element.height,
        TASK_BORDER_RADIUS - 2,
        INNER_OUTER_DIST,
        innerAttrs
      );

      return outer;
    },
    "bpmn:CallActivity": function (parentGfx, element) {
      return renderer("bpmn:Loop")(parentGfx, element, {
        strokeWidth: 5,
      });
    },
    "bpmn:Participant": function (parentGfx, element) {
      let attrs = {
        fillOpacity: DEFAULT_FILL_OPACITY,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      let lane = renderer("bpmn:Lane")(parentGfx, element, attrs);

      let expandedPool = isExpanded(element);

      if (expandedPool) {
        drawLine(
          parentGfx,
          [
            { x: 30, y: 0 },
            { x: 30, y: element.height },
          ],
          {
            stroke: getStrokeColor(element, defaultStrokeColor),
          }
        );
        let text = getSemantic(element).name;
        renderLaneLabel(parentGfx, text, element);
      } else {
        // Collapsed pool draw text inline
        let text2 = getSemantic(element).name;
        renderLabel(parentGfx, text2, {
          box: element,
          align: "center-middle",
          style: {
            fill: getStrokeColor(element, defaultStrokeColor),
          },
        });
      }

      let participantMultiplicity =
        !!getSemantic(element).participantMultiplicity;

      if (participantMultiplicity) {
        renderer("ParticipantMultiplicityMarker")(parentGfx, element);
      }

      return lane;
    },
    "bpmn:Lane": function (parentGfx, element, attrs) {
      let rect = drawRect(
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
          attrs
        )
      );

      let semantic = getSemantic(element);

      if (semantic.$type === "bpmn:Lane") {
        let text = semantic.name;
        renderLaneLabel(parentGfx, text, element);
      }

      return rect;
    },
    "bpmn:InclusiveGateway": function (parentGfx, element) {
      let diamond = renderer("bpmn:Gateway")(parentGfx, element);

      /* circle path */
      drawCircle(
        parentGfx,
        element.width,
        element.height,
        element.height * 0.24,
        {
          strokeWidth: 2.5,
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor),
        }
      );

      return diamond;
    },
    "bpmn:ExclusiveGateway": function (parentGfx, element) {
      let diamond = renderer("bpmn:Gateway")(parentGfx, element);

      let pathData = pathMap.getScaledPath("GATEWAY_EXCLUSIVE", {
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
    "bpmn:Query": function (parentGfx, element) {
      let diamond = renderer("bpmn:Gateway")(parentGfx, element);

      let pathData = pathMap.getScaledPath("GATEWAY_EXCLUSIVE", {
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
    "bpmn:ComplexGateway": function (parentGfx, element) {
      let diamond = renderer("bpmn:Gateway")(parentGfx, element);

      let pathData = pathMap.getScaledPath("GATEWAY_COMPLEX", {
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
    "bpmn:ParallelGateway": function (parentGfx, element) {
      let diamond = renderer("bpmn:Gateway")(parentGfx, element);

      let pathData = pathMap.getScaledPath("GATEWAY_PARALLEL", {
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
    "bpmn:EventBasedGateway": function (parentGfx, element) {
      let semantic = getSemantic(element);

      let diamond = renderer("bpmn:Gateway")(parentGfx, element);

      /* outer circle path */ drawCircle(
        parentGfx,
        element.width,
        element.height,
        element.height * 0.2,
        {
          strokeWidth: 1,
          fill: "none",
          stroke: getStrokeColor(element, defaultStrokeColor),
        }
      );

      let type = semantic.eventGatewayType;
      let instantiate = !!semantic.instantiate;

      function drawEvent() {
        let pathData = pathMap.getScaledPath("GATEWAY_EVENT_BASED", {
          xScaleFactor: 0.18,
          yScaleFactor: 0.18,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.36,
            my: 0.44,
          },
        });

        let attrs = {
          strokeWidth: 2,
          fill: getFillColor(element, "none"),
          stroke: getStrokeColor(element, defaultStrokeColor),
        };

        /* event path */ drawPath(parentGfx, pathData, attrs);
      }

      if (type === "Parallel") {
        let pathData = pathMap.getScaledPath("GATEWAY_PARALLEL", {
          xScaleFactor: 0.4,
          yScaleFactor: 0.4,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.474,
            my: 0.296,
          },
        });

        let parallelPath = drawPath(parentGfx, pathData);
        svgAttr(parallelPath, {
          strokeWidth: 1,
          fill: "none",
        });
      } else if (type === "Exclusive") {
        if (!instantiate) {
          let innerCircle = drawCircle(
            parentGfx,
            element.width,
            element.height,
            element.height * 0.26
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
    "bpmn:Gateway": function (parentGfx, element) {
      let attrs = {
        fill: getFillColor(element, defaultFillColor),
        fillOpacity: DEFAULT_FILL_OPACITY,
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      return drawDiamond(parentGfx, element.width, element.height, attrs);
    },
    "bpmn:SequenceFlow": function (parentGfx, element) {
      let pathData = createPathFromConnection(element);

      let fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      let attrs = {
        strokeLinejoin: "round",
        markerEnd: marker("sequenceflow-end", fill, stroke),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      let path = drawPath(parentGfx, pathData, attrs);

      let sequenceFlow = getSemantic(element);

      let source;

      if (element.source) {
        source = element.source.businessObject;

        // conditional flow marker
        if (
          sequenceFlow.conditionExpression &&
          source.$instanceOf("bpmn:Activity")
        ) {
          svgAttr(path, {
            markerStart: marker("conditional-flow-marker", fill, stroke),
          });
        }

        // default marker
        if (
          source.default &&
          (source.$instanceOf("bpmn:Gateway") ||
            source.$instanceOf("bpmn:Activity")) &&
          source.default === sequenceFlow
        ) {
          svgAttr(path, {
            markerStart: marker(
              "conditional-default-flow-marker",
              fill,
              stroke
            ),
          });
        }
      }

      return path;
    },
    "bpmn:Association": function (parentGfx, element, attrs) {
      let semantic = getSemantic(element);

      let fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      attrs = assign(
        {
          strokeDasharray: "0.5, 5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          stroke: getStrokeColor(element, defaultStrokeColor),
        },
        attrs || {}
      );

      if (
        semantic.associationDirection === "One" ||
        semantic.associationDirection === "Both"
      ) {
        attrs.markerEnd = marker("association-end", fill, stroke);
      }

      if (semantic.associationDirection === "Both") {
        attrs.markerStart = marker("association-start", fill, stroke);
      }

      return drawLine(parentGfx, element.waypoints, attrs);
    },
    "bpmn:DataInputAssociation": function (parentGfx, element) {
      let fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      return renderer("bpmn:Association")(parentGfx, element, {
        markerEnd: marker("association-end", fill, stroke),
      });
    },
    "bpmn:DataOutputAssociation": function (parentGfx, element) {
      let fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      return renderer("bpmn:Association")(parentGfx, element, {
        markerEnd: marker("association-end", fill, stroke),
      });
    },
    "bpmn:MessageFlow": function (parentGfx, element) {
      let semantic = getSemantic(element),
        di = getDi(element);

      let fill = getFillColor(element, defaultFillColor),
        stroke = getStrokeColor(element, defaultStrokeColor);

      let pathData = createPathFromConnection(element);

      let attrs = {
        markerEnd: marker("messageflow-end", fill, stroke),
        markerStart: marker("messageflow-start", fill, stroke),
        strokeDasharray: "10, 12",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "1.5px",
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      let path = drawPath(parentGfx, pathData, attrs);

      if (semantic.messageRef) {
        let midPoint = path.getPointAtLength(path.getTotalLength() / 2);

        let markerPathData = pathMap.getScaledPath("MESSAGE_FLOW_MARKER", {
          abspos: {
            x: midPoint.x,
            y: midPoint.y,
          },
        });

        let messageAttrs = { strokeWidth: 1 };

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
    "bpmn:DataObject": function (parentGfx, element) {
      let pathData = pathMap.getScaledPath("DATA_OBJECT_PATH", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.474,
          my: 0.296,
        },
      });

      let elementObject = drawPath(parentGfx, pathData, {
        fill: getFillColor(element, defaultFillColor),
        fillOpacity: DEFAULT_FILL_OPACITY,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      let semantic = getSemantic(element);

      if (isCollection(semantic)) {
        renderDataItemCollection(parentGfx, element);
      }

      return elementObject;
    },
    "bpmn:DataObjectReference": as("bpmn:DataObject"),
    "bpmn:DataInput": function (parentGfx, element) {
      let arrowPathData = pathMap.getRawPath("DATA_ARROW");

      // page
      let elementObject = renderer("bpmn:DataObject")(parentGfx, element);

      /* input arrow path */ drawPath(parentGfx, arrowPathData, {
        strokeWidth: 1,
      });

      return elementObject;
    },
    "bpmn:DataOutput": function (parentGfx, element) {
      let arrowPathData = pathMap.getRawPath("DATA_ARROW");

      // page
      let elementObject = renderer("bpmn:DataObject")(parentGfx, element);

      /* output arrow path */ drawPath(parentGfx, arrowPathData, {
        strokeWidth: 1,
        fill: "black",
      });

      return elementObject;
    },
    "bpmn:DataStoreReference": function (parentGfx, element) {
      let DATA_STORE_PATH = pathMap.getScaledPath("DATA_STORE", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0,
          my: 0.133,
        },
      });

      let elementStore = drawPath(parentGfx, DATA_STORE_PATH, {
        strokeWidth: 2,
        fill: getFillColor(element, defaultFillColor),
        fillOpacity: DEFAULT_FILL_OPACITY,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return elementStore;
    },
    "bpmn:BoundaryEvent": function (parentGfx, element) {
      let semantic = getSemantic(element),
        cancel = semantic.cancelActivity;

      let attrs = {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      if (!cancel) {
        attrs.strokeDasharray = "6";
        attrs.strokeLinecap = "round";
      }

      // apply fillOpacity
      let outerAttrs = assign({}, attrs, {
        fillOpacity: 1,
      });

      // apply no-fill
      let innerAttrs = assign({}, attrs, {
        fill: "none",
      });

      let outer = renderer("bpmn:Event")(parentGfx, element, outerAttrs);

      /* inner path */ drawCircle(
        parentGfx,
        element.width,
        element.height,
        INNER_OUTER_DIST,
        innerAttrs
      );

      renderEventContent(element, parentGfx);

      return outer;
    },
    "bpmn:Group": function (parentGfx, element) {
      let group = drawRect(
        parentGfx,
        element.width,
        element.height,
        TASK_BORDER_RADIUS,
        {
          stroke: getStrokeColor(element, defaultStrokeColor),
          strokeWidth: 1,
          strokeDasharray: "8,3,1,3",
          fill: "none",
          pointerEvents: "none",
        }
      );

      return group;
    },
    label: function (parentGfx, element) {
      return renderExternalLabel(parentGfx, element);
    },
    "bpmn:TextAnnotation": function (parentGfx, element) {
      let style = {
        fill: "none",
        stroke: "none",
      };

      let textElement = drawRect(
        parentGfx,
        element.width,
        element.height,
        0,
        0,
        style
      );

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

      drawPath(parentGfx, textPathData, {
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      let text = getSemantic(element).text || "";
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
    ParticipantMultiplicityMarker: function (parentGfx, element) {
      let markerPath = pathMap.getScaledPath("MARKER_PARALLEL", {
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
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
    SubProcessMarker: function (parentGfx, element) {
      let markerRect = drawRect(parentGfx, 14, 14, 0, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      // Process marker is placed in the middle of the box
      // therefore fixed values can be used here
      translate(markerRect, element.width / 2 - 7.5, element.height - 20);

      let markerPath = pathMap.getScaledPath("MARKER_SUB_PROCESS", {
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
    ConditionalMarker: function (parentGfx, element) {
      let markerRect = drawRect(parentGfx, 20, 20, 0, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      // Process marker is placed in the middle of the box
      // therefore fixed values can be used here
      translate(markerRect, element.width / 2 - 7.5, element.height - 25);

      let markerPath = pathMap.getScaledPath("MARKER_CONDITIONAL", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 - 4.5) / element.width,
          my: (element.height - 22) / element.height,
        },
      });

      drawMarker("sub-process", parentGfx, markerPath, {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
    },
    LoopProcessMarker: function (parentGfx, element, position) {
      let markerRect = drawRect(parentGfx, 20, 20, 0, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });
      translate(markerRect, element.width / 2 - 7.5, element.height - 25);
      let markerPath = pathMap.getScaledPath("MARKER_LOOP", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 + position.loop + 2) / element.width,
          my: (element.height - 9) / element.height,
        },
      });

      drawMarker("loop", parentGfx, markerPath, {
        strokeWidth: 1.5,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
        strokeLinecap: "round",
        strokeMiterlimit: 0.5,
      });
      // let markerDiamond = drawDiamond(parentGfx, 30, 30);
      // let circle = drawCircle(parentGfx, 25, 25, 25 * 0.24, {
      //   strokeWidth: 2.5,
      //   fill: getFillColor(element, defaultFillColor),
      //   stroke: getStrokeColor(element, defaultStrokeColor),
      // });
      // translate(markerDiamond, element.width / 2 - 7.5, element.height - 35);
      // translate(circle, element.width / 2 - 5, element.height - 32.5);
    },
    ParallelMarker: function (parentGfx, element, position) {
      let markerPath = pathMap.getScaledPath("MARKER_PARALLEL", {
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
    SequentialMarker: function (parentGfx, element, position) {
      let markerPath = pathMap.getScaledPath("MARKER_SEQUENTIAL", {
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
    CompensationMarker: function (parentGfx, element, position) {
      let markerMath = pathMap.getScaledPath("MARKER_COMPENSATION", {
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
    LoopMarker: function (parentGfx, element, position) {
      let markerPath = pathMap.getScaledPath("MARKER_LOOP", {
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
    AdhocMarker: function (parentGfx, element, position) {
      let markerPath = pathMap.getScaledPath("MARKER_ADHOC", {
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
  });

  function attachTaskMarkers(parentGfx, element, taskMarkers) {
    let obj = getSemantic(element);

    let loop = taskMarkers && taskMarkers.indexOf("SubProcessMarker") !== -1;
    let position;

    if (loop) {
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

    forEach(taskMarkers, function (marker) {
      renderer(marker)(parentGfx, element, position);
    });

    if (obj.isForCompensation) {
      renderer("CompensationMarker")(parentGfx, element, position);
    }

    if (obj.$type === "bpmn:AdHocSubProcess") {
      renderer("AdhocMarker")(parentGfx, element, position);
    }

    let loopCharacteristics = obj.loopCharacteristics,
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

  function renderDataItemCollection(parentGfx, element) {
    let yPosition = (element.height - 16) / element.height;

    let pathData = pathMap.getScaledPath("DATA_OBJECT_COLLECTION_PATH", {
      xScaleFactor: 1,
      yScaleFactor: 1,
      containerWidth: element.width,
      containerHeight: element.height,
      position: {
        mx: 0.451,
        my: yPosition,
      },
    });

    /* collection path */ drawPath(parentGfx, pathData, {
      strokeWidth: 2,
    });
  }

  // extension API, use at your own risk
  this._drawPath = drawPath;
}

inherits(BpmnRenderer, BaseRenderer);

BpmnRenderer.$inject = [
  "config.bpmnRenderer",
  "eventBus",
  "styles",
  "pathMap",
  "canvas",
  "textRenderer",
];

BpmnRenderer.prototype.canRender = function (element) {
  return is(element, "bpmn:BaseElement");
};

BpmnRenderer.prototype.drawShape = function (parentGfx, element) {
  let type = element.type;
  let h = this.handlers[type];

  /* jshint -W040 */
  return h(parentGfx, element);
};

BpmnRenderer.prototype.drawConnection = function (parentGfx, element) {
  let type = element.type;
  let h = this.handlers[type];

  /* jshint -W040 */
  return h(parentGfx, element);
};

BpmnRenderer.prototype.getShapePath = function (element) {
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
};
