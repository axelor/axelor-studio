import { is } from "../../../util/ModelUtil";

import { isExpanded } from "../../../util/DiUtil";

import { getParticipantResizeConstraints } from "./util/ResizeUtil";

const HIGH_PRIORITY = 1500;

export const PARTICIPANT_MIN_DIMENSIONS = { width: 300, height: 150 };

export const SUB_PROCESS_MIN_DIMENSIONS = { width: 140, height: 120 };

export const TEXT_ANNOTATION_MIN_DIMENSIONS = { width: 50, height: 30 };

/**
 * Set minimum bounds/resize constraints on resize.
 *
 * @param {EventBus} eventBus
 */
export default function ResizeBehavior(eventBus) {
  eventBus.on("resize.start", HIGH_PRIORITY, function (event) {
    let context = event.context,
      shape = context.shape,
      direction = context.direction,
      balanced = context.balanced;

    if (is(shape, "bpmn:Lane") || is(shape, "bpmn:Participant")) {
      context.resizeConstraints = getParticipantResizeConstraints(
        shape,
        direction,
        balanced
      );
    }

    if (is(shape, "bpmn:Participant")) {
      context.minDimensions = PARTICIPANT_MIN_DIMENSIONS;
    }

    if (is(shape, "bpmn:Loop") && isExpanded(shape)) {
      context.minDimensions = SUB_PROCESS_MIN_DIMENSIONS;
    }

    if (is(shape, "bpmn:Conditional") && isExpanded(shape)) {
      context.minDimensions = SUB_PROCESS_MIN_DIMENSIONS;
    }

    if (is(shape, "bpmn:TextAnnotation")) {
      context.minDimensions = TEXT_ANNOTATION_MIN_DIMENSIONS;
    }
  });
}

ResizeBehavior.$inject = ["eventBus"];
