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
        />
      );
    case "textBox":
      return (
        <Textbox
          entry={entry}
          bpmnModeler={bpmnModeler}
          element={selectedElement}
        />
      );
    case "selectBox":
      return <SelectBox entry={entry} element={selectedElement} />;
    case "checkbox":
      return <Checkbox entry={entry} element={selectedElement} />;
    case "colorPicker":
      return (
        <ColorPicker
          changeColor={changeColor}
          entry={entry}
          element={selectedElement}
        />
      );
    default:
      return (
        <Textbox
          entry={entry}
          element={selectedElement}
          bpmnModeler={bpmnModeler}
        />
      );
  }
}
