import React from "react";
import { Select } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";

import styles from "../render-type.module.css";

import type { SelectionTypeEditorProps } from "./types";

interface SelectionItem {
  value: string;
  title?: string;
  [key: string]: unknown;
}

export default function SelectionTypeEditor({
  updateDRDCell,
  ruleValue,
  rule,
  setValueType,
  metaField,
  value: stringValue,
  metaFieldName,
  nameField,
}: SelectionTypeEditorProps) {
  const { targetName } = metaField || {};
  const selectionList = (metaField?.selectionList || []) as SelectionItem[];
  const metaType = metaField?.type || "";

  const updateValue = (value: SelectionItem[]) => {
    const text = value.reduce(
      (accumulator: string, item: SelectionItem) =>
        item.value
          ? metaType.toUpperCase() === "STRING"
            ? `${accumulator}${accumulator ? "," : ""}"${item.value}"`
            : `${accumulator}${accumulator ? "," : ""}${item.value}`
          : accumulator,
      "",
    );
    setValueType("setValue", text);
    updateDRDCell(ruleValue as Record<string, unknown>, rule, text);
  };

  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Select value")}
      </InputLabel>
      <Select
        className={styles.select}
        update={(value: SelectionItem[]) => {
          updateValue(value);
        }}
        multiple={true}
        options={selectionList}
        name="multiSelect"
        value={selectionList.filter((item: SelectionItem) =>
          (stringValue || "")
            .split(",")
            .map((v: string) => v.replace(/"/g, ""))
            .includes(item.value.toString()),
        )}
        optionLabel={metaFieldName || nameField || targetName || "name"}
        optionLabelSecondary="title"
        handleRemove={(option: SelectionItem) => {
          const value = selectionList
            .filter((item: SelectionItem) =>
              (stringValue || "")
                .split(",")
                .map((v: string) => v.replace(/"/g, ""))
                .includes(item.value.toString()),
            )
            .filter((r: SelectionItem) => r.title !== option.title);
          updateValue(value);
        }}
      />
    </React.Fragment>
  );
}
