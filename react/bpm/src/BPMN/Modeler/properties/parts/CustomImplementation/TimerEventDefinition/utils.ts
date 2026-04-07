import { translate } from "@studio/shared/i18n";

import { createElement } from "../../../../../../utils/ElementUtil";

export const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

export const valueTypeOptions = [
  { value: "value", name: translate("Value") },
  { value: "expression", name: translate("Expression") },
];

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

export function createFormalExpression(parent: any, body: any, bpmnFactory: any) {
  body = body || undefined;
  return createElement("bpmn:FormalExpression", { body: body }, parent, bpmnFactory);
}
