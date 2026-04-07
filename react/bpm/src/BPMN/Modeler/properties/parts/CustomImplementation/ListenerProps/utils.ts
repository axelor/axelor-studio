import { translate } from "@studio/shared/i18n";

import { getExtensionElements } from "../../../../../../utils/ExtensionElementsUtil";
import { createElement } from "../../../../../../utils/ElementUtil";

export const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";
export const CAMUNDA_TASK_LISTENER_ELEMENT = "camunda:TaskListener";

export const LISTENER_TYPE_LABEL = {
  class: translate("Java class"),
  expression: translate("Expression"),
  delegateExpression: translate("Delegate expression"),
  script: translate("Script"),
};

export const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

export function getListeners(bo: any, type: any) {
  return (bo && getExtensionElements(bo, type)) || [];
}

export function getTimerDefinitionType(timer: any) {
  if (!timer) {
    return;
  }

  const timeDate = timer.get("timeDate");
  if (typeof timeDate !== "undefined") {
    return "timeDate";
  }

  const timeCycle = timer.get("timeCycle");
  if (typeof timeCycle !== "undefined") {
    return "timeCycle";
  }

  const timeDuration = timer.get("timeDuration");
  if (typeof timeDuration !== "undefined") {
    return "timeDuration";
  }
}

export function getTimerDefinition(timerOrFunction: any, element?: any, node?: any) {
  if (typeof timerOrFunction === "function") {
    return timerOrFunction(element, node);
  }
  return timerOrFunction;
}

export function createFormalExpression(parent: any, body: any, bpmnFactory: any) {
  body = body || undefined;
  return createElement("bpmn:FormalExpression", { body: body }, parent, bpmnFactory);
}
