import { translate } from "@studio/shared/i18n";

export const INTERMEDIATE_EVENT = [
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
    label: translate("Message intermediate catch event"),
    actionName: "replace-with-message-intermediate-catch",
    className: "bpmn-icon-intermediate-event-catch-message",
    target: {
      type: "bpmn:IntermediateCatchEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
    },
  },
  {
    label: translate("Message intermediate throw event"),
    actionName: "replace-with-message-intermediate-throw",
    className: "bpmn-icon-intermediate-event-throw-message",
    target: {
      type: "bpmn:IntermediateThrowEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
    },
  },
  {
    label: translate("Timer intermediate catch event"),
    actionName: "replace-with-timer-intermediate-catch",
    className: "bpmn-icon-intermediate-event-catch-timer",
    target: {
      type: "bpmn:IntermediateCatchEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
    },
  },
  {
    label: translate("Escalation intermediate throw event"),
    actionName: "replace-with-escalation-intermediate-throw",
    className: "bpmn-icon-intermediate-event-throw-escalation",
    target: {
      type: "bpmn:IntermediateThrowEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
    },
  },
  {
    label: translate("Conditional intermediate catch event"),
    actionName: "replace-with-conditional-intermediate-catch",
    className: "bpmn-icon-intermediate-event-catch-condition",
    target: {
      type: "bpmn:IntermediateCatchEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
    },
  },
  {
    label: translate("Link intermediate catch event"),
    actionName: "replace-with-link-intermediate-catch",
    className: "bpmn-icon-intermediate-event-catch-link",
    target: {
      type: "bpmn:IntermediateCatchEvent",
      eventDefinitionType: "bpmn:LinkEventDefinition",
      eventDefinitionAttrs: {
        name: "",
      },
    },
  },
  {
    label: translate("Link intermediate throw event"),
    actionName: "replace-with-link-intermediate-throw",
    className: "bpmn-icon-intermediate-event-throw-link",
    target: {
      type: "bpmn:IntermediateThrowEvent",
      eventDefinitionType: "bpmn:LinkEventDefinition",
      eventDefinitionAttrs: {
        name: "",
      },
    },
  },
  {
    label: translate("Compensation intermediate throw event"),
    actionName: "replace-with-compensation-intermediate-throw",
    className: "bpmn-icon-intermediate-event-throw-compensation",
    target: {
      type: "bpmn:IntermediateThrowEvent",
      eventDefinitionType: "bpmn:CompensateEventDefinition",
    },
  },
  {
    label: translate("Signal intermediate catch event"),
    actionName: "replace-with-signal-intermediate-catch",
    className: "bpmn-icon-intermediate-event-catch-signal",
    target: {
      type: "bpmn:IntermediateCatchEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
    },
  },
  {
    label: translate("Signal intermediate throw event"),
    actionName: "replace-with-signal-intermediate-throw",
    className: "bpmn-icon-intermediate-event-throw-signal",
    target: {
      type: "bpmn:IntermediateThrowEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
    },
  },
];
