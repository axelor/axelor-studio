import React from "react";

import {
  Textbox,
  TextField,
  SelectBox,
  Checkbox,
  ColorPicker,
} from "../../components/properties/components";

export default function RenderComponent({
  entry,
  selectedElement,
  changeColor,
  bpmnModeler,
  readOnly,
  setDummyProperty,
}) {
  if (!entry && entry.widget) return;
  switch (entry.widget) {
    case "textField":
      return (
        <TextField
          entry={entry}
          element={selectedElement}
          readOnly={readOnly}
          canRemove={true}
          setDummyProperty={setDummyProperty}
        />
      );
    case "textBox":
      return (
        <Textbox
          entry={entry}
          bpmnModeler={bpmnModeler}
          element={selectedElement}
          setDummyProperty={setDummyProperty}
        />
      );
    case "selectBox":
      return (
        <SelectBox
          entry={entry}
          element={selectedElement}
          setDummyProperty={setDummyProperty}
        />
      );
    case "checkbox":
      return (
        <Checkbox
          entry={entry}
          element={selectedElement}
          setDummyProperty={setDummyProperty}
        />
      );
    case "colorPicker":
      return (
        <ColorPicker
          changeColor={changeColor}
          entry={entry}
          element={selectedElement}
          setDummyProperty={setDummyProperty}
        />
      );
    default:
      return (
        <Textbox
          entry={entry}
          element={selectedElement}
          bpmnModeler={bpmnModeler}
          setDummyProperty={setDummyProperty}
        />
      );
  }
}
