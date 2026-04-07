import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { isIdValid } from "../../../../utils/ValidationUtil";
import { getFlowElements } from "../../extra";

export default function IdProps(
  group: any,
  element: any,
  translate: (s: string) => string,
  options: any,
  bpmnModeler: any,
) {
  const description = options && options.description;
  // Id
  group.entries.push({
    id: "id",
    label: translate("Id"),
    description: description && translate(description),
    modelProperty: "id",
    widget: "textField",
    required: true,
    isProcess: element?.type === "bpmn:Process",
    getProperty: function (element: any) {
      return getBusinessObject(element).id;
    },
    setProperty: function (element: any, properties: any) {
      element = element.labelTarget || element;
      if (getBusinessObject(element)) {
        const modeling = bpmnModeler.get("modeling");
        modeling.updateProperties(element, {
          id: properties["id"],
        });

        /**
         * Update callactivity extension elements on id updates
         */
        if (element?.type === "bpmn:Process") {
          const flowElements = getFlowElements(getBusinessObject(element));
          const callActivities = flowElements?.filter(
            (e: any) => e.baseType === "bpmn:CallActivity",
          );
          if (!callActivities?.length) return;
          const elementRegistry = bpmnModeler.get("elementRegistry");
          callActivities?.forEach((activity: any) => {
            const element = elementRegistry.get(activity.id);
            const camundaIn = getBusinessObject(element)?.extensionElements?.values?.find(
              (v: any) => v.$type === "camunda:In",
            );
            if (!camundaIn) return;
            camundaIn.source = properties["id"];
            camundaIn.target = properties["id"];
          });
        }
      }
    },
    validate: function (element: any, values: any) {
      const idValue = values.id;
      const bo = getBusinessObject(element);
      const idError = isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : {};
    },
  });
}
