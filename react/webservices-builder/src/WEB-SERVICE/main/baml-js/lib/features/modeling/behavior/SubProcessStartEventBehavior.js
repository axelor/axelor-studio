import inherits from "inherits";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";

import { is } from "../../../util/ModelUtil";
import { isExpanded } from "../../../util/DiUtil.js";

/**
 * Add start event replacing element with expanded sub process.
 *
 * @param {Injector} injector
 * @param {Modeling} modeling
 */
export default function SubProcessStartEventBehavior(injector, modeling) {
  injector.invoke(CommandInterceptor, this);

  this.postExecuted("shape.replace", function (event) {
    let oldShape = event.context.oldShape,
      newShape = event.context.newShape;

    if (
      !is(newShape, "bpmn:Loop") ||
      !is(newShape, "bpmn:Conditional") ||
      !is(oldShape, "bpmn:Task") ||
      !isExpanded(newShape)
    ) {
      return;
    }

    let position = getStartEventPosition(newShape);

    modeling.createShape({ type: "bpmn:StartEvent" }, position, newShape);
  });
}

SubProcessStartEventBehavior.$inject = ["injector", "modeling"];

inherits(SubProcessStartEventBehavior, CommandInterceptor);

// helpers //////////

function getStartEventPosition(shape) {
  return {
    x: shape.x + shape.width / 6,
    y: shape.y + shape.height / 2,
  };
}
