import inherits from "inherits";

import CreateMoveSnapping from "diagram-js/lib/features/snapping/CreateMoveSnapping";

import {
  isSnapped,
  setSnapped,
  topLeft,
  bottomRight,
} from "diagram-js/lib/features/snapping/SnapUtil";

import { isExpanded } from "../../util/DiUtil";

import { is } from "../../util/ModelUtil";

import { asTRBL, getMid } from "diagram-js/lib/layout/LayoutUtil";

import { getBoundaryAttachment } from "./BpmnSnappingUtil";

import { forEach } from "min-dash";

let HIGH_PRIORITY = 1500;

/**
 * Snap during create and move.
 *
 * @param {EventBus} eventBus
 * @param {Injector} injector
 */
export default function BpmnCreateMoveSnapping(eventBus, injector) {
  injector.invoke(CreateMoveSnapping, this);

  // creating first participant
  eventBus.on(
    ["create.move", "create.end"],
    HIGH_PRIORITY,
    setSnappedIfConstrained
  );

  // snap boundary events
  eventBus.on(
    ["create.move", "create.end", "shape.move.move", "shape.move.end"],
    HIGH_PRIORITY,
    function (event) {
      let context = event.context,
        canExecute = context.canExecute,
        target = context.target;

      let canAttach =
        canExecute && (canExecute === "attach" || canExecute.attach);

      if (canAttach && !isSnapped(event)) {
        snapBoundaryEvent(event, target);
      }
    }
  );
}

inherits(BpmnCreateMoveSnapping, CreateMoveSnapping);

BpmnCreateMoveSnapping.$inject = ["eventBus", "injector"];

BpmnCreateMoveSnapping.prototype.initSnap = function (event) {
  let snapContext = CreateMoveSnapping.prototype.initSnap.call(this, event);

  let shape = event.shape;

  let isMove = !!this._elementRegistry.get(shape.id);

  // snap to docking points
  forEach(shape.outgoing, function (connection) {
    let docking = connection.waypoints[0];

    docking = docking.original || docking;

    snapContext.setSnapOrigin(
      connection.id + "-docking",
      getDockingSnapOrigin(docking, isMove, event)
    );
  });

  forEach(shape.incoming, function (connection) {
    let docking = connection.waypoints[connection.waypoints.length - 1];

    docking = docking.original || docking;

    snapContext.setSnapOrigin(
      connection.id + "-docking",
      getDockingSnapOrigin(docking, isMove, event)
    );
  });

  if (is(shape, "bpmn:Participant")) {
    // snap to borders with higher priority
    snapContext.setSnapLocations(["top-left", "bottom-right", "mid"]);
  }

  return snapContext;
};

BpmnCreateMoveSnapping.prototype.addSnapTargetPoints = function (
  snapPoints,
  shape,
  target
) {
  CreateMoveSnapping.prototype.addSnapTargetPoints.call(
    this,
    snapPoints,
    shape,
    target
  );

  let snapTargets = this.getSnapTargets(shape, target);

  forEach(snapTargets, function (snapTarget) {
    // handle TRBL alignment
    //
    // * with container elements
    // * with text annotations
    if (
      isContainer(snapTarget) ||
      areAll([shape, snapTarget], "bpmn:TextAnnotation")
    ) {
      snapPoints.add("top-left", topLeft(snapTarget));
      snapPoints.add("bottom-right", bottomRight(snapTarget));
    }
  });

  let elementRegistry = this._elementRegistry;

  // snap to docking points if not create mode
  forEach(shape.incoming, function (connection) {
    if (elementRegistry.get(shape.id)) {
      if (!includes(snapTargets, connection.source)) {
        snapPoints.add("mid", getMid(connection.source));
      }

      let docking = connection.waypoints[0];
      snapPoints.add(connection.id + "-docking", docking.original || docking);
    }
  });

  forEach(shape.outgoing, function (connection) {
    if (elementRegistry.get(shape.id)) {
      if (!includes(snapTargets, connection.target)) {
        snapPoints.add("mid", getMid(connection.target));
      }

      let docking = connection.waypoints[connection.waypoints.length - 1];

      snapPoints.add(connection.id + "-docking", docking.original || docking);
    }
  });

  // add sequence flow parents as snap targets
  if (is(target, "bpmn:SequenceFlow")) {
    snapPoints = this.addSnapTargetPoints(snapPoints, shape, target.parent);
  }

  return snapPoints;
};

BpmnCreateMoveSnapping.prototype.getSnapTargets = function (shape, target) {
  return CreateMoveSnapping.prototype.getSnapTargets
    .call(this, shape, target)
    .filter(function (snapTarget) {
      // do not snap to lanes
      return !is(snapTarget, "bpmn:Lane");
    });
};

// helpers //////////

function snapBoundaryEvent(event, target) {
  let targetTRBL = asTRBL(target);

  let direction = getBoundaryAttachment(event, target);

  let context = event.context,
    shape = context.shape;

  let offset;

  if (shape.parent) {
    offset = { x: 0, y: 0 };
  } else {
    offset = getMid(shape);
  }

  if (/top/.test(direction)) {
    setSnapped(event, "y", targetTRBL.top - offset.y);
  } else if (/bottom/.test(direction)) {
    setSnapped(event, "y", targetTRBL.bottom - offset.y);
  }

  if (/left/.test(direction)) {
    setSnapped(event, "x", targetTRBL.left - offset.x);
  } else if (/right/.test(direction)) {
    setSnapped(event, "x", targetTRBL.right - offset.x);
  }
}

function areAll(elements, type) {
  return elements.every(function (el) {
    return is(el, type);
  });
}

function isContainer(element) {
  if (is(element, "bpmn:Loop") && isExpanded(element)) {
    return true;
  }

  return is(element, "bpmn:Participant");
}

function setSnappedIfConstrained(event) {
  let context = event.context,
    createConstraints = context.createConstraints;

  if (!createConstraints) {
    return;
  }

  let top = createConstraints.top,
    right = createConstraints.right,
    bottom = createConstraints.bottom,
    left = createConstraints.left;

  if ((left && left >= event.x) || (right && right <= event.x)) {
    setSnapped(event, "x", event.x);
  }

  if ((top && top >= event.y) || (bottom && bottom <= event.y)) {
    setSnapped(event, "y", event.y);
  }
}

function includes(array, value) {
  return array.indexOf(value) !== -1;
}

function getDockingSnapOrigin(docking, isMove, event) {
  return isMove
    ? {
        x: docking.x - event.x,
        y: docking.y - event.y,
      }
    : {
        x: docking.x,
        y: docking.y,
      };
}
