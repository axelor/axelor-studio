import inherits from "inherits";

import {
  getOrientation,
  getMid,
  asTRBL,
} from "diagram-js/lib/layout/LayoutUtil";

import { substract } from "diagram-js/lib/util/Math";

import { hasExternalLabel } from "../../../util/LabelUtil";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";

let ALIGNMENTS = ["top", "bottom", "left", "right"];

let ELEMENT_LABEL_DISTANCE = 10;

/**
 * A component that makes sure that external labels are added
 * together with respective elements and properly updated (DI wise)
 * during move.
 *
 * @param {EventBus} eventBus
 * @param {Modeling} modeling
 */
export default function AdaptiveLabelPositioningBehavior(eventBus, modeling) {
  CommandInterceptor.call(this, eventBus);

  this.postExecuted(
    ["connection.create", "connection.layout", "connection.updateWaypoints"],
    function (event) {
      let context = event.context,
        connection = context.connection,
        source = connection.source,
        target = connection.target,
        hints = context.hints || {};

      if (hints.createElementsBehavior !== false) {
        checkLabelAdjustment(source);
        checkLabelAdjustment(target);
      }
    }
  );

  this.postExecuted(["label.create"], function (event) {
    let context = event.context,
      shape = context.shape,
      hints = context.hints || {};

    if (hints.createElementsBehavior !== false) {
      checkLabelAdjustment(shape.labelTarget);
    }
  });

  this.postExecuted(["elements.create"], function (event) {
    let context = event.context,
      elements = context.elements,
      hints = context.hints || {};

    if (hints.createElementsBehavior !== false) {
      elements.forEach(function (element) {
        checkLabelAdjustment(element);
      });
    }
  });

  function checkLabelAdjustment(element) {
    // skip non-existing labels
    if (!hasExternalLabel(element)) {
      return;
    }

    let optimalPosition = getOptimalPosition(element);

    // no optimal position found
    if (!optimalPosition) {
      return;
    }

    adjustLabelPosition(element, optimalPosition);
  }

  function adjustLabelPosition(element, orientation) {
    let elementMid = getMid(element),
      label = element.label,
      labelMid = getMid(label);

    // ignore labels that are being created
    if (!label.parent) {
      return;
    }

    let elementTrbl = asTRBL(element);

    let newLabelMid;

    switch (orientation) {
      case "top":
        newLabelMid = {
          x: elementMid.x,
          y: elementTrbl.top - ELEMENT_LABEL_DISTANCE - label.height / 2,
        };

        break;

      case "left":
        newLabelMid = {
          x: elementTrbl.left - ELEMENT_LABEL_DISTANCE - label.width / 2,
          y: elementMid.y,
        };

        break;

      case "bottom":
        newLabelMid = {
          x: elementMid.x,
          y: elementTrbl.bottom + ELEMENT_LABEL_DISTANCE + label.height / 2,
        };

        break;

      case "right":
        newLabelMid = {
          x: elementTrbl.right + ELEMENT_LABEL_DISTANCE + label.width / 2,
          y: elementMid.y,
        };

        break;
      default:
        break;
    }

    let delta = substract(newLabelMid, labelMid);

    modeling.moveShape(label, delta);
  }
}

inherits(AdaptiveLabelPositioningBehavior, CommandInterceptor);

AdaptiveLabelPositioningBehavior.$inject = ["eventBus", "modeling"];

// helpers //////////////////////

/**
 * Return alignments which are taken by a boundary's host element
 *
 * @param {Shape} element
 *
 * @return {Array<String>}
 */
function getTakenHostAlignments(element) {
  let hostElement = element.host,
    elementMid = getMid(element),
    hostOrientation = getOrientation(elementMid, hostElement);

  let freeAlignments;

  // check whether there is a multi-orientation, e.g. 'top-left'
  if (hostOrientation.indexOf("-") >= 0) {
    freeAlignments = hostOrientation.split("-");
  } else {
    freeAlignments = [hostOrientation];
  }

  let takenAlignments = ALIGNMENTS.filter(function (alignment) {
    return freeAlignments.indexOf(alignment) === -1;
  });

  return takenAlignments;
}

/**
 * Return alignments which are taken by related connections
 *
 * @param {Shape} element
 *
 * @return {Array<String>}
 */
function getTakenConnectionAlignments(element) {
  let elementMid = getMid(element);

  let takenAlignments = []
    .concat(
      element.incoming.map(function (c) {
        return c.waypoints[c.waypoints.length - 2];
      }),
      element.outgoing.map(function (c) {
        return c.waypoints[1];
      })
    )
    .map(function (point) {
      return getApproximateOrientation(elementMid, point);
    });

  return takenAlignments;
}

/**
 * Return the optimal label position around an element
 * or _undefined_, if none was found.
 *
 * @param  {Shape} element
 *
 * @return {String} positioning identifier
 */
function getOptimalPosition(element) {
  let labelMid = getMid(element.label);

  let elementMid = getMid(element);

  let labelOrientation = getApproximateOrientation(elementMid, labelMid);

  if (!isAligned(labelOrientation)) {
    return;
  }

  let takenAlignments = getTakenConnectionAlignments(element);

  if (element.host) {
    let takenHostAlignments = getTakenHostAlignments(element);

    takenAlignments = takenAlignments.concat(takenHostAlignments);
  }

  let freeAlignments = ALIGNMENTS.filter(function (alignment) {
    return takenAlignments.indexOf(alignment) === -1;
  });

  // NOTHING TO DO; label already aligned a.O.K.
  if (freeAlignments.indexOf(labelOrientation) !== -1) {
    return;
  }

  return freeAlignments[0];
}

function getApproximateOrientation(p0, p1) {
  return getOrientation(p1, p0, 5);
}

function isAligned(orientation) {
  return ALIGNMENTS.indexOf(orientation) !== -1;
}
