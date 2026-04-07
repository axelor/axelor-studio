export { default as TextField } from "./TextField";
export type { TextFieldEntry } from "./TextField";
export { default as Textbox } from "./Textbox";
export type { TextboxEntry } from "./Textbox";
export { default as Checkbox } from "./Checkbox";
export { default as SelectBox } from "./SelectBox";
export type { SelectBoxEntry } from "./SelectBox";
export { default as Table } from "./Table";
export { default as FieldEditor } from "./FieldEditor";
// Re-export Description from parent components (already in shared)
export { Description } from "../Description";

// NOTE: DatePicker is NOT re-exported from the barrel because it depends on
// moment and dmn-js-decision-table (DMN-specific peer dependencies).
// Import directly: import DatePicker from '@studio/shared/properties/DatePicker.tsx';
