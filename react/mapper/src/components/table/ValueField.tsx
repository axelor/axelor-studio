import React from "react";
import { Input } from "@axelor/ui";

import { MultiSelect } from "../form";
import { VALUE_FROM } from "../../utils";
import type {
  BuilderField,
  BuilderFieldValue,
  MetaField,
  ModelRecord,
  ValueMode,
} from "../../utils";

import { getRequiredField } from "./RenderWidget";
import ProcessMode from "./value-modes/ProcessMode";
import DmnMode from "./value-modes/DmnMode";
import ParentMode from "./value-modes/ParentMode";
import QueryMode from "./value-modes/QueryMode";
import NoneMode from "./value-modes/NoneMode";

interface ModeComponentProps {
  row: BuilderField;
  classes: Record<string, string>;
  parentRow?: BuilderField;
  defaultFrom: ValueMode;
  metaFields: MetaField[];
  selected: BuilderFieldValue["selected"];
  multiSelectProps: Record<string, unknown>;
  isRequiredField: boolean | undefined;
  getOnChange: (field: string, transform?: (e: unknown) => unknown) => (e: unknown) => void;
  getProcesses?: () => Record<string, unknown>[];
  getProcessElement?: (processId: Record<string, unknown>) => Record<string, unknown>;
  getDMNValues?: () => Promise<Record<string, unknown>[]>;
}

const MODE_COMPONENTS: Partial<Record<ValueMode, React.ComponentType<ModeComponentProps>>> = {
  [VALUE_FROM.PROCESS]: ProcessMode as React.ComponentType<ModeComponentProps>,
  [VALUE_FROM.DMN]: DmnMode as React.ComponentType<ModeComponentProps>,
  [VALUE_FROM.PARENT]: ParentMode as React.ComponentType<ModeComponentProps>,
  [VALUE_FROM.QUERY]: QueryMode as React.ComponentType<ModeComponentProps>,
  [VALUE_FROM.NONE]: NoneMode as React.ComponentType<ModeComponentProps>,
};

interface ValueFieldProps {
  classes: Record<string, string>;
  values: BuilderFieldValue;
  row: BuilderField;
  isBPMN?: boolean;
  parentRow?: BuilderField;
  builderFields: BuilderField[];
  metaFields: MetaField[];
  targetModel: ModelRecord | null;
  sourceModel: ModelRecord | null;
  getOnChange: (field: string, transform?: (e: unknown) => unknown) => (e: unknown) => void;
  getProcesses?: () => Record<string, unknown>[];
  getProcessElement?: (processId: Record<string, unknown>) => Record<string, unknown>;
  getDMNValues?: () => Promise<Record<string, unknown>[]>;
}

export default function ValueField(props: ValueFieldProps) {
  const {
    classes,
    values,
    row,
    isBPMN,
    metaFields,
    builderFields,
    parentRow,
    targetModel,
    sourceModel,
    getOnChange,
    getProcesses,
    getProcessElement,
    getDMNValues,
  } = props;
  const { from, selected, subFields = [] } = values;
  const defaultFrom: ValueMode = sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE;
  const isRequiredField = getRequiredField(builderFields, row);
  const multiSelectProps = {
    optionValueKey: "name",
    optionLabelKey: "title",
    concatValue: true,
    value: subFields,
    onChange: getOnChange("subFields"),
    error: isRequiredField,
    type: row?.type,
    isBPMN,
  };

  // Inline trivial modes (SELF, SOURCE, CONTEXT, EXPRESSION)
  switch (from) {
    case VALUE_FROM.SELF:
      return <MultiSelect {...multiSelectProps} parentRow={parentRow} targetModel={targetModel} />;
    case VALUE_FROM.SOURCE:
      return <MultiSelect {...multiSelectProps} sourceModel={sourceModel} />;
    case VALUE_FROM.CONTEXT:
      return <MultiSelect {...multiSelectProps} isContext={true} />;
    case VALUE_FROM.EXPRESSION:
      return (
        <Input
          as="textarea"
          rows={1}
          value={(selected?.value as string) || ""}
          onChange={getOnChange("selected", (e) => ({
            value: (e as React.ChangeEvent<HTMLTextAreaElement>).target.value,
          }))}
          error={isRequiredField}
        />
      );
    default:
      break;
  }

  // Strategy Pattern: delegate to extracted mode components
  const ModeComponent = MODE_COMPONENTS[from as ValueMode];
  if (!ModeComponent) return null;
  return (
    <ModeComponent
      row={row}
      classes={classes}
      parentRow={parentRow}
      defaultFrom={defaultFrom}
      metaFields={metaFields}
      selected={selected}
      multiSelectProps={multiSelectProps}
      isRequiredField={isRequiredField}
      getOnChange={getOnChange}
      getProcesses={getProcesses}
      getProcessElement={getProcessElement}
      getDMNValues={getDMNValues}
    />
  );
}
