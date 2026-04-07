import { translate } from "@studio/shared/i18n";

export const END_EVENT = [
  {
    label: translate("Start event"),
    actionName: "replace-with-none-start",
    className: "bpmn-icon-start-event-none",
    target: {
      type: "bpmn:StartEvent",
    },
  },
  {
    label: translate("Intermediate throw event"),
    actionName: "replace-with-none-intermediate-throw",
    className: "bpmn-icon-intermediate-event-none",
    target: {
      type: "bpmn:IntermediateThrowEvent",
    },
  },
  {
    label: translate("End event"),
    actionName: "replace-with-none-end",
    className: "bpmn-icon-end-event-none",
    target: {
      type: "bpmn:EndEvent",
    },
  },
  {
    label: translate("Message end event"),
    actionName: "replace-with-message-end",
    className: "bpmn-icon-end-event-message",
    target: {
      type: "bpmn:EndEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
    },
  },
  {
    label: translate("Escalation end event"),
    actionName: "replace-with-escalation-end",
    className: "bpmn-icon-end-event-escalation",
    target: {
      type: "bpmn:EndEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
    },
  },
  {
    label: translate("Error end event"),
    actionName: "replace-with-error-end",
    className: "bpmn-icon-end-event-error",
    target: {
      type: "bpmn:EndEvent",
      eventDefinitionType: "bpmn:ErrorEventDefinition",
    },
  },
  {
    label: translate("Cancel end event"),
    actionName: "replace-with-cancel-end",
    className: "bpmn-icon-end-event-cancel",
    target: {
      type: "bpmn:EndEvent",
      eventDefinitionType: "bpmn:CancelEventDefinition",
    },
  },
  {
    label: translate("Compensation end event"),
    actionName: "replace-with-compensation-end",
    className: "bpmn-icon-end-event-compensation",
    target: {
      type: "bpmn:EndEvent",
      eventDefinitionType: "bpmn:CompensateEventDefinition",
    },
  },
  {
    label: translate("Signal end event"),
    actionName: "replace-with-signal-end",
    className: "bpmn-icon-end-event-signal",
    target: {
      type: "bpmn:EndEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
    },
  },
  {
    label: translate("Terminate end event"),
    actionName: "replace-with-terminate-end",
    className: "bpmn-icon-end-event-terminate",
    target: {
      type: "bpmn:EndEvent",
      eventDefinitionType: "bpmn:TerminateEventDefinition",
    },
  },
];
