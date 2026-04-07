import React from "react";
import get from "lodash/get";
import { fetchFields } from "@studio/shared/services";

import { Selection } from "../../form";
import { VALUE_FROM } from "../../../utils";
import type { BuilderField, MetaField, ValueMode } from "../../../utils";

const getSelfValue = (row: BuilderField): { name: unknown; target?: string } => {
  const { selected } = row.value || {};
  if (selected && typeof selected.value === "object") {
    return selected.value as { name: unknown; target?: string };
  }
  return { name: selected && selected.value };
};

const getParentValueTarget = (
  row: BuilderField | undefined,
  defaultFrom: ValueMode,
): { fullName?: string } => {
  if (!row) return {};
  const { contextModel } = row;
  const from = get(row, "value.from", defaultFrom) as string;
  if (contextModel && from === "context") {
    return { fullName: contextModel.target };
  }
  if (([VALUE_FROM.SELF, VALUE_FROM.SOURCE, VALUE_FROM.PARENT] as string[]).includes(from)) {
    const record = getSelfValue(row);
    return { fullName: record.target };
  }
  return {};
};

interface ParentModeProps {
  row: BuilderField;
  parentRow?: BuilderField;
  defaultFrom: ValueMode;
  metaFields: MetaField[];
  multiSelectProps: Record<string, unknown>;
  getOnChange: (field: string, transform?: (e: unknown) => unknown) => (e: unknown) => void;
}

export default function ParentMode({
  row,
  parentRow,
  defaultFrom,
  metaFields,
  multiSelectProps,
  getOnChange,
}: ParentModeProps) {
  return (
    <Selection
      {...multiSelectProps}
      options={metaFields}
      fetchAPI={() => fetchFields(getParentValueTarget(parentRow, defaultFrom))}
      value={getSelfValue(row)}
      onChange={getOnChange("selected")}
    />
  );
}
