import { isAny } from "../modeling/util/ModelingUtil";

export default function BpmnGridSnapping(eventBus) {
  eventBus.on(["create.init", "shape.move.init"], function (event) {
    let context = event.context,
      shape = event.shape;

    if (
      isAny(shape, [
        "bpmn:Participant",
        "bpmn:Loop",
        "bpmn:Conditional",
        "bpmn:TextAnnotation",
      ])
    ) {
      if (!context.gridSnappingContext) {
        context.gridSnappingContext = {};
      }

      context.gridSnappingContext.snapLocation = "top-left";
    }
  });
}

BpmnGridSnapping.$inject = ["eventBus"];
