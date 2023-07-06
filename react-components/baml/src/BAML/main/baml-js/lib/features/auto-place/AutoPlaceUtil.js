import { is } from "../../util/ModelUtil";
import { isAny } from "../modeling/util/ModelingUtil";

import {
  getMid,
  asTRBL,
  getOrientation,
} from "diagram-js/lib/layout/LayoutUtil";

import { find, reduce } from "min-dash";

const DEFAULT_HORIZONTAL_DISTANCE = 50;

const MAX_HORIZONTAL_DISTANCE = 250;

// padding to detect element placement
const PLACEMENT_DETECTION_PAD = 10;

/**
 * Find the new position for the target element to
 * connect to source.
 *
 * @param  {djs.model.Shape} source
 * @param  {djs.model.Shape} element
 *
 * @return {Point}
 */
export function getNewShapePosition(source, element) {
  if (is(element, "bpmn:TextAnnotation")) {
    return getTextAnnotationPosition(source, element);
  }

  if (isAny(element, ["bpmn:DataObjectReference", "bpmn:DataStoreReference"])) {
    return getDataElementPosition(source, element);
  }

  if (is(element, "bpmn:FlowNode")) {
    return getFlowNodePosition(source, element);
  }

  return getDefaultPosition(source, element);
}

/**
 * Always try to place element right of source;
 * compute actual distance from previous nodes in flow.
 */
export function getFlowNodePosition(source, element) {
  let sourceTrbl = asTRBL(source);
  let sourceMid = getMid(source);

  let horizontalDistance = getFlowNodeDistance(source, element);

  let orientation = "left",
    rowSize = 80,
    margin = 30;

  if (is(source, "bpmn:BoundaryEvent")) {
    orientation = getOrientation(source, source.host, -25);

    if (orientation.indexOf("top") !== -1) {
      margin *= -1;
    }
  }

  function getVerticalDistance(orient) {
    if (orient.indexOf("top") !== -1) {
      return -1 * rowSize;
    } else if (orient.indexOf("bottom") !== -1) {
      return rowSize;
    } else {
      return 0;
    }
  }

  let position = {
    x: sourceTrbl.right + horizontalDistance + element.width / 2,
    y: sourceMid.y + getVerticalDistance(orientation),
  };

  let escapeDirection = {
    y: {
      margin: margin,
      rowSize: rowSize,
    },
  };

  return deconflictPosition(source, element, position, escapeDirection);
}

/**
 * Compute best distance between source and target,
 * based on existing connections to and from source.
 *
 * @param {djs.model.Shape} source
 * @param {djs.model.Shape} element
 *
 * @return {Number} distance
 */
export function getFlowNodeDistance(source, element) {
  let sourceTrbl = asTRBL(source);

  // is connection a reference to consider?
  function isReference(c) {
    return is(c, "bpmn:SequenceFlow");
  }

  function toTargetNode(weight) {
    return function (shape) {
      return {
        shape: shape,
        weight: weight,
        distanceTo: function (shape) {
          let shapeTrbl = asTRBL(shape);

          return shapeTrbl.left - sourceTrbl.right;
        },
      };
    };
  }

  function toSourceNode(weight) {
    return function (shape) {
      return {
        shape: shape,
        weight: weight,
        distanceTo: function (shape) {
          let shapeTrbl = asTRBL(shape);

          return sourceTrbl.left - shapeTrbl.right;
        },
      };
    };
  }

  // we create a list of nodes to take into consideration
  // for calculating the optimal flow node distance
  //
  //   * weight existing target nodes higher than source nodes
  //   * only take into account individual nodes once
  //
  let nodes = reduce(
    [].concat(
      getTargets(source, isReference).map(toTargetNode(5)),
      getSources(source, isReference).map(toSourceNode(1))
    ),
    function (nodes, node) {
      // filter out shapes connected twice via source or target
      nodes[node.shape.id + "__weight_" + node.weight] = node;

      return nodes;
    },
    {}
  );

  // compute distances between source and incoming nodes;
  // group at the same time by distance and expose the
  // favourite distance as { fav: { count, value } }.
  let distancesGrouped = reduce(
    nodes,
    function (result, node) {
      let shape = node.shape,
        weight = node.weight,
        distanceTo = node.distanceTo;

      let fav = result.fav,
        currentDistance,
        currentDistanceCount,
        currentDistanceEntry;

      currentDistance = distanceTo(shape);

      // ignore too far away peers
      // or non-left to right modeled nodes
      if (currentDistance < 0 || currentDistance > MAX_HORIZONTAL_DISTANCE) {
        return result;
      }

      currentDistanceEntry = result[String(currentDistance)] = result[
        String(currentDistance)
      ] || {
        value: currentDistance,
        count: 0,
      };

      // inc diff count
      currentDistanceCount = currentDistanceEntry.count += 1 * weight;

      if (!fav || fav.count < currentDistanceCount) {
        result.fav = currentDistanceEntry;
      }

      return result;
    },
    {}
  );

  if (distancesGrouped.fav) {
    return distancesGrouped.fav.value;
  } else {
    return DEFAULT_HORIZONTAL_DISTANCE;
  }
}

