import React, { useState, useEffect, useMemo } from "react";
import { parseString as parseNumber } from "dmn-js-decision-table/lib/features/simple-number-edit/Utils";

import { RANGE_OPTIONS, ALLOWED_TYPES } from "../constants";
import RenderTypeProperties from "./RenderTypeProperties";
import { translate } from "../../utils";

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
}) {
  const [type, setType] = useState(null);
  const [valueFrom, setValueFrom] = useState("context");
  const [value, setValue] = useState("");
  const [defaultType, setDefaultType] = useState("");
  const [inputMetaField, setInputMetaField] = useState(null);
  const [relationalField, setRelationalField] = useState(null);
  const [comparisonOperator, setComparisonOperator] = useState({
    name: translate("Equals"),
    id: "equals",
  });
  const [numberValue, setNumberValue] = useState(0);
  const [rangeStartValue, setRangeStart] = useState(0);
  const [rangeEndValue, setRangeEnd] = useState(0);
  const [rangeStartType, setRangeStartType] = useState({
    name: translate("Include"),
    id: "include",
  });
  const [rangeEndType, setRangeEndType] = useState({
    name: translate("Include"),
    id: "include",
  });
  const models = useMemo(() => getData && getData(), [getData]);

  const setValueType = (type, val = "") => {
    switch (type) {
      case "comparisonOperator":
        setComparisonOperator(val);
        return;
      case "rangeStartValue":
        setRangeStart(val);
        return;
      case "rangeEndValue":
        setRangeEnd(val);
        return;
      case "numberValue":
        setNumberValue(val);
        return;
      case "defaultTypeValue":
        setDefaultType(val);
        return;
      case "rangeStartType":
        setRangeStartType(val);
        return;
      case "rangeEndType":
        setRangeEndType(val);
        return;
      case "setValue":
        setValue(val);
        return;
      default:
        return;
    }
  };

  const updateDRDCell = (output, row, value = "") => {
    const activeEditor = dmnModeler.getActiveViewer();
    const modeling = activeEditor.get("modeling");
    const sheet = activeEditor.get("sheet");
    const element = sheet.getRoot();
    const rows = element.rows;
    if (!rows) return;
    const rowIndex = rows.findIndex((r) => r.id === row.id);
    const selectedRow = rows[rowIndex];
    if (!selectedRow) return;
    const selectedCellIndex =
      selectedRow.cells &&
      selectedRow.cells.findIndex((c) => c.id === output.id);
    let cell = rows[rowIndex].cells[selectedCellIndex];
    modeling.editCell(cell.businessObject, value);
    if (["long", "integer", "double", "decimal"].includes(type)) {
      const parsedInput = parseNumber(
        cell.businessObject && cell.businessObject.text
      );
      const { values, start, end } = parsedInput || {};
      if (values) {
        setRangeStart(values[0]);
        setRangeEnd(values[1]);
      }
      if (start) {
        setRangeStartType(RANGE_OPTIONS.find((r) => r.id === start));
      }
      if (end) {
        setRangeEndType(RANGE_OPTIONS.find((r) => r.id === end));
      }
      return;
    }
    setValue(value);
  };

  useEffect(() => {
    const entityObj = isOutput ? entity : entity && entity.inputExpression;
    const textMetaField =
      entityObj &&
      entityObj.$attrs &&
      entityObj.$attrs["camunda:textMetaField"];

    const relationalMetaField =
      entityObj &&
      entityObj.$attrs &&
      entityObj.$attrs["camunda:relationalField"];
    const valueFrom =
      entityObj && entityObj.$attrs && entityObj.$attrs["camunda:valueFrom"];
    const metaField = textMetaField ? JSON.parse(textMetaField) : undefined;
    const relationalField = relationalMetaField
      ? JSON.parse(relationalMetaField)
      : undefined;
    setInputMetaField(metaField);
    setRelationalField(relationalField);
    let typeRef = metaField
      ? metaField.selection
        ? "selection"
        : !metaField?.type && relationalField?.type
        ? relationalField.type.toLowerCase()
        : metaField.type && metaField.type.toLowerCase()
      : entityObj && entityObj.typeRef;
    typeRef = ALLOWED_TYPES.includes(typeRef) ? typeRef : "string";
    setType(typeRef);
    setValueFrom(valueFrom);
    setDefaultType(null);
  }, [entity, isOutput, dmnModeler]);

  useEffect(() => {
    const entityObj = isOutput ? entity : entity && entity.inputExpression;
    const text = isOutput ? entityObj?.$attrs["camunda:text"] : entityObj?.text;
    const metaField = entityObj?.$attrs["camunda:textMetaField"];

    const model = text && text.split(".")[0];
    const match =
      model &&
      models?.find((m) => m.name.toLowerCase() === model.toLowerCase())?.name;
    const isAbsent = metaField && !match ? true : false;
    if (isAbsent) {
      setType("string");
    }
  }, [models, isOutput, entity]);

  useEffect(() => {
    setValue(
      rule &&
        rule[ruleFieldType] &&
        rule[ruleFieldType][ruleIndex] &&
        rule[ruleFieldType][ruleIndex].text
    );
  }, [rule, ruleFieldType, ruleIndex]);

  return (
    <React.Fragment>
      {type && (
        <RenderTypeProperties
          type={type}
          updateDRDCell={updateDRDCell}
          rule={rule}
          ruleValue={rule[ruleFieldType][ruleIndex]}
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
