import { assign } from "min-dash";

import { getLabel } from "./LabelUtil";

import { getBusinessObject, is } from "../../util/ModelUtil";

import { createCategoryValue } from "../modeling/behavior/util/CategoryUtil";

import { isAny } from "../modeling/util/ModelingUtil";
import { isExpanded } from "../../util/DiUtil";

import {
  getExternalLabelMid,
  isLabelExternal,
  hasExternalLabel,
  isLabel,
} from "../../util/LabelUtil";

export default function LabelEditingProvider(
  eventBus,
  bpmnFactory,
  canvas,
  directEditing,
  modeling,
  resizeHandles,
  textRenderer
) {
  this._bpmnFactory = bpmnFactory;
  this._canvas = canvas;
  this._modeling = modeling;
  this._textRenderer = textRenderer;

  directEditing.registerProvider(this);

  // listen to dblclick on non-root elements
  eventBus.on("element.dblclick", function (event) {
    activateDirectEdit(event.element, true);
  });

  // complete on followup canvas operation
  eventBus.on(
    [
      "autoPlace.start",
      "canvas.viewbox.changing",
      "drag.init",
      "element.mousedown",
      "popupMenu.open",
    ],
    function (event) {
      if (directEditing.isActive()) {
        directEditing.complete();
      }
    }
  );

  // cancel on command stack changes
  eventBus.on(["commandStack.changed"], function (e) {
    if (directEditing.isActive()) {
      directEditing.cancel();
    }
  });

  eventBus.on("directEditing.activate", function (event) {
    resizeHandles.removeResizers();
  });

  eventBus.on("create.end", 500, function (event) {
    let context = event.context,
      element = context.shape,
      canExecute = event.context.canExecute,
      isTouch = event.isTouch;

    // TODO(nikku): we need to find a way to support the
    // direct editing on mobile devices; right now this will
    // break for desworkflowediting on mobile devices
    // as it breaks the user interaction workflow

    // TODO(nre): we should temporarily focus the edited element
    // here and release the focused viewport after the direct edit
    // operation is finished
    if (isTouch) {
      return;
    }

    if (!canExecute) {
      return;
    }

    if (context.hints && context.hints.createElementsBehavior === false) {
      return;
    }

    activateDirectEdit(element);
  });

  eventBus.on("autoPlace.end", 500, function (event) {
    activateDirectEdit(event.shape);
  });

  function activateDirectEdit(element, force) {
    if (
      force ||
      isAny(element, ["bpmn:Task", "bpmn:TextAnnotation", "bpmn:Group"]) ||
      isCollapsedLoop(element)
    ) {
      directEditing.activate(element);
    }
  }
}

LabelEditingProvider.$inject = [
  "eventBus",
  "bpmnFactory",
  "canvas",
  "directEditing",
  "modeling",
  "resizeHandles",
  "textRenderer",
];

/**
 * Activate direct editing for activities and text annotations.
 *
 * @param  {djs.model.Base} element
 *
 * @return {Object} an object with properties bounds (position and size), text and options
 */
LabelEditingProvider.prototype.activate = function (element) {
  // text
  let text = getLabel(element);

  if (text === undefined) {
    return;
  }

  let context = {
    text: text,
  };

  // bounds
  let bounds = this.getEditingBBox(element);

  assign(context, bounds);

  let options = {};

  // tasks
  if (
    isAny(element, [
      "bpmn:Task",
      "bpmn:Participant",
      "bpmn:Lane",
      "bpmn:CallActivity",
    ]) ||
    isCollapsedLoop(element)
  ) {
    assign(options, {
      centerVertically: true,
    });
  }

  // external labels
  if (isLabelExternal(element)) {
    assign(options, {
      autoResize: true,
    });
  }

  // text annotations
  if (is(element, "bpmn:TextAnnotation")) {
    assign(options, {
      resizable: true,
      autoResize: true,
    });
  }

  assign(context, {
    options: options,
  });

  return context;
};

/**
 * Get the editing bounding box based on the element's size and position
 *
 * @param  {djs.model.Base} element
 *
 * @return {Object} an object containing information about position
 *                  and size (fixed or minimum and/or maximum)
 */