/**
 * Always try to place text annotations top right of source.
 */
export function getTextAnnotationPosition(source, element) {
  let sourceTrbl = asTRBL(source);

  let position = {
    x: sourceTrbl.right + element.width / 2,
    y: sourceTrbl.top - 50 - element.height / 2,
  };

  let escapeDirection = {
    y: {
      margin: -30,
      rowSize: 20,
    },
  };

  return deconflictPosition(source, element, position, escapeDirection);
}

/**
 * Always put element bottom right of source.
 */
export function getDataElementPosition(source, element) {
  let sourceTrbl = asTRBL(source);

  let position = {
    x: sourceTrbl.right - 10 + element.width / 2,
    y: sourceTrbl.bottom + 40 + element.width / 2,
  };

  let escapeDirection = {
    x: {
      margin: 30,
      rowSize: 30,
    },
  };

  return deconflictPosition(source, element, position, escapeDirection);
}

/**
 * Always put element right of source per default.
 */
export function getDefaultPosition(source, element) {
  let sourceTrbl = asTRBL(source);

  let sourceMid = getMid(source);

  // simply put element right next to source
  return {
    x: sourceTrbl.right + DEFAULT_HORIZONTAL_DISTANCE + element.width / 2,
    y: sourceMid.y,
  };
}

/**
 * Returns all connected elements around the given source.
 *
 * This includes:
 *
 *   - connected elements
 *   - host connected elements
 *   - attachers connected elements
 *
 * @param  {djs.model.Shape} source
 * @param  {djs.model.Shape} element
 *
 * @return {Array<djs.model.Shape>}
 */
function getAutoPlaceClosure(source, element) {
  let allConnected = getConnected(source);

  if (source.host) {
    allConnected = allConnected.concat(getConnected(source.host));
  }

  if (source.attachers) {
    allConnected = allConnected.concat(
      source.attachers.reduce(function (shapes, attacher) {
        return shapes.concat(getConnected(attacher));
      }, [])
    );
  }

  return allConnected;
}

/**
 * Return target at given position, if defined.
 *
 * This takes connected elements from host and attachers
 * into account, too.
 */
export function getConnectedAtPosition(source, position, element) {
  let bounds = {
    x: position.x - element.width / 2,
    y: position.y - element.height / 2,
    width: element.width,
    height: element.height,
  };

  let closure = getAutoPlaceClosure(source, element);

  return find(closure, function (target) {
    if (target === element) {
      return false;
    }

    let orientation = getOrientation(target, bounds, PLACEMENT_DETECTION_PAD);

    return orientation === "intersect";
  });
}

/**
 * Returns a new, position for the given element
 * based on the given element that is not occupied
 * by some element connected to source.
 *
 * Take into account the escapeDirection (where to move
 * on positioning clashes) in the computation.
 *
 * @param {djs.model.Shape} source
 * @param {djs.model.Shape} element
 * @param {Point} position
 * @param {Object} escapeDelta
 *
 * @return {Point}
 */
export function deconflictPosition(source, element, position, escapeDelta) {
  function nextPosition(existingElement) {
    let newPosition = {
      x: position.x,
      y: position.y,
    };

    ["x", "y"].forEach(function (axis) {
      let axisDelta = escapeDelta[axis];

      if (!axisDelta) {
        return;
      }

      let dimension = axis === "x" ? "width" : "height";

      let margin = axisDelta.margin,
        rowSize = axisDelta.rowSize;

      if (margin < 0) {
        newPosition[axis] = Math.min(
          existingElement[axis] + margin - element[dimension] / 2,
          position[axis] - rowSize + margin
        );
      } else {
        newPosition[axis] = Math.max(
          existingTarget[axis] +
            existingTarget[dimension] +
            margin +
            element[dimension] / 2,
          position[axis] + rowSize + margin
        );
      }
    });

    return newPosition;
  }

  let existingTarget;

  // deconflict position until free slot is found
  while ((existingTarget = getConnectedAtPosition(source, position, element))) {
    position = nextPosition(existingTarget);
  }

  return position;
}

// helpers //////////////////////

function noneFilter() {
  return true;
}

function getConnected(element, connectionFilter) {
  return [].concat(
    getTargets(element, connectionFilter),
    getSources(element, connectionFilter)
  );
}

function getSources(shape, connectionFilter) {
  if (!connectionFilter) {
    connectionFilter = noneFilter;
  }

  return shape.incoming.filter(connectionFilter).map(function (c) {
    return c.source;
  });
}

function getTargets(shape, connectionFilter) {
  if (!connectionFilter) {
    connectionFilter = noneFilter;
  }

  return shape.outgoing.filter(connectionFilter).map(function (c) {
    return c.target;
  });
}
