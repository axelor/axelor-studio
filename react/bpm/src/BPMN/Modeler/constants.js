import { translate } from "mapper/src/utils";

export const FILL_COLORS = {
  "bpmn:Task": "#cfe7f4",
  "bpmn:UserTask": "#c5ebf3",
  "bpmn:SendTask": "#fddeb3",
  "bpmn:ReceiveTask": "#fde8b3",
  "bpmn:ManualTask": "#c5e0fc",
  "bpmn:BusinessRuleTask": "#f8cfde",
  "bpmn:ServiceTask": "#c5ece4",
  "bpmn:ScriptTask": "#ffeed4",
  "bpmn:CallActivity": "#fee5bf",
  "bpmn:SubProcess": "#E4EBF8",
  "bpmn:StartEvent": "#ccecc6",
  "bpmn:EndEvent": "#ffd4c7",
  "bpmn:Gateway": "#fdecb3",
  "bpmn:IntermediateThrowEvent": "#ffe0b3",
  "bpmn:IntermediateCatchEvent": "#ffe0b3",
  "bpmn:BoundaryEvent": "#ffe0b3",
  "bpmn:DataOutputAssociation": "#8095B3",
  "bpmn:Transaction": "#E4EBF8",
  "bpmn:DataObjectReference": "#eeceee",
  "bpmn:DataStoreReference": "#ffcfd4",
  "bpmn:AdHocSubProcess": "#E4EBF8",
};

export const DATA_STORE_TYPES = [
  "bpmn:DataOutputAssociation",
  "bpmn:DataObjectReference",
  "bpmn:DataStoreReference",
];

export const STROKE_COLORS = {
  "bpmn:Task": "#5EAEDA",
  "bpmn:UserTask": "#3FBDD6",
  "bpmn:SendTask": "#F79000",
  "bpmn:ReceiveTask": "#F8B200",
  "bpmn:ManualTask": "#3F97F6",
  "bpmn:BusinessRuleTask": "#E76092",
  "bpmn:ServiceTask": "#3EBFA5",
  "bpmn:ScriptTask": "#FF9E0F",
  "bpmn:CallActivity": "#FBA729",
  "bpmn:SubProcess": "#6097fc",
  "bpmn:AdHocSubProcess": "#6097fc",
  "bpmn:Transaction": "#6097fc",
  "bpmn:SequenceFlow": "#8095B3",
  "bpmn:StartEvent": "#55c041",
  "bpmn:EndEvent": "#ff7043",
  "bpmn:Gateway": "#f9c000",
  "bpmn:IntermediateThrowEvent": "#ff9800",
  "bpmn:IntermediateCatchEvent": "#ff9800",
  "bpmn:Participant": "#c8c8c8",
  "bpmn:Lane": "#c8c8c8",
  "bpmn:Group": "#c8c8c8",
  "bpmn:Association": "#8095B3",
  "bpmn:TextAnnotation": "#7D8187",
  "bpmn:BoundaryEvent": "#ff9800",
  "bpmn:DataObjectReference": "#a80ca8",
  "bpmn:DataStoreReference": "#e53935",
  "bpmn:DataOutputAssociation": "#8095B3",
};

export const RELATIVE_FILL = {
  "#5eaeda": "#cfe7f4",
  "#3fbdd6": "#c5ebf3",
  "#f79000": "#fddeb3",
  "#f8b200": "#fde8b3",
  "#3f97f6": "#c5e0fc",
  "#e76092": "#f8cfde",
  "#3ebfa5": "#c5ece4",
  "#ff9e0f": "#ffeed4",
  "#fba729": "#fee5bf",
  "#6097fc": "#e4ebf8",
  "#55c041": "#ccecc6",
  "#ff7043": "#ffd4c7",
  "#f9c000": "#fdecb3",
  "#ff9800": "#ffe0b3",
  "#a80ca8": "#eeceee",
  "#e53935": "#ffcfd4",
  "#000000": "#ffffff",
};

export const USER_TASKS_TYPES = [
  "bpmn:UserTask",
  "bpmn:ReceiveTask",
  "bpmn:CallActivity",
  "bpmn:SubProcess",
];

