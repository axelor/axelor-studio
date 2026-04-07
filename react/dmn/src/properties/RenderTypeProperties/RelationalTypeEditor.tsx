import React from "react";
import { parseString } from "dmn-js-decision-table/lib/features/simple-string-edit/Utils.js";
import { Select } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";

import { STRING_OPTIONS } from "../../constants";
import styles from "../render-type.module.css";

import type { RelationalTypeEditorProps } from "./types";

const DISJUNCTION = "disjunction";
const NEGATION = "negation";

export default function RelationalTypeEditor({
  updateDRDCell,
  ruleValue,
  rule,
  defaultType,
  setValueType,
  isOutput,
  fetchData,
  metaFieldName,
  nameField,
  metaField,
}: RelationalTypeEditorProps) {
  const { targetName } = metaField || {};
  const input = parseString(ruleValue?.text as string);
  const { values: value } = input || {};

  const updateSelectValue = (selectValue: unknown[]) => {
    const values: string[] = [];
    let isNameField: unknown;
    (selectValue || []).forEach((val) => {
      if (typeof val !== "string") {
        const targetFields = metaFieldName || nameField || targetName || "name" || "id";
        isNameField = Array.isArray(val)
          ? val.find((v: Record<string, unknown>) => v && v[targetFields])
          : val && (val as Record<string, unknown>)[targetFields];
        values.push(`"${isNameField}"`);
        return;
      }
      values.push(val);
    });
    const str = values.toString();
    if ((defaultType)?.id === NEGATION) {
      const updatedStr = str ? "not(".concat(str, ")") : "";
      updateDRDCell(ruleValue as Record<string, unknown>, rule, updatedStr);
    } else {
      updateDRDCell(ruleValue as Record<string, unknown>, rule, str);
    }
  };

  return (
    <React.Fragment>
      {!isOutput && (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Edit string")}
          </InputLabel>
          <Select
            name="relType"
            update={(selectVal: Record<string, unknown> | null) => {
              setValueType("defaultTypeValue", selectVal);
              const parsedInput = parseString(ruleValue?.text as string);
              const { values = [] } = parsedInput || {};
              const str = (values as string[]).join(",");
              if (selectVal?.id === DISJUNCTION) {
                updateDRDCell(ruleValue as Record<string, unknown>, rule, str);
              } else {
                const updatedStr = str ? "not(".concat(str, ")") : "";
                updateDRDCell(ruleValue as Record<string, unknown>, rule, updatedStr);
              }
            }}
            value={defaultType || { name: "Match one", id: "disjunction" }}
            options={STRING_OPTIONS}
            isLabel={false}
            disableClearable
            optionLabel={"name"}
          />
        </React.Fragment>
      )}
      <InputLabel color="body" className={styles.label}>
        {translate("Select value")}
      </InputLabel>
      <Select
        className={styles.select}
        multiple={true}
        fetchMethod={() => fetchData()}
        update={(selectVal: unknown[]) => {
          updateSelectValue(selectVal);
        }}
        name="value"
        value={(value as string[]) || []}
        isLabel={false}
        optionLabel={metaFieldName || nameField || targetName || "name"}
        optionLabelSecondary="title"
        handleRemove={(option: unknown) => {
          updateSelectValue(
            ((value as string[]) || []).filter((r: unknown) => r !== option),
          );
        }}
      />
    </React.Fragment>
  );
}
