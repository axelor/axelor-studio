import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import tasklist from "./implementation/Tasklist";

export default function TasklistProps(group, element, bpmnFactory, translate) {
  let businessObject = getBusinessObject(element);

  if (
    is(element, "camunda:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    group.entries = group.entries.concat(
      tasklist(
        element,
        bpmnFactory,
        {
          getBusinessObject: function (element) {
            let bo = getBusinessObject(element);

            if (!is(bo, "bpmn:Participant")) {
              return bo;
            }

            return bo && bo.get("processRef");
          },
        },
        translate
      )
    );
  }
}
