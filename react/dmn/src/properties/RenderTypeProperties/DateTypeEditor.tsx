import React from "react";
import {
  parseString as parseDate,
  getDateString,
} from "dmn-js-decision-table/lib/features/simple-date-edit/Utils";
import dayjs from "dayjs";
import { DateTimePicker, Select  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";

import { DATE_OPTIONS } from "../../constants";
import styles from "../render-type.module.css";

import type { DateTypeEditorProps } from "./types";

const dateFormat = (date: unknown, type: string): string | undefined => {
  if (!date) return;
  if (type === "date") {
    return dayjs(dayjs(date as string).format("YYYY-MM-DD")).format("YYYY-MM-DDTHH:mm:ss");
  }
  return dayjs(date as string).format("YYYY-MM-DDTHH:mm:ss");
};

export default function DateTypeEditor({
  type,
  updateDRDCell,
  ruleValue,
  rule,
  defaultType,
  setValueType,
  isOutput,
  dates,
}: DateTypeEditorProps) {
  if (isOutput) {
    return (
      <DateTimePicker
        type={type}
        disableUnderline={true}
        className={styles.input}
        value={dates && dates[0] ? dayjs(dates[0]) : null}
        onChange={(value: unknown) => {
          if (value) {
            updateDRDCell(
              ruleValue as Record<string, unknown>,
              rule,
              getDateString("exact", [dateFormat(value, type)]),
            );
          } else {
            updateDRDCell(ruleValue as Record<string, unknown>, rule, "");
          }
        }}
      />
    );
  }

  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Edit")}
      </InputLabel>
      <Select
        name="dateType"
        update={(value: Record<string, unknown> | null) => {
          setValueType("defaultTypeValue", value);
          const newDates =
            value && value.id === "between"
              ? [dates?.[0], dateFormat(dayjs(dates?.[0] as string).add(1, "days"), type)]
              : dates;
          if (value && parseDate(getDateString(value.id as string, newDates as (string | undefined)[]))) {
            updateDRDCell(
              ruleValue as Record<string, unknown>,
              rule,
              getDateString(value.id as string, newDates as (string | undefined)[]),
            );
          }
        }}
        value={defaultType}
        options={DATE_OPTIONS}
        isLabel={false}
        disableClearable
        optionLabel={"name"}
      />
      {defaultType && (defaultType).id === "between" ? (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Value")}
          </InputLabel>
          <DateTimePicker
            disableUnderline={true}
            className={styles.input}
            type={type}
            value={dates && dates[0] ? dayjs(dates[0]) : null}
            onChange={(value: unknown) => {
              if (value && defaultType) {
                updateDRDCell(
                  ruleValue as Record<string, unknown>,
                  rule,
                  getDateString((defaultType).id as string, [
                    dateFormat(value, type),
                    dateFormat(
                      (dates && dates[1]) || dayjs(value as string).add(1, "days"),
                      type,
                    ),
                  ]),
                );
              } else {
                updateDRDCell(ruleValue as Record<string, unknown>, rule, "");
              }
            }}
          />
          <DateTimePicker
            disableUnderline={true}
            className={styles.input}
            type={type}
            value={dates && dates[1] ? dayjs(dates[1]) : null}
            onChange={(value: unknown) => {
              if (value && defaultType) {
                updateDRDCell(
                  ruleValue as Record<string, unknown>,
                  rule,
                  getDateString((defaultType).id as string, [
                    (dates && dates[0]) || undefined,
                    dateFormat(value, type),
                  ]),
                );
              } else {
                updateDRDCell(ruleValue as Record<string, unknown>, rule, "");
              }
            }}
          />
        </React.Fragment>
      ) : (
        defaultType && (
          <React.Fragment>
            <InputLabel color="body" className={styles.label}>
              {translate("Value")}
            </InputLabel>
            <DateTimePicker
              disableUnderline={true}
              className={styles.input}
              type={type}
              value={dates && dates[0] ? dayjs(dates[0]) : null}
              onChange={(value: unknown) => {
                if (value && defaultType) {
                  updateDRDCell(
                    ruleValue as Record<string, unknown>,
                    rule,
                    getDateString((defaultType).id as string, [
                      dateFormat(value, type),
                    ]),
                  );
                } else {
                  updateDRDCell(ruleValue as Record<string, unknown>, rule, "");
                }
              }}
            />
          </React.Fragment>
        )
      )}
    </React.Fragment>
  );
}
