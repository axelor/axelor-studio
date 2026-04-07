import React, { useState, useEffect, useMemo } from "react";
import { parseString as parseNumber } from "dmn-js-decision-table/lib/features/simple-number-edit/Utils";
import { translate } from "@studio/shared/i18n";

import { RANGE_OPTIONS, ALLOWED_TYPES } from "../constants";

import RenderTypeProperties from "./RenderTypeProperties";
import { getDmnService } from "@studio/shared/types";
import type { DmnElement, DmnModeler, DmnExpression, RangeOption, ComparisonOperator, ModelOption } from "./types";

interface RulePropertiesProps {
  element: DmnElement;
  dmnModeler: DmnModeler;
  rule: Record<string, unknown>;
  ruleFieldType: string;
  ruleIndex: number;
  entity: DmnElement | null;
  isOutput?: boolean;
  nameCol: string;
  getData?: (() => ModelOption[]) | null;
}

export default function RuleProperties({
  element,
  dmnModeler,
  rule,
  ruleFieldType,
  ruleIndex,
  entity,
  isOutput = false,
  nameCol,
  getData,
}: RulePropertiesProps) {
  const [type, setType] = useState<string | null>(null);
  const [valueFrom, setValueFrom] = useState<string | undefined>("context");
  const [value, setValue] = useState<string | undefined>("");
  const [defaultType, setDefaultType] = useState<Record<string, unknown> | null>(null);
  const [inputMetaField, setInputMetaField] = useState<Record<string, unknown> | null>(null);
  const [relationalField, setRelationalField] = useState<Record<string, unknown> | null>(null);
  const [comparisonOperator, setComparisonOperator] = useState<ComparisonOperator>({
    name: translate("Equals"),
    id: "equals",
  });
  const [numberValue, setNumberValue] = useState<number | string>(0);
  const [rangeStartValue, setRangeStart] = useState<number | string>(0);
  const [rangeEndValue, setRangeEnd] = useState<number | string>(0);
  const [rangeStartType, setRangeStartType] = useState<RangeOption>({
    name: translate("Include"),
    id: "include",
  });
  const [rangeEndType, setRangeEndType] = useState<RangeOption>({
    name: translate("Include"),
    id: "include",
  });
  const models = useMemo(() => getData && getData(), [getData]);

  const setValueType = (typeName: string, val: unknown = "") => {
    switch (typeName) {
      case "comparisonOperator":
        setComparisonOperator(val as ComparisonOperator);
        return;
      case "rangeStartValue":
        setRangeStart(val as number | string);
        return;
      case "rangeEndValue":
        setRangeEnd(val as number | string);
        return;
      case "numberValue":
        setNumberValue(val as number | string);
        return;
      case "defaultTypeValue":
        setDefaultType(val as Record<string, unknown> | null);
        return;
      case "rangeStartType":
        setRangeStartType(val as RangeOption);
        return;
      case "rangeEndType":
        setRangeEndType(val as RangeOption);
        return;
      case "setValue":
        setValue(val as string);
        return;
      default:
        return;
    }
  };

  const updateDRDCell = (output: Record<string, unknown>, row: Record<string, unknown>, cellValue = "") => {
    const activeEditor = dmnModeler.getActiveViewer();
    const modeling = getDmnService(activeEditor, "modeling");
    const sheet = getDmnService(activeEditor, "sheet");
    const rootElement = sheet.getRoot();
    const rows = rootElement.rows;
    if (!rows) return;
    const rowIndex = rows.findIndex((r) => r.id === row.id);
    const selectedRow = rows[rowIndex];
    if (!selectedRow) return;
    const selectedCellIndex =
      selectedRow.cells && selectedRow.cells.findIndex((c) => c.id === output.id);
    if (selectedCellIndex === undefined || selectedCellIndex === -1) return;
    const cell = rows[rowIndex].cells[selectedCellIndex];
    modeling.editCell(cell.businessObject, cellValue);
    if (type && ["long", "integer", "double", "decimal"].includes(type)) {
      const parsedInput = parseNumber(cell.businessObject?.text as string);
      const { values, start, end } = parsedInput || {};
      if (values) {
        setRangeStart(values[0]);
        setRangeEnd(values[1]);
      }
      if (start) {
        setRangeStartType(RANGE_OPTIONS.find((r: RangeOption) => r.id === start) as RangeOption);
      }
      if (end) {
        setRangeEndType(RANGE_OPTIONS.find((r: RangeOption) => r.id === end) as RangeOption);
      }
      return;
    }
    setValue(cellValue);
  };

  useEffect(() => {
    const entityObj = isOutput ? entity : (entity)?.inputExpression;
    const textMetaField =
      entityObj && entityObj.$attrs && (entityObj.$attrs["camunda:textMetaField"] as string | undefined);

    const relationalMetaField =
      entityObj && entityObj.$attrs && (entityObj.$attrs["camunda:relationalField"] as string | undefined);
    const valueFromAttr = entityObj && entityObj.$attrs && (entityObj.$attrs["camunda:valueFrom"] as string | undefined);
    const metaField = textMetaField ? JSON.parse(textMetaField) : undefined;
    const relField = relationalMetaField ? JSON.parse(relationalMetaField) : undefined;
    setInputMetaField(metaField ?? null);
    setRelationalField(relField ?? null);
    let typeRef = metaField
      ? metaField.selection
        ? "selection"
        : !metaField?.type && relField?.type
          ? relField.type.toLowerCase()
          : metaField.type && metaField.type.toLowerCase()
      : entityObj && entityObj.typeRef;
    typeRef = ALLOWED_TYPES.includes(typeRef) ? typeRef : "string";
    setType(typeRef);
    setValueFrom(valueFromAttr ?? undefined);
    setDefaultType(null);
  }, [entity, isOutput, dmnModeler]);

  useEffect(() => {
    const entityObj = isOutput
      ? (entity as DmnExpression | undefined)
      : ((entity)?.inputExpression);
    const text = isOutput
      ? (entityObj?.$attrs?.["camunda:text"] as string | undefined)
      : entityObj?.text;
    const metaField = entityObj?.$attrs?.["camunda:textMetaField"] as string | undefined;

    const model = text ? text.split(".")[0] : undefined;
    const match = model && models?.find((m: ModelOption) => m.name.toLowerCase() === model.toLowerCase())?.name;
    const isAbsent = metaField && !match ? true : false;
    if (isAbsent) {
      setType("string");
    }
  }, [models, isOutput, entity]);

  useEffect(() => {
    const ruleFields = rule[ruleFieldType] as Array<{ text?: string }> | undefined;
    setValue(ruleFields?.[ruleIndex]?.text);
  }, [rule, ruleFieldType, ruleIndex]);

  return (
    <React.Fragment>
      {type && (
        <RenderTypeProperties
          type={type}
          updateDRDCell={updateDRDCell}
          rule={rule}
          ruleValue={(rule[ruleFieldType] as Array<Record<string, unknown>>)?.[ruleIndex]}
          defaultType={defaultType}
          setValueType={setValueType}
          comparisonOperator={comparisonOperator}
          rangeStartValue={rangeStartValue}
          rangeEndValue={rangeEndValue}
          rangeEndType={rangeEndType}
          rangeStartType={rangeStartType}
          metaField={inputMetaField}
          isOutput={isOutput}
          element={element}
          value={value}
          relationalField={relationalField}
          valueFrom={valueFrom}
          nameCol={nameCol}
          numberValue={numberValue}
        />
      )}
    </React.Fragment>
  );
}
