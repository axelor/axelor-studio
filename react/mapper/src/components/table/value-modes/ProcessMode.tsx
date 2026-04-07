import React from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Selection, MultiSelect } from "../../form";
import type { BuilderField } from "../../../utils";

const getValue = (row: BuilderField, key: string): unknown => {
  return (row as Record<string, unknown>)[key];
};

interface ProcessModeProps {
  row: BuilderField;
  multiSelectProps: Record<string, unknown>;
  getOnChange: (field: string, transform?: (e: unknown) => unknown) => (e: unknown) => void;
  getProcesses?: () => Record<string, unknown>[];
  getProcessElement?: (processId: Record<string, unknown>) => Record<string, unknown>;
}

export default function ProcessMode({
  row,
  multiSelectProps,
  getOnChange,
  getProcesses,
  getProcessElement,
}: ProcessModeProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Selection
        {...multiSelectProps}
        options={getProcesses && getProcesses()}
        isProcessContext={true}
        value={getValue(row, "processId") as Record<string, unknown>}
        onChange={getOnChange("processId")}
      />
      {!!getValue(row, "processId") && (
        <React.Fragment>
          <MaterialIcon icon="arrow_forward" fontSize={20} />
          <MultiSelect
            {...multiSelectProps}
            isProcessContext={true}
            element={getProcessElement!(getValue(row, "processId") as Record<string, unknown>)}
            onChange={multiSelectProps.onChange as (value: unknown) => void}
          />
        </React.Fragment>
      )}
    </div>
  );
}
