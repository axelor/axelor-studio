import React from "react";
import type { TypedBpmnModeler, ModdleElement } from "@studio/shared/types";

import {
  Textbox,
  TextField,
  SelectBox,
  Checkbox,
  ColorPicker,
} from "../../components/properties/components";
import type { TextFieldEntry, TextboxEntry, SelectBoxEntry } from "../../components/properties/components";

interface RenderComponentProps {
  entry: Record<string, unknown>;
  selectedElement: unknown;
  changeColor: (color: string) => void;
  bpmnModeler: TypedBpmnModeler | null;
  readOnly?: boolean;
}

export default function RenderComponent({
  entry,
  selectedElement,
  changeColor,
  bpmnModeler,
  readOnly,
}: RenderComponentProps) {
  if (!entry || !entry.widget) return null;
  const element = selectedElement as ModdleElement;
  switch (entry.widget) {
    case "textField":
      return (
        <TextField entry={entry as unknown as TextFieldEntry} element={element} readOnly={readOnly} canRemove={true} /> // safety: bpmn-js entry shapes vary per widget type
      );
    case "textBox":
      return <Textbox entry={entry as unknown as TextboxEntry} bpmnModeler={bpmnModeler} element={element} />; // safety: bpmn-js entry shapes vary per widget type
    case "selectBox":
      return <SelectBox entry={entry as unknown as SelectBoxEntry} element={element} />; // safety: bpmn-js entry shapes vary per widget type
    case "checkbox":
      return <Checkbox entry={entry} element={element} />;
    case "colorPicker":
      return <ColorPicker changeColor={changeColor} entry={entry} element={element} />;
    default:
      return <Textbox entry={entry as unknown as TextboxEntry} element={element} bpmnModeler={bpmnModeler} />; // safety: bpmn-js entry shapes vary per widget type
  }
}
