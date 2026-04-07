/**
 * Fill and stroke color maps for BPMN viewer element types.
 * Extracted from BpmnViewer.jsx to reduce file size and allow reuse.
 */

export const FILL_COLORS: Record<string, string> = {
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
  "bpmn:SequenceFlow": "#8095B3",
  "bpmn:StartEvent": "#ccecc6",
  "bpmn:EndEvent": "#ffd4c7",
  "bpmn:Gateway": "#fdecb3",
  "bpmn:IntermediateThrowEvent": "#ffe0b3",
  "bpmn:IntermediateCatchEvent": "#ffe0b3",
};

export const STROKE_COLORS: Record<string, string> = {
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
  "bpmn:TextAnnotation": "#A9B1BD",
};
