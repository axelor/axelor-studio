import React from "react";
import { parseString } from "dmn-js-decision-table/lib/features/simple-string-edit/Utils.js";
import { Select } from "@studio/shared/components";
import { TextField, Description } from "@studio/shared/properties";
import { translate } from "@studio/shared/i18n";
import { getExpressionValues } from "@studio/shared/services";
import { InputLabel } from "@axelor/ui";
import { STRING_OPTIONS } from "../../constants";
import styles from "../render-type.module.css";


import type { StringTypeEditorProps } from "./types";

const DISJUNCTION = "disjunction";
const NEGATION = "negation";

export default function StringTypeEditor({
  element,
  updateDRDCell,
  ruleValue,
  rule,
  defaultType,
  setValueType,
  metaField,
  value: stringValue,
  isOutput,
  relationalField,
  valueFrom,
  nameCol,
}: StringTypeEditorProps) {
  const { fullName, name } = (relationalField || metaField || {}) as Record<string, string | undefined>;

  if (valueFrom === "model" && isOutput) {
    return (
      <React.Fragment>
        <InputLabel color="body" className={styles.label}>
          {translate("Select value")}
        </InputLabel>
        <Select
          name="stringModelValue"
          update={(val: Record<string, unknown> | null) => {
            let value: string | undefined =
              val?.id
                ? ((val[`${nameCol}`] || val["name"] || `${val["id"]}`) as string)
                : undefined;

            value = value ? value.replace(/['"]+/g, "") : undefined;
            const currentVal =
              value && !/^"[^"]*"$/.test(`${value.trim()}`) ? `"${value}"` : value;
            (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
            updateDRDCell(ruleValue as Record<string, unknown>, rule, currentVal);
            setValueType("setValue", currentVal);
          }}
          value={stringValue}
          fetchMethod={async () =>
            (await getExpressionValues(fullName || name || "", {
              fields: [`${nameCol}`],
            })) || []
          }
          isLabel={false}
          optionLabel={nameCol}
        />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Edit string")}
      </InputLabel>
      {!isOutput && (
        <Select
          name="stringType"
          update={(value: Record<string, unknown> | null) => {
            setValueType("defaultTypeValue", value);
            const parsedInput = parseString(ruleValue?.text as string);
            const { values = [] } = parsedInput || {};
            const str = values && (values as string[]).join(",");
            if (value?.id === DISJUNCTION) {
              updateDRDCell(ruleValue as Record<string, unknown>, rule, str);
            } else {
              const updatedStr = str ? "not(".concat(str, ")") : "";
              updateDRDCell(ruleValue as Record<string, unknown>, rule, updatedStr);
            }
          }}
          value={
            defaultType || {
              name: translate("Match one"),
              id: "disjunction",
            }
          }
          options={STRING_OPTIONS}
          isLabel={false}
          disableClearable
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
            const val = value ? value.split(",") : [];
            const isMulti = val.length > 1;

            if (isMulti) {
              if ((defaultType)?.id === NEGATION) {
                const string = val
                  .map((v, ind) => {
                    const updatedV =
                      ind === 0 ? v?.replace(/["not()"]/g, "") : v?.replace(/[")"]/g, "");
                    return `"${updatedV.replace(/"/g, "")}"`;
                  })
                  .join(",");
                value = "not(".concat(string, ")");
              } else {
                value = val.map((v) => `"${v.replace(/"/g, "")}"`).join(",");
              }
            }

            const negationValue = value?.replace(/["not()"]/g, "");

            const currentVal =
              value && !/^"[^"]*"$/.test(`${value?.trim()}`) && !isMulti
                ? (defaultType)?.id === NEGATION
                  ? "not(".concat(`"${negationValue}"`, ")")
                  : `"${value.replace(/"/g, "")}"`
                : value;
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
