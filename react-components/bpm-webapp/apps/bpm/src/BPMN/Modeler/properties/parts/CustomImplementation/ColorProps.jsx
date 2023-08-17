const types = [
  "bpmn:Process",
  "bpmn:Collaboration",
  "bpmn:SequenceFlow",
  "bpmn:MessageFlow",
  "bpmn:TextAnnotation",
  "bpmn:DataOutputAssociation",
];

export default function ColorProps(group, element, translate) {
  if (!element || types.includes(element.type)) return;
  group.entries.push({
    id: "color",
    label: translate("Color"),
    widget: "colorPicker",
  });
}
