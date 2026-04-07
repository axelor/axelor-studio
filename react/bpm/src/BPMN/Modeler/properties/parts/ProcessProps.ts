import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { isIdValid } from "../../../../utils/ValidationUtil";
import { getProcessBusinessObject, getFlowElements } from "../../extra";

import nameEntryFactory from "./implementation/Name";

export default function ProcessProps(
  group: any,
  element: any,
  translate: (s: string) => string,
  options: any,
  bpmnModeler: any,
) {
  const businessObject = getBusinessObject(element);

  const processIdDescription = options && options.processIdDescription;

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    /**
     * processId
     */
    if (is(element, "bpmn:Participant")) {
      const idEntry: Record<string, any> = {
        id: "process-id",
        label: translate("Process id"),
        description: processIdDescription && translate(processIdDescription),
        modelProperty: "processId",
        widget: "textField", //validationAwareTextField
        isProcess: true,
      };

      // in participants we have to change the default behavior of set and get
      idEntry.get = function (element: any) {
        const properties = getProcessBusinessObject(element, "id");
        return { processId: properties.id };
      };

      idEntry.set = function (element: any, values: any) {
        const process = getBusinessObject(element).processRef;
        if (process) {
          process.id = values.processId;

          /**Update call activity nodes */
          const flowElements = getFlowElements(process);
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
            camundaIn.source = values.processId;
            camundaIn.target = values.processId;
          });
        }
      };

      idEntry.validate = function (element: any, values: any) {
        const idValue = values.processId;
        const bo = getBusinessObject(element);
        if (!(bo && bo.processRef)) return;
        const processIdError = isIdValid(bo && bo.processRef, idValue, translate);
        return processIdError ? { processId: processIdError } : {};
      };

      group.entries.push(idEntry);

      /**
       * process name
       */
      const processNameEntries = nameEntryFactory(element, {
        id: "process-name",
        label: translate("Process name"),
      });
      const processNameEntry = processNameEntries?.[0];
      if (!processNameEntry) return;

      // in participants we have to change the default behavior of set and get
      processNameEntry.get = function (element: any) {
        return getProcessBusinessObject(element, "name");
      };

      processNameEntry.set = function (element: any, values: any) {
        if (element && getBusinessObject(element) && getBusinessObject(element).processRef) {
          getBusinessObject(element).processRef.name = values.name;
        }
      };

      group.entries.push(processNameEntry);
    }
  }
}
