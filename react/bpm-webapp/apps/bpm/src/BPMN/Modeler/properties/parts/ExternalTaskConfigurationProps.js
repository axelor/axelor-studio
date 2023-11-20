import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import externalTaskPriority from "./implementation/ExternalTaskPriority";

function getServiceTaskLikeBusinessObject(element) {
  let bo = ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element);

  // if the element is not a serviceTaskLike element, fetch the normal business object
  // This avoids the loss of the process / participant business object
  if (!bo) {
    bo = getBusinessObject(element);
  }

  return bo;
}

export default function ExternalTaskConfigurationProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  let bo = getServiceTaskLikeBusinessObject(element);

  if (!bo) {
    return;
  }

  if (is(bo, "camunda:TaskPriorized")) {
    group.entries = group.entries.concat(
      externalTaskPriority(
        element,
        bpmnFactory,
        {
          getBusinessObject: function (element) {
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
