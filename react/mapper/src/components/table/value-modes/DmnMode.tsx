import React from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Selection } from "../../form";
import type { BuilderField } from "../../../utils";

const getValue = (row: BuilderField, key: string): unknown => {
  return (row as Record<string, unknown>)[key];
};

const getSelfValue = (row: BuilderField): { name: unknown } => {
  const { selected } = row.value || {};
  if (selected && typeof selected.value === "object") {
    return selected.value as { name: unknown };
  }
  return { name: selected && selected.value };
};

interface DmnModeProps {
  row: BuilderField;
  multiSelectProps: Record<string, unknown>;
  isRequiredField: boolean | undefined;
  getOnChange: (field: string, transform?: (e: unknown) => unknown) => (e: unknown) => void;
  getDMNValues?: () => Promise<Record<string, unknown>[]>;
}

export default function DmnMode({
  row,
  multiSelectProps,
  isRequiredField,
  getOnChange,
  getDMNValues,
}: DmnModeProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      <Selection
        optionValueKey="resultVariable"
        optionLabelKey="name"
        concatValue={true}
        error={isRequiredField}
        isProcessContext={true}
        fetchAPI={() => getDMNValues!()}
        value={getValue(row, "dmn") as Record<string, unknown>}
        onChange={getOnChange("dmn")}
      />
      {!!getValue(row, "dmn") && (
        <React.Fragment>
          <MaterialIcon icon="arrow_forward" fontSize={20} />
          <Selection
            {...multiSelectProps}
            isProcessContext={true}
            options={
              (getValue(row, "dmn") &&
                (getValue(row, "dmn") as Record<string, unknown>).outputDmnFieldList) as
                | unknown[]
                | undefined
            }
            value={
              (getSelfValue(row)?.name && (getSelfValue(row).name as string).split(".")[1]) ||
              (getSelfValue(row)?.name as string) ||
              ""
            }
            onChange={getOnChange("selected")}
          />
        </React.Fragment>
      )}
    </div>
  );
}
