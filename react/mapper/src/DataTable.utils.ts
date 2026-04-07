import get from "lodash/get";

import { translate, VALUE_FROM } from "./utils";
import type { BuilderField, ModelRecord, ValueMode } from "./utils";

interface ValueOption {
  title: string;
  id: string;
}

export const getOptions = (
  parentRow: BuilderField | undefined,
  defaultFrom: ValueMode,
  isBPMN: boolean | undefined,
  isDMNAllow: boolean = false,
  row: BuilderField,
): ValueOption[] => {
  const options: ValueOption[] = [
    { title: translate("Self"), id: VALUE_FROM.SELF },
    { title: translate("Context"), id: VALUE_FROM.CONTEXT },
    { title: translate("Value"), id: VALUE_FROM.NONE },
    { title: translate("Expression"), id: VALUE_FROM.EXPRESSION },
    { title: translate("Source"), id: VALUE_FROM.SOURCE },
  ];
  const from = get(parentRow, "value.from", defaultFrom) as string;
  if (
    parentRow &&
    ([VALUE_FROM.CONTEXT, VALUE_FROM.SELF, VALUE_FROM.SOURCE] as string[]).includes(from)
  ) {
    options.push({ title: translate("Parent"), id: VALUE_FROM.PARENT });
  }
  if (isBPMN) {
    options.push({ title: translate("Process"), id: VALUE_FROM.PROCESS });
  }
  if (isDMNAllow) {
    options.push({ title: translate("DMN"), id: VALUE_FROM.DMN });
  }
  if (["one_to_one", "many_to_one", "json_many_to_one"].includes(getType(row))) {
    options.push({ title: translate("Query"), id: VALUE_FROM.QUERY });
  }
  return options;
};

export const getType = (row: BuilderField): string => {
  const { type } = row;
  return type.replace(/-/g, "_").toLowerCase();
};

export const getOptionDisabled = (
  option: ValueOption,
  parentRow: BuilderField | undefined,
  sourceModel: ModelRecord | null,
): boolean => {
  if (option.id === VALUE_FROM.PARENT) {
    return !parentRow?.value?.selected;
  }
  if (option.id === VALUE_FROM.SOURCE && !sourceModel) {
    return true;
  }
  return false;
};

export const getTargetName = (
  row: BuilderField,
  value: Record<string, unknown>,
  nameField: string | undefined,
): string => {
  let targetName: string | undefined;
  if (value && value[row.targetName as string]) {
    targetName = row.targetName as string;
  }
  if (!targetName && nameField && value && value[nameField]) {
    targetName = nameField;
  }
  if (!targetName) {
    const nameValue = value ? value["name"] : null;
    if (nameValue) {
      targetName = "name";
    } else {
      targetName = "_selectId";
    }
  }
  return targetName;
};
