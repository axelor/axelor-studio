import { translate } from "../../../../../utils";

export var START_EVENT = [
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

export var START_EVENT_SUB_PROCESS = [
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

export var INTERMEDIATE_EVENT = [
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

export var END_EVENT = [
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

export var GATEWAY = [
  {
    label: translate("Exclusive gateway"),
    actionName: "replace-with-exclusive-gateway",
    className: "bpmn-icon-gateway-xor",
    target: {
      type: "bpmn:ExclusiveGateway",
    },
  },
  {
    label: translate("Parallel gateway"),
    actionName: "replace-with-parallel-gateway",
    className: "bpmn-icon-gateway-parallel",
    target: {
      type: "bpmn:ParallelGateway",
    },
  },
  {
    label: translate("Inclusive gateway"),
    actionName: "replace-with-inclusive-gateway",
    className: "bpmn-icon-gateway-or",
    target: {
      type: "bpmn:InclusiveGateway",
    },
  },
  {
    label: translate("Complex gateway"),
    actionName: "replace-with-complex-gateway",
    className: "bpmn-icon-gateway-complex",
    target: {
      type: "bpmn:ComplexGateway",
    },
  },
  {
    label: translate("Event-based gateway"),
    actionName: "replace-with-event-based-gateway",
    className: "bpmn-icon-gateway-eventbased",
    target: {
      type: "bpmn:EventBasedGateway",
      instantiate: false,
      eventGatewayType: "Exclusive",
    },
  },
];

export var SUBPROCESS_EXPANDED = [
  {
    label: translate("Transaction"),
    actionName: "replace-with-transaction",
    className: "bpmn-icon-transaction",
    target: {
      type: "bpmn:Transaction",
      isExpanded: true,
    },
  },
  {
    label: translate("Event sub-process"),
    actionName: "replace-with-event-subprocess",
    className: "bpmn-icon-event-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      triggeredByEvent: true,
      isExpanded: true,
    },
  },
  {
    label: `${translate("Sub-process")} (${translate("collapsed")}})`,
    actionName: "replace-with-collapsed-subprocess",
    className: "bpmn-icon-subprocess-collapsed",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: false,
    },
  },
];

export var TRANSACTION = [
  {
    label: translate("Transaction"),
    actionName: "replace-with-transaction",
    className: "bpmn-icon-transaction",
    target: {
      type: "bpmn:Transaction",
      isExpanded: true,
    },
  },
  {
    label: translate("Sub-process"),
    actionName: "replace-with-subprocess",
    className: "bpmn-icon-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: true,
    },
  },
  {
    label: translate("Event sub-process"),
    actionName: "replace-with-event-subprocess",
    className: "bpmn-icon-event-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      triggeredByEvent: true,
      isExpanded: true,
    },
  },
];

export var EVENT_SUB_PROCESS = TRANSACTION;

export var TASK = [
  {
    label: translate("Task"),
    actionName: "replace-with-task",
    className: "bpmn-icon-task",
    target: {
      type: "bpmn:Task",
    },
  },
  {
    label: translate("User task"),
    actionName: "replace-with-user-task",
    className: "bpmn-icon-user",
    target: {
      type: "bpmn:UserTask",
    },
  },
  {
    label: translate("Service task"),
    actionName: "replace-with-service-task",
    className: "bpmn-icon-service",
    target: {
      type: "bpmn:ServiceTask",
    },
  },
  {
    label: translate("Send task"),
    actionName: "replace-with-send-task",
    className: "bpmn-icon-send",
    target: {
      type: "bpmn:SendTask",
    },
  },
  {
    label: translate("Receive task"),
    actionName: "replace-with-receive-task",
    className: "bpmn-icon-receive",
    target: {
      type: "bpmn:ReceiveTask",
    },
  },
  {
    label: translate("Manual task"),
    actionName: "replace-with-manual-task",
    className: "bpmn-icon-manual",
    target: {
      type: "bpmn:ManualTask",
    },
  },
  {
    label: translate("Business rule task"),
    actionName: "replace-with-rule-task",
    className: "bpmn-icon-business-rule",
    target: {
      type: "bpmn:BusinessRuleTask",
    },
  },
  {
    label: translate("Script task"),
    actionName: "replace-with-script-task",
    className: "bpmn-icon-script",
    target: {
      type: "bpmn:ScriptTask",
    },
  },
  {
    label: translate("Call activity"),
    actionName: "replace-with-call-activity",
    className: "bpmn-icon-call-activity",
    target: {
      type: "bpmn:CallActivity",
    },
  },
  {
    label: `${translate("Sub-process")} (${translate("collapsed")})`,
    actionName: "replace-with-collapsed-subprocess",
    className: "bpmn-icon-subprocess-collapsed",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: false,
    },
  },
  {
    label: `${translate("Sub-process")} (${translate("expanded")})`,
    actionName: "replace-with-expanded-subprocess",
    className: "bpmn-icon-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: true,
    },
  },
];

