import { translate } from "@studio/shared/i18n";

export const START_EVENT = [
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
    actionName: "replace-with-none-intermediate-throwing",
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
    label: translate("Message start event"),
    actionName: "replace-with-message-start",
    className: "bpmn-icon-start-event-message",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
    },
  },
  {
    label: translate("Timer start event"),
    actionName: "replace-with-timer-start",
    className: "bpmn-icon-start-event-timer",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
    },
  },
  {
    label: translate("Conditional start event"),
    actionName: "replace-with-conditional-start",
    className: "bpmn-icon-start-event-condition",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
    },
  },
  {
    label: translate("Signal start event"),
    actionName: "replace-with-signal-start",
    className: "bpmn-icon-start-event-signal",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
    },
  },
];

export const START_EVENT_SUB_PROCESS = [
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
    actionName: "replace-with-none-intermediate-throwing",
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
];
