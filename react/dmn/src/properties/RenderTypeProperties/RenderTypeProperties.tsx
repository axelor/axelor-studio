import { useCallback, useEffect, useState } from "react";
import { parseString } from "dmn-js-decision-table/lib/features/simple-string-edit/Utils.js";
import { parseString as parseBoolean } from "dmn-js-decision-table/lib/features/simple-boolean-edit/Utils";
import { parseString as parseDate } from "dmn-js-decision-table/lib/features/simple-date-edit/Utils";
import { parseString as parseNumber } from "dmn-js-decision-table/lib/features/simple-number-edit/Utils";

import { getCustomModelData, getNameField, getData } from "../../services/api";
import {
  STRING_OPTIONS,
  BOOLEAN_OPTIONS,
  RANGE_OPTIONS,
  COMPARISON_OPTIONS,
  NUMBER_OPTIONS,
  DATE_OPTIONS,
  RELATIONAL_TYPES,
} from "../../constants";
import type { DmnElement, MetaFieldInfo, RangeOption, ComparisonOperator } from "../types";

import StringTypeEditor from "./StringTypeEditor";
import BooleanTypeEditor from "./BooleanTypeEditor";
import DateTypeEditor from "./DateTypeEditor";
import NumberTypeEditor from "./NumberTypeEditor";
import SelectionTypeEditor from "./SelectionTypeEditor";
import RelationalTypeEditor from "./RelationalTypeEditor";
import DefaultTypeEditor from "./DefaultTypeEditor";