LabelEditingProvider.prototype.getEditingBBox = function (element) {
  let canvas = this._canvas;

  let target = element.label || element;

  let bbox = canvas.getAbsoluteBBox(target);

  let mid = {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };

  // default position
  let bounds = { x: bbox.x, y: bbox.y };

  let zoom = canvas.zoom();

  let defaultStyle = this._textRenderer.getDefaultStyle(),
    externalStyle = this._textRenderer.getExternalStyle();

  // take zoom into account
  let externalFontSize = externalStyle.fontSize * zoom,
    externalLineHeight = externalStyle.lineHeight,
    defaultFontSize = defaultStyle.fontSize * zoom,
    defaultLineHeight = defaultStyle.lineHeight;

  let style = {
    fontFamily: this._textRenderer.getDefaultStyle().fontFamily,
    fontWeight: this._textRenderer.getDefaultStyle().fontWeight,
  };

  // adjust for expanded pools AND lanes
  if (is(element, "bpmn:Lane") || isExpandedPool(element)) {
    assign(bounds, {
      width: bbox.height,
      height: 30 * zoom,
      x: bbox.x - bbox.height / 2 + 15 * zoom,
      y: mid.y - (30 * zoom) / 2,
    });

    assign(style, {
      fontSize: defaultFontSize + "px",
      lineHeight: defaultLineHeight,
      paddingTop: 7 * zoom + "px",
      paddingBottom: 7 * zoom + "px",
      paddingLeft: 5 * zoom + "px",
      paddingRight: 5 * zoom + "px",
      transform: "rotate(-90deg)",
    });
  }

  // internal labels for tasks and collapsed call activities,
  // sub processes and participants
  if (
    isAny(element, ["bpmn:Task", "bpmn:CallActivity"]) ||
    isCollapsedPool(element) ||
    isCollapsedLoop(element)
  ) {
    assign(bounds, {
      width: bbox.width,
      height: bbox.height,
    });

    assign(style, {
      fontSize: defaultFontSize + "px",
      lineHeight: defaultLineHeight,
      paddingTop: 7 * zoom + "px",
      paddingBottom: 7 * zoom + "px",
      paddingLeft: 5 * zoom + "px",
      paddingRight: 5 * zoom + "px",
    });
  }

  // internal labels for expanded sub processes
  if (isExpandedLoop(element)) {
    assign(bounds, {
      width: bbox.width,
      x: bbox.x,
    });

    assign(style, {
      fontSize: defaultFontSize + "px",
      lineHeight: defaultLineHeight,
      paddingTop: 7 * zoom + "px",
      paddingBottom: 7 * zoom + "px",
      paddingLeft: 5 * zoom + "px",
      paddingRight: 5 * zoom + "px",
    });
  }

  let width = 90 * zoom,
    paddingTop = 7 * zoom,
    paddingBottom = 4 * zoom;

  // external labels for events, data elements, gateways, groups and connections
  if (target.labelTarget) {
    assign(bounds, {
      width: width,
      height: bbox.height + paddingTop + paddingBottom,
      x: mid.x - width / 2,
      y: bbox.y - paddingTop,
    });

    assign(style, {
      fontSize: externalFontSize + "px",
      lineHeight: externalLineHeight,
      paddingTop: paddingTop + "px",
      paddingBottom: paddingBottom + "px",
    });
  }

  // external label not yet created
  if (
    isLabelExternal(target) &&
    !hasExternalLabel(target) &&
    !isLabel(target)
  ) {
    let externalLabelMid = getExternalLabelMid(element);

    let absoluteBBox = canvas.getAbsoluteBBox({
      x: externalLabelMid.x,
      y: externalLabelMid.y,
      width: 0,
      height: 0,
    });

    let height = externalFontSize + paddingTop + paddingBottom;

    assign(bounds, {
      width: width,
      height: height,
      x: absoluteBBox.x - width / 2,
      y: absoluteBBox.y - height / 2,
    });

    assign(style, {
      fontSize: externalFontSize + "px",
      lineHeight: externalLineHeight,
      paddingTop: paddingTop + "px",
      paddingBottom: paddingBottom + "px",
    });
  }

  // text annotations
  if (is(element, "bpmn:TextAnnotation")) {
    assign(bounds, {
      width: bbox.width,
      height: bbox.height,
      minWidth: 30 * zoom,
      minHeight: 10 * zoom,
    });

    assign(style, {
      textAlign: "left",
      paddingTop: 5 * zoom + "px",
      paddingBottom: 7 * zoom + "px",
      paddingLeft: 7 * zoom + "px",
      paddingRight: 5 * zoom + "px",
      fontSize: defaultFontSize + "px",
      lineHeight: defaultLineHeight,
    });
  }

  return { bounds: bounds, style: style };
};

LabelEditingProvider.prototype.update = function (
  element,
  newLabel,
  activeContextText,
  bounds
) {
  let newBounds, bbox;

  if (is(element, "bpmn:TextAnnotation")) {
    bbox = this._canvas.getAbsoluteBBox(element);

    newBounds = {
      x: element.x,
      y: element.y,
      width: (element.width / bbox.width) * bounds.width,
      height: (element.height / bbox.height) * bounds.height,
    };
  }

  if (is(element, "bpmn:Group")) {
    let businessObject = getBusinessObject(element);

    // initialize categoryValue if not existing
    if (!businessObject.categoryValueRef) {
      let rootElement = this._canvas.getRootElement(),
        definitions = getBusinessObject(rootElement).$parent;

      let categoryValue = createCategoryValue(definitions, this._bpmnFactory);

      getBusinessObject(element).categoryValueRef = categoryValue;
    }
  }

  if (isEmptyText(newLabel)) {
    newLabel = null;
  }

  this._modeling.updateLabel(element, newLabel, newBounds);
};

// helpers //////////////////////

function isCollapsedLoop(element) {
  return (
    (is(element, "bpmn:Loop") && !isExpanded(element)) ||
    (is(element, "bpmn:Conditional") && !isExpanded(element))
  );
}

function isExpandedLoop(element) {
  return (
    (is(element, "bpmn:Loop") && isExpanded(element)) ||
    (is(element, "bpmn:Conditional") && isExpanded(element))
  );
}

function isCollapsedPool(element) {
  return is(element, "bpmn:Participant") && !isExpanded(element);
}

function isExpandedPool(element) {
  return is(element, "bpmn:Participant") && isExpanded(element);
}

function isEmptyText(label) {
  return !label || !label.trim();
}
