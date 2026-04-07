import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

export const GATEWAY = ["bpmn:EventBasedGateway"];

export const CONDITIONAL_SOURCES = [
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
  "bpmn:ParallelGateway",
  "bpmn:SequenceFlow",
  "label",
  "bpmn:IntermediateThrowEvent",
  "bpmn:Collaboration",
  "bpmn:Lane",
  "bpmn:TextAnnotation",
  "bpmn:MessageFlow",
  "bpmn:ServiceTask",
  "bpmn:ScriptTask",
];

export const TITLE_SOURCES = [
  "bpmn:Process",
  "bpmn:Participant",
  "bpmn:Group",
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:Task",
  "bpmn:TextAnnotation",
];

export const HELP_TITLE_SOURCES = [
  "bpmn:IntermediateThrowEvent",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
  "bpmn:ParallelGateway",
  "bpmn:SequenceFlow",
  "label",
  "bpmn:Collaboration",
  "bpmn:Lane",
  "bpmn:TextAnnotation",
  "bpmn:MessageFlow",
  "bpmn:DataObjectReference",
  "bpmn:DataStoreReference",
];

export const typesWithMenuAction = [
  "bpmn:StartEvent",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:Group",
  "bpmn:Association",
  "bpmn:EndEvent",
  "bpmn:UserTask",
  "bpmn:ReceiveTask",
  "bpmn:CallActivity",
  "bpmn:SubProcess",
];

export const EVENT_DEFINITIONS_TYPES = {
  "bpmn:StartEvent": [
    "bpmn:MessageEventDefinition",
    "bpmn:TimerEventDefinition",
    "bpmn:ConditionalEventDefinition",
    "bpmn:SignalEventDefinition",
    "bpmn:IntermediateCatchEvent",
  ],
  "bpmn:IntermediateCatchEvent": [
    "bpmn:MessageEventDefinition",
    "bpmn:TimerEventDefinition",
    "bpmn:ConditionalEventDefinition",
    "bpmn:LinkEventDefinition",
    "bpmn:SignalEventDefinition",
  ],
  "bpmn:EndEvent": [
    "bpmn:MessageEventDefinition",
    "bpmn:CompensateEventDefinition",
    "bpmn:ErrorEventDefinition",
    "bpmn:TerminateEventDefinition",
    "bpmn:EscalationEventDefinition",
  ],
  "bpmn:IntermediateThrowEvent": ["bpmn:SignalEventDefinition"],
};

export const PRIORITIES = [
  { value: "low", id: "low", title: "Low" },
  { value: "normal", id: "normal", title: "Normal" },
  { value: "high", id: "high", title: "High" },
  { value: "urgent", id: "urgent", title: "Urgent" },
];

export function isConditionalSource(element: any) {
  return isAny(element, CONDITIONAL_SOURCES);
}
