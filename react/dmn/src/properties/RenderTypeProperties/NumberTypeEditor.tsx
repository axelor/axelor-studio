import React from "react";
import {
  getComparisonString,
  getRangeString,
} from "dmn-js-decision-table/lib/features/simple-number-edit/Utils";
import { NumberInput, Select  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";

import { RANGE_OPTIONS, COMPARISON_OPTIONS, NUMBER_OPTIONS } from "../../constants";
import styles from "../render-type.module.css";

import type { NumberTypeEditorProps } from "./types";

export default function NumberTypeEditor({
  type,
  updateDRDCell,
  ruleValue,
  rule,
  defaultType,
  comparisonOperator,
  rangeStartValue,
  rangeEndValue,
  rangeEndType,
  rangeStartType,
  setValueType,
  isOutput,
  numberValue,
}: NumberTypeEditorProps) {
  if (isOutput) {
    return (
      <React.Fragment>
        <InputLabel color="body" className={styles.label}>
          {translate("Value")}
        </InputLabel>
        <NumberInput
          value={Number(numberValue)}
          type={type}
          scale={99}
          disableUnderline={true}
          onChange={(value: number | string) => {
            updateDRDCell(ruleValue as Record<string, unknown>, rule, "".concat(String(value)));
          }}
        />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Edit number")}
      </InputLabel>
      <Select
        name="numberType"
        update={(value: Record<string, unknown> | null) => {
          setValueType("defaultTypeValue", value);
          if (!value) return;
          if (value.id === "range") {
            updateDRDCell(
              ruleValue as Record<string, unknown>,
              rule,
              getRangeString(rangeStartValue, rangeEndValue, rangeStartType?.id, rangeEndType?.id),
            );
          } else {
            updateDRDCell(
              ruleValue as Record<string, unknown>,
              rule,
              getComparisonString(comparisonOperator?.id || "equals", numberValue || 0),
            );
          }
        }}
        value={
          defaultType || {
            name: translate("Comparison"),
            id: "comparison",
          }
        }
        options={NUMBER_OPTIONS}
        isLabel={false}
        disableClearable
        optionLabel={"name"}
      />
      {(defaultType)?.id === "range" ? (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Start value")}
          </InputLabel>
          <Select
            name="rangeStartType"
            update={(value: Record<string, unknown> | null) => {
              setValueType("rangeStartType", value);
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                getRangeString(
                  rangeStartValue,
                  rangeEndValue,
                  (value?.id as string) ?? undefined,
                  rangeEndType?.id,
                ),
              );
            }}
            value={rangeStartType}
            options={RANGE_OPTIONS}
            isLabel={false}
            disableClearable
            optionLabel={"name"}
          />
          <InputLabel color="body" className={styles.label}>
            {translate("Value")}
          </InputLabel>
          <NumberInput
            value={Number(rangeStartValue)}
            type={type}
            scale={99}
            disableUnderline={true}
            onChange={(value: number | string) => {
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                getRangeString(value, rangeEndValue, rangeStartType?.id, rangeEndType?.id),
              );
            }}
          />
          <InputLabel color="body" className={styles.label}>
            {translate("End value")}
          </InputLabel>
          <Select
            name="rangeEndType"
            update={(value: Record<string, unknown> | null) => {
              setValueType("rangeEndType", value);
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                getRangeString(
                  rangeStartValue,
                  rangeEndValue,
                  rangeStartType?.id,
                  (value?.id as string) ?? undefined,
                ),
              );
            }}
            value={rangeEndType}
            options={RANGE_OPTIONS}
            isLabel={false}
            disableClearable
            optionLabel={"name"}
          />
          <InputLabel color="body" className={styles.label}>
            {translate("Value")}
          </InputLabel>
          <NumberInput
            value={Number(rangeEndValue)}
            type={type}
            disableUnderline={true}
            onChange={(value: number | string) => {
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                getRangeString(rangeStartValue, value, rangeStartType?.id, rangeEndType?.id),
              );
            }}
          />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Select
            name="comparisonOperator"
            update={(value: Record<string, unknown> | null) => {
              setValueType(
                "comparisonOperator",
                value || { name: translate("Equals"), id: "equals" },
              );
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                getComparisonString((value?.id as string) || "equals", numberValue || 0),
              );
            }}
            value={
              comparisonOperator || {
                name: translate("Equals"),
                id: "equals",
              }
            }
            options={COMPARISON_OPTIONS}
            isLabel={false}
            disableClearable
            optionLabel={"name"}
          />
          <InputLabel color="body" className={styles.label}>
            {translate("Value")}
          </InputLabel>
          <NumberInput
            value={Number(numberValue)}
            type={type}
            disableUnderline={true}
            scale={99}
            onChange={(value: number | string) => {
              updateDRDCell(
                ruleValue as Record<string, unknown>,
                rule,
                getComparisonString(comparisonOperator?.id || "equals", value),
              );
              setValueType("numberValue", value);
            }}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
