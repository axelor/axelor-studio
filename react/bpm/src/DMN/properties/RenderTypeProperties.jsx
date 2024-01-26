import React, { useCallback, useEffect, useState } from "react";
import { parseString } from "dmn-js-decision-table/lib/features/simple-string-edit/Utils.js";
import { parseString as parseBoolean } from "dmn-js-decision-table/lib/features/simple-boolean-edit/Utils";
import {
  parseString as parseDate,
  getDateString,
} from "dmn-js-decision-table/lib/features/simple-date-edit/Utils";
import {
  parseString as parseNumber,
  getComparisonString,
  getRangeString,
} from "dmn-js-decision-table/lib/features/simple-number-edit/Utils";
import moment from "moment";

import DateTimePicker from "../../components/expression-builder/components/datetime-picker";
import NumberInput from "../../components/expression-builder/components/number";
import Select from "../../components/Select";
import { TextField, Description } from "../../components/properties/components";
import { translate } from "../../utils";
import { getCustomModelData, getNameField, getData } from "../services/api";
import { getExpressionValues } from "../../services/api";

import {
  STRING_OPTIONS,
  BOOLEAN_OPTIONS,
  RANGE_OPTIONS,
  COMPARISON_OPTIONS,
  NUMBER_OPTIONS,
  DATE_OPTIONS,
  RELATIONAL_TYPES,
} from "../constants";

import { InputLabel } from "@axelor/ui";
import styles from "./render-type.module.css";

const DISJUNCTION = "disjunction";
const NEGATION = "negation";

const dateFormat = (date, type) => {
  if (!date) return;
  if (type === "date") {
    return moment(moment(date).format("YYYY-MM-DD")).format(
      "YYYY-MM-DDTHH:mm:ss"
    );
  }
  return moment(date).format("YYYY-MM-DDTHH:mm:ss");
};