interface RenderTypePropertiesProps {
  type: string;
  updateDRDCell: (output: Record<string, unknown>, row: Record<string, unknown>, value?: string) => void;
  ruleValue: Record<string, unknown> | undefined;
  rule: Record<string, unknown>;
  defaultType: Record<string, unknown> | null;
  comparisonOperator: ComparisonOperator;
  rangeStartValue: number | string;
  rangeEndValue: number | string;
  rangeEndType: RangeOption;
  rangeStartType: RangeOption;
  setValueType: (type: string, val?: unknown) => void;
  metaField: Record<string, unknown> | null;
  element: DmnElement;
  value: string | undefined;
  isOutput: boolean;
  relationalField: Record<string, unknown> | null;
  valueFrom: string | undefined;
  nameCol: string;
  numberValue: number | string;
}

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
}: RenderTypePropertiesProps) {
  const { _targetName, target, _fullName, _name, targetModel, model, jsonTarget } =
    (relationalField || metaField || {}) as Record<string, string | undefined>;
  const [metaFieldName, setMetaFieldName] = useState<string | null>(null);
  const [nameField, setNameField] = useState<string | null>(null);
  const [dates, setDates] = useState<(string | null)[] | null>(null);

  const fetchData = useCallback(async (): Promise<unknown[]> => {
    let data: unknown[] | undefined;
    if (model === "com.axelor.meta.db.MetaJsonRecord" && jsonTarget) {
      data = await getCustomModelData(jsonTarget);
      const fieldData = await getNameField(jsonTarget);
      setNameField((fieldData?.name as string) ?? null);
    } else {
      data = await getData(target || targetModel || "");
    }
    return data || [];
  }, [jsonTarget, model, target, targetModel]);

  useEffect(() => {
    if (type === "string" && !isOutput) {
      const parsedInput = parseString(ruleValue?.text as string);
      const { type: parsedType } = parsedInput || {};
      setValueType(
        "defaultTypeValue",
        STRING_OPTIONS.find((s: { id: string }) => s.id === parsedType),
      );
    } else if (type === "boolean") {
      const parsedType = parseBoolean(ruleValue?.text as string);
      setValueType(
        "defaultTypeValue",
        BOOLEAN_OPTIONS.find((s: { id: string }) => s.id === parsedType),
      );
    } else if (["date", "datetime", "time"].includes(type)) {
      const parsedInput = parseDate(ruleValue?.text as string) as {
        type?: string;
        date?: string;
        dates?: (string | null)[];
      } | null;
      const { type: parsedType = "exact", date, dates: parsedDates } = parsedInput || {};
      if (ruleValue?.text) {
        setValueType(
          "defaultTypeValue",
          DATE_OPTIONS.find((s: { id: string }) => s.id === parsedType),
        );
      }
      if (parsedType === "between") {
        setDates(parsedDates as (string | null)[]);
      } else if (date) {
        setDates([date, null]);
      } else {
        setDates([null, null]);
      }
    } else if (["long", "integer", "double", "decimal"].includes(type) && !isOutput) {
      const parsedInput = parseNumber(ruleValue?.text as string);
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
        NUMBER_OPTIONS.find((s: { id: string }) => s.id === parsedType),
      );
      setValueType("numberValue", value);
      setValueType("rangeStartValue", values[0]);
      setValueType("rangeEndValue", values[1]);
      if (parsedType === "comparison") {
        setValueType(
          "comparisonOperator",
          COMPARISON_OPTIONS.find((s: { id: string }) => s.id === operator),
        );
        setValueType("rangeStartType", RANGE_OPTIONS[0]);
        setValueType("rangeEndType", RANGE_OPTIONS[0]);
      } else if (parsedType === "range") {
        setValueType("comparisonOperator", COMPARISON_OPTIONS[0]);
        setValueType(
          "rangeStartType",
          RANGE_OPTIONS.find((s: { id: string }) => s.id === start),
        );
        setValueType(
          "rangeEndType",
          RANGE_OPTIONS.find((s: { id: string }) => s.id === end),
        );
      }
    } else if (type === "selection") {
      const mf = metaField as MetaFieldInfo | null;
      const selectionList = (mf?.selectionList || []) as Array<{ value: string; [key: string]: unknown }>;
      const mfType = mf?.type;
      const val = ruleValue?.text as string | undefined;
      setValueType(
        "defaultTypeValue",
        selectionList.find((s) => {
          const listValue = mfType?.toUpperCase() === "STRING" ? `"${s.value}"` : s.value;
          return listValue === val;
        }),
      );
    } else if (RELATIONAL_TYPES.includes(type) && !isOutput) {
      const parsedInput = parseString(ruleValue?.text as string);
      const { type: parsedType } = parsedInput || {};
      setValueType(
        "defaultTypeValue",
        STRING_OPTIONS.find((s: { id: string }) => s.id === parsedType),
      );
    }
  }, [defaultType, isOutput, metaField, ruleValue, setValueType, type]);

  useEffect(() => {
    const mf = metaField as MetaFieldInfo | null;
    const { name: mfName, type: mfType } = mf || {};
    if (RELATIONAL_TYPES.includes(mfType ? mfType.toLowerCase() : "")) {
      setMetaFieldName(null);
    } else {
      setMetaFieldName(mfName ?? null);
    }
  }, [metaField]);

  const commonProps = {
    updateDRDCell,
    ruleValue,
    rule,
    defaultType,
    setValueType,
    element,
    value: stringValue,
    isOutput,
  };

  switch (type) {
    case "string":
      return (
        <StringTypeEditor
          {...commonProps}
          metaField={metaField}
          relationalField={relationalField}
          valueFrom={valueFrom}
          nameCol={nameCol}
        />
      );
    case "boolean":
      return <BooleanTypeEditor {...commonProps} />;
    case "date":
    case "datetime":
    case "time":
      return <DateTypeEditor {...commonProps} type={type} dates={dates} />;
    case "double":
    case "integer":
    case "long":
    case "decimal":
      return (
        <NumberTypeEditor
          {...commonProps}
          type={type}
          comparisonOperator={comparisonOperator}
          rangeStartValue={rangeStartValue}
          rangeEndValue={rangeEndValue}
          rangeEndType={rangeEndType}
          rangeStartType={rangeStartType}
          numberValue={numberValue}
        />
      );
    case "selection":
      return (
        <SelectionTypeEditor
          {...commonProps}
          metaField={metaField as MetaFieldInfo | null}
          metaFieldName={metaFieldName}
          nameField={nameField}
        />
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
      return (
        <RelationalTypeEditor
          {...commonProps}
          metaField={metaField as MetaFieldInfo | null}
          fetchData={fetchData}
          metaFieldName={metaFieldName}
          nameField={nameField}
        />
      );
    default:
      return <DefaultTypeEditor {...commonProps} />;
  }
}
