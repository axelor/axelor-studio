import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import utils from "bpmn-js-properties-panel/lib/Utils";

import { getFlowElements } from "../../extra";

export default function IdProps(
  group,
  element,
  translate,
  options,
  bpmnModeler
) {
  let description = options && options.description;
  // Id
  group.entries.push({
    id: "id",
    label: translate("Id"),
    description: description && translate(description),
    modelProperty: "id",
    widget: "textField",
    getProperty: function (element) {
      return getBusinessObject(element).id;
    },
    setProperty: function (element, properties) {
      element = element.labelTarget || element;
      if (element.businessObject) {
        element.businessObject.id = properties["id"];

        /**
         * Update callactivity extension elements on id updates
         */
        if (element?.type === "bpmn:Process") {
          const flowElements = getFlowElements(element?.businessObject);
          const callActivities = flowElements?.filter(
            (e) => e.baseType === "bpmn:CallActivity"
          );
          if (!callActivities?.length) return;
          const elementRegistry = bpmnModeler.get("elementRegistry");
          callActivities?.forEach((activity) => {
            const element = elementRegistry.get(activity.id);
            const camundaIn =
              element?.businessObject?.extensionElements?.values?.find(
                (v) => v.$type === "camunda:In"
              );
            if (!camundaIn) return;
            camundaIn.source = properties["id"];
            camundaIn.target = properties["id"];
          });
        }
      }
    },
    validate: function (element, values) {
      let idValue = values.id;
      let bo = getBusinessObject(element);
      let idError = utils.isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : {};
    },
  });
}
