import { is } from "bpmn-js/lib/util/ModelUtil";

import { getTimerEventDefinition } from "../../../../../utils/EventDefinitionUtil";
import { getFailedJobRetryTimeCycle, isAsyncAfter, isAsyncBefore } from "../../../../../utils";
import { createElement } from "../../../../../utils/ElementUtil";

function createExtensionElements(parent: any, bpmnFactory: any) {
  return createElement("bpmn:ExtensionElements", { values: [] }, parent, bpmnFactory);
}

function createFailedJobRetryTimeCycle(parent: any, bpmnFactory: any, cycle: any) {
  return createElement("camunda:FailedJobRetryTimeCycle", { body: cycle }, parent, bpmnFactory);
}

export default function JobRetryTimeCycle(
  element: any,
  bpmnFactory: any,
  options: any,
  translate: (s: string) => string,
) {
  const getBusinessObject = options.getBusinessObject;

  const idPrefix = options.idPrefix || "",
    labelPrefix = options.labelPrefix || "";

  const retryTimeCycleEntry: Record<string, any> = {
    id: idPrefix + "retryTimeCycle",
    label: labelPrefix + translate("Retry time cycle"),
    modelProperty: "cycle",
    widget: "textField",
    get: function (element: any, _node: any) {
      const retryTimeCycle = getFailedJobRetryTimeCycle(getBusinessObject(element));
      const value = retryTimeCycle && retryTimeCycle.get("body");
      return {
        cycle: value,
      };
    },

    set: function (element: any, values: any, _node: any) {
      const newCycle = values.cycle;
      const bo = getBusinessObject(element);
      if (newCycle === "" || typeof newCycle === "undefined" || !newCycle) {
        // remove retry time cycle element(s)
        const extensionElements = bo.extensionElements.values;
        const index = extensionElements.findIndex(
          (e: any) => e.$type === "camunda:FailedJobRetryTimeCycle",
        );
        if (index > -1) {
          extensionElements.splice(index, 1);
        }
      }

      let retryTimeCycle = getFailedJobRetryTimeCycle(bo);

      if (!retryTimeCycle) {
        // add new retry time cycle element
        let extensionElements = bo.get("extensionElements");
        if (!extensionElements) {
          extensionElements = createExtensionElements(bo, bpmnFactory);
          bo.extensionElements = extensionElements;
        }

        retryTimeCycle = createFailedJobRetryTimeCycle(extensionElements, bpmnFactory, newCycle);
        extensionElements.values.push(retryTimeCycle);
        return;
      }
      // update existing retry time cycle element
      retryTimeCycle.body = newCycle;
    },

    hidden: function (element: any) {
      const bo = getBusinessObject(element);

      if (bo && (isAsyncBefore(bo) || isAsyncAfter(bo))) {
        return false;
      }

      if (is(element, "bpmn:Event")) {
        return !getTimerEventDefinition(element);
      }

      return true;
    },
  };

  return [retryTimeCycleEntry];
}
