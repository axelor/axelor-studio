import { getTimerEventDefinition } from "../../../../../utils/EventDefinitionUtil";
import { getFailedJobRetryTimeCycle, isAsyncAfter, isAsyncBefore } from "../../../../../utils";
import { createElement } from "../../../../../utils/ElementUtil";
import { is } from "bpmn-js/lib/util/ModelUtil";




function createExtensionElements(parent, bpmnFactory) {
  return createElement(
    "bpmn:ExtensionElements",
    { values: [] },
    parent,
    bpmnFactory
  );
}

function createFailedJobRetryTimeCycle(parent, bpmnFactory, cycle) {
  return createElement(
    "camunda:FailedJobRetryTimeCycle",
    { body: cycle },
    parent,
    bpmnFactory
  );
}

export default function JobRetryTimeCycle(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject;

  let idPrefix = options.idPrefix || "",
    labelPrefix = options.labelPrefix || "";

  let retryTimeCycleEntry = {
    id: idPrefix + "retryTimeCycle",
    label: labelPrefix + translate("Retry time cycle"),
    modelProperty: "cycle",
    widget: "textField",
    get: function (element, node) {
      let retryTimeCycle = getFailedJobRetryTimeCycle(
        getBusinessObject(element)
      );
      let value = retryTimeCycle && retryTimeCycle.get("body");
      return {
        cycle: value,
      };
    },

    set: function (element, values, node) {
      let newCycle = values.cycle;
      let bo = getBusinessObject(element);
      if (newCycle === "" || typeof newCycle === "undefined" || !newCycle) {
        // remove retry time cycle element(s)
        const extensionElements = bo.extensionElements.values;
        const index = extensionElements.findIndex(
          (e) => e.$type === "camunda:FailedJobRetryTimeCycle"
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

        retryTimeCycle = createFailedJobRetryTimeCycle(
          extensionElements,
          bpmnFactory,
          newCycle
        );
        extensionElements.values.push(retryTimeCycle);
        return;
      }
      // update existing retry time cycle element
      retryTimeCycle.body = newCycle;
    },

    hidden: function (element) {
      let bo = getBusinessObject(element);

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
