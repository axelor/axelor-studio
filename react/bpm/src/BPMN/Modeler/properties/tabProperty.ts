const commonTabs = ["general", "node-configuration", "menu-action-tab", "listeners", "comments"];
const defaultTabs = ["general", "node-configuration", "menu-action-tab", "comments"];
const commonTabsWithoutMenuAction = ["general", "node-configuration", "listeners", "comments"];
const defaultTabsWithoutMenuAction = ["general", "node-configuration", "comments"];
const variableTabsWithoutMenuAction = [
  "general",
  "node-configuration",
  "variables",
  "listeners",
  "comments",
];
const withViewAttributes = [
  "general",
  "node-configuration",
  "listeners",
  "view-attributes",
  "menu-action-tab",
  "comments",
];
const variableTabsWithViewAttributes = [
  "general",
  "node-configuration",
  "variables",
  "view-attributes",
  "menu-action-tab",
  "listeners",
  "comments",
];

export const tabProperty = [
  {
    type: "bpmn:Process",
    subType: undefined,
    tabs: ["general", "configuration", "listeners", "comments"],
  },
  {
    type: "bpmn:StartEvent",
    subType: undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: undefined,
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:ExclusiveGateway",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EventBasedGateway",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:InclusiveGateway",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:ComplexGateway",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:ParallelGateway",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:AdHocSubProcess",
    subType: undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:TimerEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:ConditionalEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:ErrorEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:CancelEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:CancelEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: variableTabsWithViewAttributes,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:IntermediateCatchEvent",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },

  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:TimerEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:ConditionalEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:LinkEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:LinkEventDefinition",
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: variableTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:ErrorEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:TerminateEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:Participant",
    subType: undefined,
    tabs: ["general", "configuration", "listeners", "comments"],
  },
  {
    type: "bpmn:Group",
    subType: undefined,
    tabs: defaultTabs,
  },
  {
    type: "bpmn:Lane",
    subType: undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:Collaboration",
    subType: undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:SequenceFlow",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:MessageFlow",
    subType: undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:Task",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:SendTask",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:UserTask",
    subType: undefined,
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:ManualTask",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BusinessRuleTask",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:ServiceTask",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:ReceiveTask",
    subType: undefined,
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:ScriptTask",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:CallActivity",
    subType: undefined,
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:SubProcess",
    subType: undefined,
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: withViewAttributes,
  },
  {
    type: "bpmn:TextAnnotation",
    subType: undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:Association",
    subType: undefined,
    tabs: defaultTabs,
  },
  {
    type: "bpmn:Transaction",
    subType: undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:TimerEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:ConditionalEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:ErrorEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:CancelEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:DataObjectReference",
    subType: undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:DataStoreReference",
    subType: undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:DataOutputAssociation",
    subType: undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:Definitions",
    subType: undefined,
    tabs: ["definition"],
  },
];