export default function RenderTypeProperties({
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
  metaField,
  element,
  value: stringValue,
  isOutput,
  relationalField,
  valueFrom,
  nameCol,
  numberValue,
}) {
  const { targetName, target, fullName, name, targetModel, model, jsonTarget } =
    relationalField || metaField || {};
  const [metaFieldName, setMetaFieldName] = useState(null);
  const [nameField, setNameField] = useState(null);
  const [dates, setDates] = useState(null);

  const fetchData = useCallback(async () => {
    let data;
    if (model === "com.axelor.meta.db.MetaJsonRecord" && jsonTarget) {
      data = await getCustomModelData(jsonTarget);
      const fieldData = await getNameField(jsonTarget);
      setNameField(fieldData?.name);
    } else {
      data = await getData(target || targetModel);
    }
    return data || [];
  }, [jsonTarget, model, target, targetModel]);

  useEffect(() => {
    if (type === "string" && !isOutput) {
      const parsedInput = parseString(ruleValue?.text);
      const { type: parsedType } = parsedInput || {};
      setValueType(
        "defaultTypeValue",
        STRING_OPTIONS.find((s) => s.id === parsedType)
      );
    } else if (type === "boolean") {
      const parsedType = parseBoolean(ruleValue?.text);
      setValueType(
        "defaultTypeValue",
        BOOLEAN_OPTIONS.find((s) => s.id === parsedType)
      );
    } else if (["date", "datetime", "time"].includes(type)) {
      const parsedInput = parseDate(ruleValue?.text);
      const {
        type: parsedType = "exact",
        date,
        dates: parsedDates,
      } = parsedInput || {};
      if (ruleValue?.text) {
        setValueType(
          "defaultTypeValue",
          DATE_OPTIONS.find((s) => s.id === parsedType)
        );
      }
      if (parsedType === "between") {
        setDates(parsedDates);
      } else if (date) {
        setDates([date, null]);
      } else {
        setDates([null, null]);
      }
    } else if (
      ["long", "integer", "double", "decimal"].includes(type) &&
      !isOutput
    ) {
      const parsedInput = parseNumber(ruleValue?.text);
      const {
        type: parsedType = defaultType,
        operator,
        start,
        end,
        value = 0,
        values = [0, 0],
      } = parsedInput || {};
      setValueType(
        "defaultTypeValue",
        NUMBER_OPTIONS.find((s) => s.id === parsedType)
      );
      setValueType("numberValue", value);
      setValueType("rangeStartValue", values[0]);
      setValueType("rangeEndValue", values[1]);
      if (parsedType === "comparison") {
        setValueType(
          "comparisonOperator",
          COMPARISON_OPTIONS.find((s) => s.id === operator)
        );
        setValueType("rangeStartType", RANGE_OPTIONS[0]);
        setValueType("rangeEndType", RANGE_OPTIONS[0]);
      } else if (parsedType === "range") {
        setValueType("comparisonOperator", COMPARISON_OPTIONS[0]);
        setValueType(
          "rangeStartType",
          RANGE_OPTIONS.find((s) => s.id === start)
        );
        setValueType(
          "rangeEndType",
          RANGE_OPTIONS.find((s) => s.id === end)
        );
      }
    } else if (type === "selection") {
      const { selectionList, type } = metaField || {};
      const value = ruleValue?.text;
      setValueType(
        "defaultTypeValue",
        selectionList?.find((s) => {
          const listValue =
            type?.toUpperCase() === "STRING" ? `"${s.value}"` : s.value;
          return listValue === value;
        })
      );
    } else if (RELATIONAL_TYPES.includes(type) && !isOutput) {
      const parsedInput = parseString(ruleValue?.text);
      const { type: parsedType } = parsedInput || {};
      setValueType(
        "defaultTypeValue",
        STRING_OPTIONS.find((s) => s.id === parsedType)
      );
    }
  }, [defaultType, isOutput, metaField, ruleValue, setValueType, type]);

  useEffect(() => {
    const { name, type } = metaField || {};
    if (RELATIONAL_TYPES.includes(type && type.toLowerCase())) {
      setMetaFieldName(null);
    } else {
      setMetaFieldName(name);
    }
  }, [metaField]);

  switch (type) {
    case "string":
      return (
        <React.Fragment>
          {valueFrom === "model" && isOutput ? (
            <React.Fragment>
              <InputLabel color="body" className={styles.label}>
                {translate("Select value")}
              </InputLabel>
              <Select
                update={(val) => {
                  let value =
                    val?.id &&
                    (val[`${nameCol}`] || val["name"] || `${val["id"]}`);

                  value = value && value.replace(/['"]+/g, "");
                  let currentVal =
                    value && !/^"[^"]*"$/.test(`${value.trim()}`)
                      ? `"${value}"`
                      : value;
                  (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                  updateDRDCell(ruleValue, rule, currentVal);
                  setValueType("setValue", currentVal);
                }}
                value={stringValue}
                fetchMethod={() =>
                  getExpressionValues(fullName || name, {
                    fields: [`${nameCol}`],
                  })
                }
                isLabel={false}
                optionLabel={nameCol}
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <InputLabel color="body" className={styles.label}>
                {translate("Edit string")}
              </InputLabel>
              {!isOutput && (
                <Select
                  update={(value) => {
                    setValueType("defaultTypeValue", value);
                    const parsedInput = parseString(ruleValue?.text);
                    const { values = [] } = parsedInput || {};
                    const str = values && values.join(",");
                    if (value?.id === DISJUNCTION) {
                      updateDRDCell(ruleValue, rule, str);
                    } else {
                      const updatedStr = str ? "not(".concat(str, ")") : "";
                      updateDRDCell(ruleValue, rule, updatedStr);
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
                  set: function (e, values) {
                    let value = values["value"];
                    const val = value && value.split(",");
                    const isMulti = val?.length > 1;

                    if (isMulti) {
                      if (defaultType?.id === NEGATION) {
                        const string = val
                          .map((v, ind) => {
                            const updatedV =
                              ind === 0
                                ? v?.replace(/["not()"]/g, "")
                                : v?.replace(/[")"]/g, "");
                            return `"${updatedV.replace(/"/g, "")}"`;
                          })
                          .join(",");
                        value = "not(".concat(string, ")");
                      } else {
                        value = val
                          .map((v) => `"${v.replace(/"/g, "")}"`)
                          .join(",");
                      }
                    }

                    const negationValue = value?.replace(/["not()"]/g, "");

                    const currentVal =
                      value && !/^"[^"]*"$/.test(`${value?.trim()}`) && !isMulti
                        ? defaultType?.id === NEGATION
                          ? "not(".concat(`"${negationValue}"`, ")")
                          : `"${value.replace(/"/g, "")}"`
                        : value;
                    (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                    updateDRDCell(ruleValue, rule, currentVal);
                    setValueType("setValue", currentVal);
                  },
                }}
                canRemove={true}
              />
              <Description desciption="Strings must be in double quotes. Add multiple strings with comma." />
            </React.Fragment>
          )}
        </React.Fragment>
      );
    case "boolean":
      return (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Value")}
          </InputLabel>
          <Select
            update={(value) => {
              updateDRDCell(ruleValue, rule, (value && value.id) || "");
            }}
            value={defaultType}
            options={BOOLEAN_OPTIONS}
            isLabel={false}
          />
        </React.Fragment>
      );
    case "date":
    case "datetime":
    case "time":
      return isOutput ? (
        <DateTimePicker
          type={type}
          disableUnderline={true}
          className={styles.input}
          value={dates && dates[0] ? moment(dates[0]) : null}
          onChange={(value) => {
            if (value) {
              updateDRDCell(
                ruleValue,
                rule,
                getDateString("exact", [dateFormat(value, type)])
              );
            } else {
              updateDRDCell(ruleValue, rule, "");
            }
          }}
        />
      ) : (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Edit")}
          </InputLabel>
          <Select
            update={(value) => {
              setValueType("defaultTypeValue", value);
              const newDates =
                value && value.id === "between"
                  ? [
                      dates[0],
                      dateFormat(moment(dates[0]).add(1, "days"), type),
                    ]
                  : dates;
              if (
                value &&
                parseDate(getDateString(value && value.id, newDates))
              ) {
                updateDRDCell(
                  ruleValue,
                  rule,
                  getDateString(value && value.id, newDates)
                );
              }
            }}
            value={defaultType}
            options={DATE_OPTIONS}
            isLabel={false}
            disableClearable
          />
          {defaultType && defaultType.id === "between" ? (
            <React.Fragment>
              <InputLabel color="body" className={styles.label}>
                {translate("Value")}
              </InputLabel>
              <DateTimePicker
                disableUnderline={true}
                className={styles.input}
                type={type}
                value={dates && dates[0] ? moment(dates[0]) : null}
                onChange={(value) => {
                  if (value && defaultType) {
                    updateDRDCell(
                      ruleValue,
                      rule,
                      getDateString(defaultType && defaultType.id, [
                        dateFormat(value, type),
                        dateFormat(
                          (dates && dates[1]) || moment(value).add(1, "days"),
                          type
                        ),
                      ])
                    );
                  } else {
                    updateDRDCell(ruleValue, rule, "");
                  }
                }}
              />
              <DateTimePicker
                disableUnderline={true}
                className={styles.input}
                type={type}
                value={dates && dates[1] ? moment(dates[1]) : null}
                onChange={(value) => {
                  if (value && defaultType) {
                    updateDRDCell(
                      ruleValue,
                      rule,
                      getDateString(defaultType && defaultType.id, [
                        (dates && dates[0]) || null,
                        dateFormat(value, type),
                      ])
                    );
                  } else {
                    updateDRDCell(ruleValue, rule, "");
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
                  value={dates && dates[0] ? moment(dates[0]) : null}
                  onChange={(value) => {
                    if (value && defaultType) {
                      updateDRDCell(
                        ruleValue,
                        rule,
                        getDateString(defaultType && defaultType.id, [
                          dateFormat(value, type),
                        ])
                      );
                    } else {
                      updateDRDCell(ruleValue, rule, "");
                    }
                  }}
                />
              </React.Fragment>
            )
          )}
        </React.Fragment>
      );
    case "double":
    case "integer":
    case "long":
    case "decimal":
      return isOutput ? (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Value")}
          </InputLabel>
          <NumberInput
            value={Number(numberValue)}
            type={type}
            scale={99}
            disableUnderline={true}
            onChange={(value) => {
              updateDRDCell(ruleValue, rule, "".concat(value));
            }}
          />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Edit number")}
          </InputLabel>
          <Select
            update={(value) => {
              setValueType("defaultTypeValue", value);
              if (!value) return;
              if (value.id === "range") {
                updateDRDCell(
                  ruleValue,
                  rule,
                  getRangeString(
                    rangeStartValue,
                    rangeEndValue,
                    rangeStartType?.id,
                    rangeEndType?.id
                  )
                );
              } else {
                updateDRDCell(
                  ruleValue,
                  rule,
                  getComparisonString(
                    comparisonOperator?.id || "equals",
                    numberValue || 0
                  )
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
          />
          {defaultType?.id === "range" ? (
            <React.Fragment>
              <InputLabel color="body" className={styles.label}>
                {translate("Start value")}
              </InputLabel>
              <Select
                update={(value) => {
                  setValueType("rangeStartType", value);
                  updateDRDCell(
                    ruleValue,
                    rule,
                    getRangeString(
                      rangeStartValue,
                      rangeEndValue,
                      value?.id,
                      rangeEndType?.id
                    )
                  );
                }}
                value={rangeStartType}
                options={RANGE_OPTIONS}
                isLabel={false}
                disableClearable
              />
              <InputLabel color="body" className={styles.label}>
                {translate("Value")}
              </InputLabel>
              <NumberInput
                value={rangeStartValue}
                type={type}
                scale={99}
                disableUnderline={true}
                onChange={(value) => {
                  updateDRDCell(
                    ruleValue,
                    rule,
                    getRangeString(
                      value,
                      rangeEndValue,
                      rangeStartType?.id,
                      rangeEndType?.id
                    )
                  );
                }}
              />
              <InputLabel color="body" className={styles.label}>
                {translate("End value")}
              </InputLabel>
              <Select
                update={(value) => {
                  setValueType("rangeEndType", value);
                  updateDRDCell(
                    ruleValue,
                    rule,
                    getRangeString(
                      rangeStartValue,
                      rangeEndValue,
                      rangeStartType?.id,
                      value?.id
                    )
                  );
                }}
                value={rangeEndType}
                options={RANGE_OPTIONS}
                isLabel={false}
                disableClearable
              />
              <InputLabel color="body" className={styles.label}>
                {translate("Value")}
              </InputLabel>
              <NumberInput
                value={rangeEndValue}
                type={type}
                disableUnderline={true}
                onChange={(value) => {
                  updateDRDCell(
                    ruleValue,
                    rule,
                    getRangeString(
                      rangeStartValue,
                      value,
                      rangeStartType?.id,
                      rangeEndType?.id
                    )
                  );
                }}
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Select
                update={(value) => {
                  setValueType(
                    "comparisonOperator",
                    value || { name: translate("Equals"), id: "equals" }
                  );
                  updateDRDCell(
                    ruleValue,
                    rule,
                    getComparisonString(value?.id || "equals", numberValue || 0)
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
              />
              <InputLabel color="body" className={styles.label}>
                {translate("Value")}
              </InputLabel>
              <NumberInput
                value={numberValue}
                type={type}
                disableUnderline={true}
                scale={99}
                onChange={(value) => {
                  updateDRDCell(
                    ruleValue,
                    rule,
                    getComparisonString(
                      comparisonOperator?.id || "equals",
                      value
                    )
                  );
                  setValueType("numberValue", value);
                }}
              />
            </React.Fragment>
          )}
        </React.Fragment>
      );
    case "selection":
      const updateValue = (value) => {
        const text = value.reduce(
          (accumulator, item) =>
            item.value
              ? metaField.type.toUpperCase() === "STRING"
                ? `${accumulator}${accumulator ? "," : ""}"${item.value}"`
                : `${accumulator}${accumulator ? "," : ""}${item.value}`
              : accumulator,
          ""
        );
        setValueType("setValue", text);
        updateDRDCell(ruleValue, rule, text);
      };
      return (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Select value")}
          </InputLabel>
          <Select
            className={styles.select}
            update={(value) => {
              updateValue(value);
            }}
            multiple={true}
            options={metaField.selectionList}
            name="multiSelect"
            value={metaField.selectionList.filter((item) =>
              stringValue
                .split(",")
                .map((v) => v.replace(/"/g, ""))
                .includes(item.value.toString())
            )}
            optionLabel={metaFieldName || nameField || targetName || "name"}
            optionLabelSecondary="title"
            handleRemove={(option) => {
              let value = metaField.selectionList
                .filter((item) =>
                  stringValue
                    .split(",")
                    .map((v) => v.replace(/"/g, ""))
                    .includes(item.value.toString())
                )
                .filter((r) => r.title !== option.title);
              updateValue(value);
            }}
          />
        </React.Fragment>
      );
    case "one_to_one":
    case "many_to_one":
    case "many_to_many":
    case "one_to_many":
    case "json_one_to_one":
    case "json_many_to_one":
    case "json_many_to_many":
    case "json_one_to_many":
    case "one-to-one":
    case "many-to-one":
    case "many-to-many":
    case "one-to-many":
    case "json-one-to-one":
    case "json-many-to-one":
    case "json-many-to-many":
    case "json-one-to-many":
      const input = parseString(ruleValue?.text);
      const { values: value } = input || {};
      const updateSelectValue = (value) => {
        const values = [];
        let isNameField;
        (value || []).forEach((val) => {
          if (typeof val !== "string") {
            const targetFields =
              metaFieldName || nameField || targetName || "name" || "id";
            isNameField = Array.isArray(val)
              ? val.find((v) => v && v[targetFields])
              : val && val[targetFields];
            values.push(`"${isNameField}"`);
            return;
          }
          values.push(val);
        });
        const str = values && values.toString();
        if (defaultType?.id === NEGATION) {
          const updatedStr = str ? "not(".concat(str, ")") : "";
          updateDRDCell(ruleValue, rule, updatedStr);
        } else {
          updateDRDCell(ruleValue, rule, str);
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
                update={(value) => {
                  setValueType("defaultTypeValue", value);
                  const parsedInput = parseString(ruleValue?.text);
                  const { values = [] } = parsedInput || {};
                  const str = values && values.join(",");
                  if (value?.id === DISJUNCTION) {
                    updateDRDCell(ruleValue, rule, str);
                  } else {
                    const updatedStr = str ? "not(".concat(str, ")") : "";
                    updateDRDCell(ruleValue, rule, updatedStr);
                  }
                }}
                value={defaultType || { name: "Match one", id: "disjunction" }}
                options={STRING_OPTIONS}
                isLabel={false}
                disableClearable
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
            update={(value) => {
              updateSelectValue(value);
            }}
            name="value"
            value={value || []}
            isLabel={false}
            optionLabel={metaFieldName || nameField || targetName || "name"}
            optionLabelSecondary="title"
            handleRemove={(option) => {
              updateSelectValue(value?.filter((r) => r !== option));
            }}
          />
        </React.Fragment>
      );
    default:
      return (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("Edit string")}
          </InputLabel>
          {!isOutput && (
            <Select
              update={(value) => {
                const parsedInput = parseString(ruleValue && ruleValue.text);
                const { values = [] } = parsedInput || {};
                if (value && value.id === DISJUNCTION) {
                  updateDRDCell(ruleValue, rule, values && values.join(","));
                } else {
                  updateDRDCell(
                    ruleValue,
                    rule,
                    "not(".concat(values.join(","), ")")
                  );
                }
              }}
              value={defaultType}
              options={STRING_OPTIONS}
              isLabel={false}
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
              set: function (e, values) {
                let value = values["value"];
                value = value && value.replace(/['"]+/g, "");
                const val = value && value.replace(/['"]+/g, "").split(",");
                let isMulti = false;
                if (val.length > 1) {
                  value = val.map((v) => `"${v}"`).join(",");
                  isMulti = true;
                }
                let currentVal =
                  value && !/^"[^"]*"$/.test(`${value.trim()}`) && !isMulti
                    ? `"${value}"`
                    : value;
                (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                updateDRDCell(ruleValue, rule, currentVal);
                setValueType("setValue", currentVal);
              },
            }}
            canRemove={true}
          />
          <Description desciption="Strings must be in double quotes. Add multiple strings with comma." />
        </React.Fragment>
      );
  }
}
