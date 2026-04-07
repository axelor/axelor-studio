const types = [
  "bpmn:Process",
  "bpmn:Collaboration",
  "bpmn:SequenceFlow",
  "bpmn:MessageFlow",
  "bpmn:DataOutputAssociation",
];

export default function ColorProps(group: any, element: any, translate: any, _bpmnModeler?: any) {
  if (!element || types.includes(element.type)) return;
  group.entries.push({
    id: "color",
    label: translate("Color"),
    widget: "colorPicker",
  });
}
