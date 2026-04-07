import React from "react";

import { RenderWidget } from "../RenderWidget";
import { isRelationalField } from "../ModelField";
import { getType } from "../../../DataTable.utils";
import type { BuilderField } from "../../../utils";

const getExpressionValue = (row: BuilderField): unknown => {
  const { selected } = row.value || {};
  if (!selected) {
    return undefined;
  }
  if (isRelationalField(row)) {
    return { [selected.targetName as string]: selected.value };
  }
  return selected.value;
};

interface NoneModeProps {
  row: BuilderField;
  classes: Record<string, string>;
  isRequiredField: boolean | undefined;
  getOnChange: (field: string, transform?: (e: unknown) => unknown) => (e: unknown) => void;
}

export default function NoneMode({ row, classes, isRequiredField, getOnChange }: NoneModeProps) {
  return (
    <RenderWidget
      row={row}
      type={getType(row)}
      error={!!isRequiredField}
      onChange={getOnChange("selected", (e) => e as Record<string, unknown>)}
      value={{
        fieldValue: getExpressionValue(row),
        fieldValue2: "",
      }}
      classes={classes}
      field={(row.subFieldName || row) as Record<string, unknown>}
    />
  );
}
