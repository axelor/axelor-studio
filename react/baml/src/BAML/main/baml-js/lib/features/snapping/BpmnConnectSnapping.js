import { mid, setSnapped } from "diagram-js/lib/features/snapping/SnapUtil";

import { isCmd } from "diagram-js/lib/features/keyboard/KeyboardUtil";

import { getOrientation } from "diagram-js/lib/layout/LayoutUtil";

import { is } from "../../util/ModelUtil";

import { isAny } from "../modeling/util/ModelingUtil";

import { some } from "min-dash";

let HIGHER_PRIORITY = 1250;

let BOUNDARY_TO_HOST_THRESHOLD = 40;

let TARGET_BOUNDS_PADDING = 20,
  TASK_BOUNDS_PADDING = 10;

let TARGET_CENTER_PADDING = 20;

let AXES = ["x", "y"];

let abs = Math.abs;

/**
 * Snap during connect.
 *
 * @param {EventBus} eventBus
 */
export default function BpmnConnectSnapping(eventBus) {
  eventBus.on(
    ["connect.hover", "connect.move", "connect.end"],
    HIGHER_PRIORITY,
    function (event) {
      let context = event.context,
        canExecute = context.canExecute,
        start = context.start,
        hover = context.hover,
        source = context.source,
        target = context.target;

      // do NOT snap on CMD
      if (event.originalEvent && isCmd(event.originalEvent)) {
        return;
      }

      if (!context.initialConnectionStart) {
        context.initialConnectionStart = context.connectionStart;
      }

      // snap hover
      if (canExecute && hover) {
        snapToShape(event, hover, getTargetBoundsPadding(hover));
      }

      if (
        hover &&
        isAnyType(canExecute, [
          "bpmn:Association",
          "bpmn:DataInputAssociation",
          "bpmn:DataOutputAssociation",
          "bpmn:SequenceFlow",
        ])
      ) {
        context.connectionStart = mid(start);

        // snap hover
        if (isAny(hover, ["bpmn:Event", "bpmn:Gateway"])) {
          snapToPosition(event, mid(hover));
        }

        // snap hover
        if (isAny(hover, ["bpmn:Task", "bpmn:Loop", "bpmn:Conditional"])) {
          snapToTargetMid(event, hover);
        }

        // snap source and target
        if (is(source, "bpmn:BoundaryEvent") && target === source.host) {
          snapBoundaryEventLoop(event);
        }
      } else if (isType(canExecute, "bpmn:MessageFlow")) {
        if (is(start, "bpmn:Event")) {
          // snap start
          context.connectionStart = mid(start);
        }

        if (is(hover, "bpmn:Event")) {
          // snap hover
          snapToPosition(event, mid(hover));
        }
      } else {
        // un-snap source
        context.connectionStart = context.initialConnectionStart;
      }
    }
  );
}

BpmnConnectSnapping.$inject = ["eventBus"];

// helpers //////////

// snap to target if event in target
function snapToShape(event, target, padding) {
  AXES.forEach(function (axis) {
    let dimensionForAxis = getDimensionForAxis(axis, target);

    if (event[axis] < target[axis] + padding) {
      setSnapped(event, axis, target[axis] + padding);
    } else if (event[axis] > target[axis] + dimensionForAxis - padding) {
      setSnapped(event, axis, target[axis] + dimensionForAxis - padding);
    }
  });
}

// snap to target mid if event in target mid
function snapToTargetMid(event, target) {
  let targetMid = mid(target);

  AXES.forEach(function (axis) {
    if (isMid(event, target, axis)) {
      setSnapped(event, axis, targetMid[axis]);
    }
  });
}

// snap to prevent loop overlapping boundary event
function snapBoundaryEventLoop(event) {
  let context = event.context,
    source = context.source,
    target = context.target;

  if (isReverse(context)) {
    return;
  }

  let sourceMid = mid(source),
    orientation = getOrientation(sourceMid, target, -10),
    axes = [];

  if (/top|bottom/.test(orientation)) {
    axes.push("x");
  }

  if (/left|right/.test(orientation)) {
    axes.push("y");
  }

  axes.forEach(function (axis) {
    let coordinate = event[axis],
      newCoordinate;

    if (abs(coordinate - sourceMid[axis]) < BOUNDARY_TO_HOST_THRESHOLD) {
      if (coordinate > sourceMid[axis]) {
        newCoordinate = sourceMid[axis] + BOUNDARY_TO_HOST_THRESHOLD;
      } else {
        newCoordinate = sourceMid[axis] - BOUNDARY_TO_HOST_THRESHOLD;
      }

      setSnapped(event, axis, newCoordinate);
    }
  });
}

function snapToPosition(event, position) {
  setSnapped(event, "x", position.x);
  setSnapped(event, "y", position.y);
}

function isType(attrs, type) {
  return attrs && attrs.type === type;
}

function isAnyType(attrs, types) {
  return some(types, function (type) {
    return isType(attrs, type);
  });
}

function getDimensionForAxis(axis, element) {
  return axis === "x" ? element.width : element.height;
}

function getTargetBoundsPadding(target) {
  if (is(target, "bpmn:Task")) {
    return TASK_BOUNDS_PADDING;
  } else {
    return TARGET_BOUNDS_PADDING;
  }
}

function isMid(event, target, axis) {
  return (
    event[axis] > target[axis] + TARGET_CENTER_PADDING &&
    event[axis] <
      target[axis] + getDimensionForAxis(axis, target) - TARGET_CENTER_PADDING
  );
}

function isReverse(context) {
  let hover = context.hover,
    source = context.source;

  return hover && source && hover === source;
}
