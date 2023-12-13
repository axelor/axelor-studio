import nameEntryFactory from "./implementation/Name";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { setDummyProperty } from "./CustomImplementation/utils";
import { getProcessBusinessObject, getFlowElements } from "../../extra";

export default function ProcessProps(
  group,
  element,
  translate,
  options,
  bpmnModeler
) {
  let businessObject = getBusinessObject(element);

  let processIdDescription = options && options.processIdDescription;

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    /**
     * processId
     */
    if (is(element, "bpmn:Participant")) {
      let idEntry = {
        id: "process-id",
        label: translate("Process id"),
        description: processIdDescription && translate(processIdDescription),
        modelProperty: "processId",
        widget: "textField", //validationAwareTextField
        isProcess: true,
      };

      // in participants we have to change the default behavior of set and get
      idEntry.get = function (element) {
        let properties = getProcessBusinessObject(element, "id");
        return { processId: properties.id };
      };

      idEntry.set = function (element, values) {
        const process = element.businessObject.processRef;
        if (process) {
          setDummyProperty({
            bpmnModeler,
            element,
            value: values.processId,
          });
          process.id = values.processId;

          /**Update call activity nodes */
          const flowElements = getFlowElements(process);
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
            camundaIn.source = values.processId;
            camundaIn.target = values.processId;
          });
        }
      };

      idEntry.validate = function (element, values) {
        let idValue = values.processId;
        let bo = getBusinessObject(element);
        if (!(bo && bo.processRef)) return;
        let processIdError = utils.isIdValid(
          bo && bo.processRef,
          idValue,
          translate
        );
        return processIdError ? { processId: processIdError } : {};
      };

      group.entries.push(idEntry);

      /**
       * process name
       */
      let processNameEntry = nameEntryFactory(element, {
        id: "process-name",
        label: translate("Process name"),
      })[0];

      // in participants we have to change the default behavior of set and get
      processNameEntry.get = function (element) {
        return getProcessBusinessObject(element, "name");
      };

      processNameEntry.set = function (element, values) {
        if (
          element &&
          element.businessObject &&
          element.businessObject.processRef
        ) {
          element.businessObject.processRef.name = values.name;
        }
      };

      group.entries.push(processNameEntry);
    }
  }
}
