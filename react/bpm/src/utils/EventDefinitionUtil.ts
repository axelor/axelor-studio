import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { find } from "min-dash";
import type { ModdleElement, BpmnElement } from "@studio/shared/types";

type ElementInput = BpmnElement | ModdleElement | undefined;

export function getErrorEventDefinition(element: ElementInput): ModdleElement | undefined {
  return getEventDefinition(element, "bpmn:ErrorEventDefinition");
}

export function getTimerEventDefinition(element: ElementInput): ModdleElement | undefined {
  return getEventDefinition(element, "bpmn:TimerEventDefinition");
}

function getEventDefinition(
  element: ElementInput,
  eventType: string,
): ModdleElement | undefined {
  const businessObject = getBusinessObject(element as BpmnElement);

  const eventDefinitions =
    (businessObject["eventDefinitions"] as ModdleElement[] | undefined) || [];

  return find(eventDefinitions, function (definition: ModdleElement) {
    return is(definition, eventType);
  });
}

export function getMessageEventDefinition(element: ElementInput): ModdleElement | undefined {
  if (is(element, "bpmn:ReceiveTask")) {
    return getBusinessObject(element as BpmnElement) as ModdleElement;
  }

  return getEventDefinition(element, "bpmn:MessageEventDefinition");
}

export function getLinkEventDefinition(element: ElementInput): ModdleElement | undefined {
  return getEventDefinition(element, "bpmn:LinkEventDefinition");
}

export function getSignalEventDefinition(element: ElementInput): ModdleElement | undefined {
  return getEventDefinition(element, "bpmn:SignalEventDefinition");
}

export function getEscalationEventDefinition(element: ElementInput): ModdleElement | undefined {
  return getEventDefinition(element, "bpmn:EscalationEventDefinition");
}

export function getCompensateEventDefinition(element: ElementInput): ModdleElement | undefined {
  return getEventDefinition(element, "bpmn:CompensateEventDefinition");
}

export function getConditionalEventDefinition(element: ElementInput): ModdleElement | undefined {
  return getEventDefinition(element, "bpmn:ConditionalEventDefinition");
}
