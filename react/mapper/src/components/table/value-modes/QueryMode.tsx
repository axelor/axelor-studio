import React from "react";

import ExpressionField from "../ExpressionField";
import type { BuilderField, BuilderFieldValue } from "../../../utils";

const parameters = {
  type: "bpmQuery",
  withParam: true,
  isParameterShow: false,
};

interface QueryModeProps {
  row: BuilderField;
  selected: BuilderFieldValue["selected"];
  isRequiredField: boolean | undefined;
  getOnChange: (field: string, transform?: (e: unknown) => unknown) => (e: unknown) => void;
}

export default function QueryMode({ row, selected, isRequiredField, getOnChange }: QueryModeProps) {
  const currentTarget = row?.jsonTarget || row?.targetModel || row?.target;
  return (
    <ExpressionField
      parameters={parameters}
      target={!selected?.value ? currentTarget : undefined}
      error={!!isRequiredField}
      selected={(selected?.value as string) || ""}
      onSelectedChange={getOnChange("selected")}
      expression={row.value?.query}
      onExpressionChange={getOnChange("query")}
    />
  );
}