export const SUBPROCESS_TYPES = [
  "bpmn:subprocess",
  "bpmn:transaction",
  "multiinstancesequential",
  "multiinstanceparallel",
];

export const WKF_COLORS = [
  { name: "red", title: "Red", color: "#f44336" },
  { name: "pink", title: "Pink", color: "#e91e63" },
  { name: "purple", title: "Purple", color: "#9c27b0" },
  { name: "deeppurple", title: "Deep Purple", color: "#673ab7" },
  { name: "indigo", title: "Indigo", color: "#3f51b5" },
  { name: "blue", title: "Blue", color: "#2196f3" },
  { name: "lightblue", title: "Light Blue", color: "#03a9f4" },
  { name: "cyan", title: "Cyan", color: "#00bcd4" },
  { name: "teal", title: "Teal", color: "#009688" },
  { name: "green", title: "Green", color: "#4caf50" },
  {
    name: "lightgreen",
    title: "Light Green",
    color: "#8bc34a",
    border: "black",
  },
  { name: "lime", title: "Lime", color: "#cddc39", border: "black" },
  { name: "yellow", title: "Yellow", color: "#ffeb3b", border: "black" },
  { name: "amber", title: "Amber", color: "#ffc107", border: "black" },
  { name: "orange", title: "Orange", color: "#ff9800", border: "black" },
  { name: "deeporange", title: "Deep Orange", color: "#ff5722" },
  { name: "brown", title: "Brown", color: "#795548" },
  { name: "grey", title: "Grey", color: "#9e9e9e", border: "black" },
  { name: "bluegrey", title: "Blue Grey", color: "#607d8b" },
  { name: "black", title: "Black", color: "black" },
  { name: "white", title: "White", color: "whitesmoke", border: "black" },
];

export const WKF_FIELDS = [
  "importOrigin",
  "code",
  "diagramXml",
  "description",
  "isActive",
  "wkfTaskConfigList",
  "deploymentId",
  "dmnFileSet",
  "generatedFromCallActivity",
  "id",
  "processInstanceId",
  "previousVersion",
  "previousVersion.statusSelect",
  "wkfProcessList",
  "versionTag",
  "oldNodes",
  "version",
  "attrs",
  "statusSelect",
  "name",
  "wkfStatusColor",
  "studioApp",
  "newVersionOnDeploy",
];

export const RELATED_FIELDS = ["name", "processId", "wkfProcessConfigList"];

export const STATUS = {
  1: "New",
  2: "On Going",
  3: "Terminated",
};

export const COLORS = [
  "#2196f3",
  "#6c757d",
  "#4caf50",
  "#00bcd4",
  "#ff9800",
  "#f44336",
  "#f44336",
  "#2196f3",
  "#3f51b5",
  "#9c27b0",
  "#e91e63",
  "#f44336",
  "#ff9800",
  "#ffeb3b",
  "#4caf50",
  "#009688",
  "#00bcd4",
  "#9e9e9e",
  "#673ab7",
  "#03a9f4",
  "#8bc34a",
  "#cddc39",
  "#ffc107",
  "#ff5722",
  "#795548",
  "#607d8b",
  "#cddc39",
  "#9c27b0",
];

export const CONDITIONAL_SOURCES = [
  "bpmn:EventBasedGateway",
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
  "bpmn:Participant",
];
export const TASK_LISTENER_EVENT_TYPE_OPTION = [
  { name: translate("create"), value: "create", label: translate("create") },
  {
    name: translate("assignment"),
    value: "assignment",
    label: translate("assignment"),
  },
  {
    name: translate("complete"),
    value: "complete",
    label: translate("complete"),
  },
  { name: translate("delete"), value: "delete", label: translate("delete") },
  { name: translate("update"), value: "update", label: translate("update") },
  { name: translate("timeout"), value: "timeout", label: translate("timeout") },
];

export const ICON_TYPE = {
  SUCCESS: "sucess",
  WARNING: "warning",
  ERROR: "error",
};

export const PALETTE_WIDTHS = {
  EXPANDED: 96,
  COLLAPSED: 48,
  THRESHOLD: 180,
};
