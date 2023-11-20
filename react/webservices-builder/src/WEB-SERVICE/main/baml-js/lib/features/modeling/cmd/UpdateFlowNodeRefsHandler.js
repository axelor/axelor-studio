import { collectLanes, getLanesRoot } from "../util/LaneUtil";

import { is } from "../../../util/ModelUtil";

import {
  add as collectionAdd,
  remove as collectionRemove,
} from "diagram-js/lib/util/Collections";

import { asTRBL } from "diagram-js/lib/layout/LayoutUtil";

const FLOW_NODE_REFS_ATTR = "flowNodeRef",
  LANES_ATTR = "lanes";

/**
 * A handler that updates lane refs on changed elements
 */
export default function UpdateFlowNodeRefsHandler(elementRegistry) {
  this._elementRegistry = elementRegistry;
}

UpdateFlowNodeRefsHandler.$inject = ["elementRegistry"];

UpdateFlowNodeRefsHandler.prototype.computeUpdates = function (
  flowNodeShapes,
  laneShapes
) {
  let handledNodes = [];

  let updates = [];

  let participantCache = {};

  let allFlowNodeShapes = [];

  function isInLaneShape(element, laneShape) {
    let laneTrbl = asTRBL(laneShape);

    let elementMid = {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2,
    };

    return (
      elementMid.x > laneTrbl.left &&
      elementMid.x < laneTrbl.right &&
      elementMid.y > laneTrbl.top &&
      elementMid.y < laneTrbl.bottom
    );
  }

  function addFlowNodeShape(flowNodeShape) {
    if (handledNodes.indexOf(flowNodeShape) === -1) {
      allFlowNodeShapes.push(flowNodeShape);
      handledNodes.push(flowNodeShape);
    }
  }

  function getAllLaneShapes(flowNodeShape) {
    let root = getLanesRoot(flowNodeShape);

    if (!participantCache[root.id]) {
      participantCache[root.id] = collectLanes(root);
    }

    return participantCache[root.id];
  }

  function getNewLanes(flowNodeShape) {
    if (!flowNodeShape.parent) {
      return [];
    }

    let allLaneShapes = getAllLaneShapes(flowNodeShape);

    return allLaneShapes
      .filter(function (l) {
        return isInLaneShape(flowNodeShape, l);
      })
      .map(function (shape) {
        return shape.businessObject;
      });
  }

  laneShapes.forEach(function (laneShape) {
    let root = getLanesRoot(laneShape);

    if (!root || handledNodes.indexOf(root) !== -1) {
      return;
    }

    let children = root.children.filter(function (c) {
      return is(c, "bpmn:FlowNode");
    });

    children.forEach(addFlowNodeShape);

    handledNodes.push(root);
  });

  flowNodeShapes.forEach(addFlowNodeShape);

  allFlowNodeShapes.forEach(function (flowNodeShape) {
    let flowNode = flowNodeShape.businessObject;

    let lanes = flowNode.get(LANES_ATTR),
      remove = lanes.slice(),
      add = getNewLanes(flowNodeShape);

    updates.push({ flowNode: flowNode, remove: remove, add: add });
  });

  return updates;
};

UpdateFlowNodeRefsHandler.prototype.execute = function (context) {
  let updates = context.updates;

  if (!updates) {
    updates = context.updates = this.computeUpdates(
      context.flowNodeShapes,
      context.laneShapes
    );
  }

  updates.forEach(function (update) {
    let flowNode = update.flowNode,
      lanes = flowNode.get(LANES_ATTR);

    // unwire old
    update.remove.forEach(function (oldLane) {
      collectionRemove(lanes, oldLane);
      collectionRemove(oldLane.get(FLOW_NODE_REFS_ATTR), flowNode);
    });

    // wire new
    update.add.forEach(function (newLane) {
      collectionAdd(lanes, newLane);
      collectionAdd(newLane.get(FLOW_NODE_REFS_ATTR), flowNode);
    });
  });

  // TODO(nikku): return changed elements
  // return [ ... ];
};

UpdateFlowNodeRefsHandler.prototype.revert = function (context) {
  let updates = context.updates;

  updates.forEach(function (update) {
    let flowNode = update.flowNode,
      lanes = flowNode.get(LANES_ATTR);

    // unwire new
    update.add.forEach(function (newLane) {
      collectionRemove(lanes, newLane);
      collectionRemove(newLane.get(FLOW_NODE_REFS_ATTR), flowNode);
    });

    // wire old
    update.remove.forEach(function (oldLane) {
      collectionAdd(lanes, oldLane);
      collectionAdd(oldLane.get(FLOW_NODE_REFS_ATTR), flowNode);
    });
  });

  // TODO(nikku): return changed elements
  // return [ ... ];
};
