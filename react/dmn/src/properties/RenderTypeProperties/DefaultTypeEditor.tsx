import React from "react";
import { parseString } from "dmn-js-decision-table/lib/features/simple-string-edit/Utils.js";
import { Select } from "@studio/shared/components";
import { TextField, Description } from "@studio/shared/properties";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";
import { STRING_OPTIONS } from "../../constants";
import styles from "../render-type.module.css";


import type { DefaultTypeEditorProps } from "./types";

const DISJUNCTION = "disjunction";

export default function DefaultTypeEditor({
  element,
  updateDRDCell,
  ruleValue,
  rule,
  defaultType,
  setValueType,
  value: stringValue,
  isOutput,
}: DefaultTypeEditorProps) {
  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Edit string")}
      </InputLabel>
      {!isOutput && (
        <Select
          name="defaultType"
          update={(value: Record<string, unknown> | null) => {
            const parsedInput = parseString((ruleValue as Record<string, unknown>)?.text as string);
            const { values = [] } = parsedInput || {};
            if (value && value.id === DISJUNCTION) {
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                (values as string[]).join(","),
              );
            } else {
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                "not(".concat((values as string[]).join(","), ")"),
              );
            }
          }}
          value={defaultType}
          options={STRING_OPTIONS}
          isLabel={false}
          optionLabel={"name"}
        />
      )}
      <TextField
        element={element}
        entry={{
          id: "value",
          label: translate("Value"),
          modelProperty: "value",
          get: function () {
            return {
              value: stringValue,
            };
          },
          set: function (_e: unknown, values: Record<string, unknown>) {
            let value = values["value"] as string | undefined;
            value = value ? value.replace(/['"]+/g, "") : value;
            const val = value ? value.replace(/['"]+/g, "").split(",") : [];
            let isMulti = false;
            if (val.length > 1) {
              value = val.map((v) => `"${v}"`).join(",");
              isMulti = true;
            }
            const currentVal =
              value && !/^"[^"]*"$/.test(`${value.trim()}`) && !isMulti ? `"${value}"` : value;
            (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
            updateDRDCell(ruleValue as Record<string, unknown>, rule, currentVal);
            setValueType("setValue", currentVal);
          },
        }}
        canRemove={true}
      />
      <Description desciption="Strings must be in double quotes. Add multiple strings with comma." />
    </React.Fragment>
  );
}