export var DATA_OBJECT_REFERENCE = [
  {
    label: translate("Data store reference"),
    actionName: "replace-with-data-store-reference",
    className: "bpmn-icon-data-store",
    target: {
      type: "bpmn:DataStoreReference",
    },
  },
];

export var DATA_STORE_REFERENCE = [
  {
    label: translate("Data object reference"),
    actionName: "replace-with-data-object-reference",
    className: "bpmn-icon-data-object",
    target: {
      type: "bpmn:DataObjectReference",
    },
  },
];

export var BOUNDARY_EVENT = [
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
    label: `${translate("Message boundary event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-message-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-message",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Timer boundary event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-timer-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-timer",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Escalation boundary event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-escalation-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-escalation",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Conditional boundary event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-conditional-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-condition",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
      cancelActivity: false,
    },
  },
  {
    label: `${translate("Signal boundary event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-signal-boundary",
    className: "bpmn-icon-intermediate-event-catch-non-interrupting-signal",
    target: {
      type: "bpmn:BoundaryEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
      cancelActivity: false,
    },
  },
];

export var EVENT_SUB_PROCESS_START_EVENT = [
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
    label: `${translate("Message start event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-message-start",
    className: "bpmn-icon-start-event-non-interrupting-message",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:MessageEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Timer start event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-timer-start",
    className: "bpmn-icon-start-event-non-interrupting-timer",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:TimerEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Conditional start event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-conditional-start",
    className: "bpmn-icon-start-event-non-interrupting-condition",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:ConditionalEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Signal start event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-signal-start",
    className: "bpmn-icon-start-event-non-interrupting-signal",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:SignalEventDefinition",
      isInterrupting: false,
    },
  },
  {
    label: `${translate("Escalation start event")} (${translate(
      "non-interrupting"
    )})`,
    actionName: "replace-with-non-interrupting-escalation-start",
    className: "bpmn-icon-start-event-non-interrupting-escalation",
    target: {
      type: "bpmn:StartEvent",
      eventDefinitionType: "bpmn:EscalationEventDefinition",
      isInterrupting: false,
    },
  },
];

export var SEQUENCE_FLOW = [
  {
    label: translate("Sequence flow"),
    actionName: "replace-with-sequence-flow",
    className: "bpmn-icon-connection",
  },
  {
    label: translate("Default flow"),
    actionName: "replace-with-default-flow",
    className: "bpmn-icon-default-flow",
  },
  {
    label: translate("Conditional flow"),
    actionName: "replace-with-conditional-flow",
    className: "bpmn-icon-conditional-flow",
  },
];

export var PARTICIPANT = [
  {
    label: translate("Expanded pool/participant"),
    actionName: "replace-with-expanded-pool",
    className: "bpmn-icon-participant",
    target: {
      type: "bpmn:Participant",
      isExpanded: true,
    },
  },
  {
    label: function (element) {
      var label = translate("Empty pool/participant");

      if (element.children && element.children.length) {
        label += " (removes content)";
      }

      return label;
    },
    actionName: "replace-with-collapsed-pool",

    className: "bpmn-icon-lane",
    target: {
      type: "bpmn:Participant",
      isExpanded: false,
    },
  },
];
