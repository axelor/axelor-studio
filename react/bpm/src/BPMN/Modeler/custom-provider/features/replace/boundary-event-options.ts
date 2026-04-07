import { translate } from "@studio/shared/i18n";

export const BOUNDARY_EVENT = [
  {
    label: translate("Message boundary event"),
    actionName: "replace-with-message-boundary",
    className: "bpmn-icon-intermediate-event-catch-message",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: translate("Timer boundary event"),
    actionName: "replace-with-timer-boundary",
    className: "bpmn-icon-intermediate-event-catch-timer",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: translate("Escalation boundary event"),
    actionName: "replace-with-escalation-boundary",
    className: "bpmn-icon-intermediate-event-catch-escalation",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: translate("Conditional boundary event"),
    actionName: "replace-with-conditional-boundary",
    className: "bpmn-icon-intermediate-event-catch-condition",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: translate("Error boundary event"),
    actionName: "replace-with-error-boundary",
    className: "bpmn-icon-intermediate-event-catch-error",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:ErrorEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: translate("Cancel boundary event"),
    actionName: "replace-with-cancel-boundary",
    className: "bpmn-icon-intermediate-event-catch-cancel",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:CancelEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: translate("Signal boundary event"),
    actionName: "replace-with-signal-boundary",
    className: "bpmn-icon-intermediate-event-catch-signal",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: translate("Compensation boundary event"),
    actionName: "replace-with-compensation-boundary",
    className: "bpmn-icon-intermediate-event-catch-compensation",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:CompensateEventDefinition",
      cancelActivity: true,
    },
  },
  {
    label: `${translate("Message boundary event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-message-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-message",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Timer boundary event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-timer-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-timer",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Escalation boundary event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-escalation-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-escalation",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Conditional boundary event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-conditional-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-condition",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Signal boundary event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-signal-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-signal",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
      cancelActivity: false,
    },
  },
];

export const EVENT_SUB_PROCESS_START_EVENT = [
  {
    label: translate("Message start event"),
    actionName: "replace-with-message-start",
    className: "bpmn-icon-start-event-message",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
      isInterrupting: true,
    },
  },
  {
    label: translate("Timer start event"),
    actionName: "replace-with-timer-start",
    className: "bpmn-icon-start-event-timer",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
      isInterrupting: true,
    },
  },
  {
    label: translate("Conditional start event"),
    actionName: "replace-with-conditional-start",
    className: "bpmn-icon-start-event-condition",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
      isInterrupting: true,
    },
  },
  {
    label: translate("Signal start event"),
    actionName: "replace-with-signal-start",
    className: "bpmn-icon-start-event-signal",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
      isInterrupting: true,
    },
  },
  {
    label: translate("Error start event"),
    actionName: "replace-with-error-start",
    className: "bpmn-icon-start-event-error",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:ErrorEventDefinition",
      isInterrupting: true,
    },
  },
  {
    label: translate("Escalation start event"),
    actionName: "replace-with-escalation-start",
    className: "bpmn-icon-start-event-escalation",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
      isInterrupting: true,
    },
  },
  {
    label: translate("Compensation start event"),
    actionName: "replace-with-compensation-start",
    className: "bpmn-icon-start-event-compensation",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:CompensateEventDefinition",
      isInterrupting: true,
    },
  },
  {
    label: `${translate("Message start event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-message-start",
    className: "bpmn-icon-start-event-non-interrupting-message",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Timer start event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-timer-start",
    className: "bpmn-icon-start-event-non-interrupting-timer",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Conditional start event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-conditional-start",
    className: "bpmn-icon-start-event-non-interrupting-condition",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Signal start event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-signal-start",
    className: "bpmn-icon-start-event-non-interrupting-signal",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Escalation start event")} (${translate("non-interrupting")})`,
    actionName: "replace-with-non-interrupting-escalation-start",
    className: "bpmn-icon-start-event-non-interrupting-escalation",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
      isInterrupting: false,
    },
  },
];
