// Re-export promoted components from @studio/shared/properties
export {
  Textbox,
  TextField,
  SelectBox,
  Checkbox,
  Table,
  FieldEditor,
} from "@studio/shared/properties";

// Re-export entry types for Modeler properties consumers
export type { TextFieldEntry, TextboxEntry, SelectBoxEntry } from "@studio/shared/properties";

// DatePicker removed: was only used by DMN code (now in react/dmn/).
// Available via @studio/shared/properties/DatePicker.tsx if ever needed.

// BPM-local components (not promoted -- depend on BPM internals)
import CustomSelectBox from "./CustomSelectBox";
import ExtensionElementTable from "./ExtensionElementTable";
import ColorPicker from "./ColorPicker";

export { CustomSelectBox, ExtensionElementTable, ColorPicker };
