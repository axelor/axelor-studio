import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { getServiceTaskLikeBusinessObject as _getServiceTaskLikeBusinessObject } from "../../../../utils/ImplementationTypeUtils";

import externalTaskPriority from "./implementation/ExternalTaskPriority";

function getServiceTaskLikeBusinessObject(element: any) {
  let bo = _getServiceTaskLikeBusinessObject(element);

  // if the element is not a serviceTaskLike element, fetch the normal business object
  // This avoids the loss of the process / participant business object
  if (!bo) {
    bo = getBusinessObject(element);
  }

  return bo;
}

export default function ExternalTaskConfigurationProps(
  group: any,
  element: any,
  bpmnFactory: any,
  translate: (s: string) => string,
) {
  const bo = getServiceTaskLikeBusinessObject(element);

  if (!bo) {
    return;
  }

  if (is(bo, "camunda:TaskPriorized")) {
    group.entries = group.entries.concat(
      externalTaskPriority(
        element,
        bpmnFactory,
        {
          getBusinessObject: function (_element: any) {
            if (!is(bo, "bpmn:Participant")) {
              return bo;
            }
            return bo && bo.get("processRef");
          },
        },
        translate,
      ),
    );
  }
}
