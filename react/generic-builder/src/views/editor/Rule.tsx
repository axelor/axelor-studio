import React, { useEffect, useState } from "react";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import FieldEditor from "../field-editor/field-editor";
import { Select, Tooltip, IconButton } from "../../components";
import {
  OPERATORS,
  OPERATORS_BY_TYPE,
  ALLOWED_TYPES,
  BUILT_IN_VARIABLES,
  VAR_TYPES,
  VAR_OPTIONS,
} from "../../common/constants";
import { getCustomVariables } from "../../services/expression-service";
import { getMetaFields as getMetaFieldsAPI } from "../../services/field-service";
import { isBPMQuery, translate } from "../../common/utils";
import { getModelFilter, useMetaModelSearch } from "../../views/utils";
import TransformationBuilder from "../../transformation-builder";

import { getValue } from "./RenderWidget";
import ValueSourceSection from "./ValueSourceSection";
import styles from "./editor.module.css";

async function fetchField(
  metaModals: Record<string, unknown> | undefined,
  type: string | undefined,
) {
  const isQuery = isBPMQuery(type);
  const allFields = (await getMetaFieldsAPI(metaModals, isQuery)) || [];
  return allFields.filter(
    (a: Record<string, unknown>) =>
      ALLOWED_TYPES.includes(((a.type as string) || "").toLowerCase()) &&
      (isQuery ? !a.json : true),
  );
}

interface RuleProps {
  index: number;
  getMetaFields: () => Promise<Record<string, unknown>[]>;
  editor: Record<string, unknown>;
  value: Record<string, unknown>;
  expression?: string;
  parentType?: string;
  parentMetaModal?: Record<string, unknown>;
  element?: unknown;
  isCondition?: boolean;
  onChange: (e: Record<string, unknown>, editor: Record<string, unknown>, i?: number) => void;
  onRemove: (editorId: unknown, index: number) => void;
  isParameterShow?: boolean;
  fetchModels?: (filter: unknown) => Promise<Record<string, unknown>[]>;
  isAllowButtons?: boolean;
  isBPMN?: boolean;
  isMapper?: boolean;
  isBPM?: boolean;
}

const Rule = React.memo(function Rule(props: RuleProps) {
  const {
    index,
    getMetaFields,
    editor,
    value,
    expression,
    parentType,
    parentMetaModal,
    element,
    isCondition,
    onChange: _onChange,
    onRemove,
    isParameterShow,
    fetchModels,
    isAllowButtons = false,
    isBPMN = false,
    isMapper = false,
  } = props;

  const {
    isField = "none",
    fieldType = "",
    field,
    operator,
    fieldValue,
    fieldValue2 = "",
    relatedValueModal: metaModal,
    relatedElseValueModal: elseMetaModal,
    relatedValueFieldName,
    relatedElseValueFieldName,
    isShowElseMetaModelField,
    isShowMetaModelField,
    fieldTransformations,
    valueTransformations,
    valueTransformations2,
  } = value;

  const type = fieldType && (fieldType as string).toLowerCase().replaceAll("-", "_");
  const [open, setOpen] = useState(false);
  const [elseNameValue, setElseNameValue] = useState<Record<string, unknown> | null>(null);
  const [nameValue, setNameValue] = useState<Record<string, unknown> | null>(null);
  const [isParameter, setIsParameter] = useState(true);
  const [transform, setTransform] = useState("field");

  const transformationsMap: Record<string, unknown> = {
    fieldTransformations,
    valueTransformations,
    valueTransformations2,
  };
  const fetchMetaModels = useMetaModelSearch(element, isMapper ? null : "metaModel");
  const isBuiltInVars = (metaModal as Record<string, unknown>)?.type === VAR_TYPES.BUILT_IN;
  const isCustomVars = (metaModal as Record<string, unknown>)?.type === VAR_TYPES.CUSTOM;
  const isVariable = isCustomVars || isBuiltInVars;

  const onChange = React.useCallback(
    (e: Record<string, unknown>, editor: Record<string, unknown>) => _onChange(e, editor, index),
    [index, _onChange],
  );

  const operatorsOptions = OPERATORS.filter((item) => {
    let operatorType = type as string;
    if (
      operatorType === "" &&
      value.fieldName &&
      (value.allField as Record<string, unknown>[]).length > 0
    ) {
      const parentField = (value.allField as Record<string, unknown>[]).find(
        (f: Record<string, unknown>) => f.name === value.fieldName,
      );
      operatorType = (((parentField && parentField.type) || "") as string).toLowerCase();
    }
    return (OPERATORS_BY_TYPE[operatorType] || []).includes(item.name);
  });

  const handleChange = React.useCallback(
    (name: string, value: unknown) => {
      onChange({ name, value }, editor);
    },
    [onChange, editor],
  );

  const fetchMetaModalField = React.useCallback(
    () => fetchField(metaModal as Record<string, unknown>, parentType),
    [metaModal, parentType],
  );
  const fetchElseMetaModalField = React.useCallback(
    () => fetchField(elseMetaModal as Record<string, unknown>, type as string),
    [elseMetaModal, type],
  );
  const fetchContextModels = React.useCallback(
    async ({ search }: { search?: string }) => {
      let data = fetchModels
        ? await fetchModels(getModelFilter(element, { search }))
        : await fetchMetaModels({ search });
      if (isBPMN) {
        data = [...VAR_OPTIONS, ...((data) || [])];
      }
      return (data) || [];
    },
    [fetchMetaModels, fetchModels, isBPMN, parentType],
  );

  useEffect(() => {
    setIsParameter(isParameterShow || false);
  }, [isParameterShow]);
  useEffect(() => {
    isVariable && handleChange("isShowMetaModelField", true);
  }, [isVariable, handleChange]);

  useEffect(() => {
    const {
      fieldValue,
      allField = [],
      fieldValue2 = "",
      isRelationalValue,
      relatedValueModal,
      relatedValueFieldName,
      relatedElseValueModal,
      relatedElseValueFieldName,
      isShowMetaModelField: showMeta,
      isShowElseMetaModelField: showElseMeta,
      isField: propIsField,
    } = value;
    setElseNameValue({
      allField,
      field: relatedElseValueFieldName,
      fieldName:
        getValue(fieldValue2) ||
        (relatedElseValueFieldName && (relatedElseValueFieldName as Record<string, unknown>).name),
      fieldType:
        relatedElseValueFieldName && (relatedElseValueFieldName as Record<string, unknown>).type,
      fieldValue: null,
      fieldValue2: null,
      operator: null,
      isRelationalValue: isRelationalValue || "none",
      relatedValueFieldName,
      relatedValueModal,
      relatedElseValueFieldName,
      relatedElseValueModal,
      isShow: showElseMeta,
    });
    setNameValue({
      allField,
      field: relatedValueFieldName,
      fieldName:
        getValue(fieldValue) ||
        (relatedValueFieldName && (relatedValueFieldName as Record<string, unknown>).fieldName),
      fieldType: relatedValueFieldName && (relatedValueFieldName as Record<string, unknown>).type,
      fieldValue: null,
      fieldValue2: null,
      operator: null,
      isRelationalValue: isRelationalValue || propIsField || "none",
      relatedValueFieldName,
      relatedValueModal,
      isShow: showMeta,
    });
  }, [value]);

  const radioOptions = React.useMemo(() => {
    let data: { label: string; value: string }[] = [];
    if (!["isTrue", "isFalse"].includes(operator as string) && !isCondition) {
      data = [...data, { label: "Self", value: "self" }, { label: "Context", value: "context" }];
    } else if (isParameter && isBPMQuery(parentType)) {
      data = [...data, { label: "Is parameter", value: "param" }];
    }
    return [...data, { label: "None", value: "none" }];
  }, [operator, isCondition, parentType, isParameter]);

  function handleOpen(type: string = "fieldTransformations") {
    setOpen(true);
    setTransform(type);
  }

  const getVariables = async () => {
    return isBuiltInVars
      ? BUILT_IN_VARIABLES.map((v) => ({ name: v.name, title: v.title }))
      : await getCustomVariables();
  };

  return (
    <Box data-testid="rule" d="flex" alignItems="flex-end" gap={4} className={styles.rules}>
      <FieldEditor
        getMetaFields={getMetaFields}
        isField={isField as string}
        editor={editor}
        onChange={onChange}
        value={value}
        expression={expression}
        type={parentType}
        isParent
        isAllowButtons={isAllowButtons}
        setInitialField={() => {
          handleChange("isField", "none");
        }}
      />
      {!!(parentType !== "bpmQuery" && field) && (
        <IconButton size="small" className={styles.iconButton}>
          <Tooltip title={translate("Add Data transformation")}>
            <MaterialIcon
              icon="calculate"
              color="body"
              fontSize={18}
              onClick={() => {
                handleOpen("fieldTransformations");
              }}
            />
          </Tooltip>
        </IconButton>
      )}
      <Select
        data-testid="operator-select"
        name="operator"
        placeholder="Operator"
        options={
          field && (field as Record<string, unknown>).selectionList
            ? OPERATORS.filter((o) =>
                (isField && !["none", "param"].includes(isField as string)
                  ? ["=", "!=", "isNull", "isNotNull"]
                  : ["=", "!=", "isNull", "isNotNull", "in", "notIn"]
                ).includes(o.name),
              )
            : isField && !["none", "param"].includes(isField as string)
              ? operatorsOptions.filter((o) => o.name !== "in" && o.name !== "notIn")
              : operatorsOptions
        }
        onChange={(value: unknown) => {
          onChange({ name: "operator", value }, editor);
          handleChange("isField", null);
        }}
        value={operator as string}
        className={styles.operators}
      />
      <ValueSourceSection
        isField={isField}
        operator={operator}
        expression={expression}
        parentType={parentType}
        editor={editor}
        isBPMN={isBPMN}
        isCondition={isCondition}
        index={index}
        type={type}
        field={field}
        fieldValue={fieldValue}
        fieldValue2={fieldValue2}
        metaModal={metaModal}
        elseMetaModal={elseMetaModal}
        isShowMetaModelField={isShowMetaModelField}
        isShowElseMetaModelField={isShowElseMetaModelField}
        relatedValueFieldName={relatedValueFieldName}
        relatedElseValueFieldName={relatedElseValueFieldName}
        isVariable={isVariable}
        parentMetaModal={parentMetaModal}
        radioOptions={radioOptions}
        nameValue={nameValue}
        setNameValue={setNameValue}
        elseNameValue={elseNameValue}
        setElseNameValue={setElseNameValue}
        handleChange={handleChange}
        onChange={onChange}
        handleOpen={handleOpen}
        getMetaFields={getMetaFields}
        fetchContextModels={fetchContextModels}
        fetchMetaModels={fetchMetaModels}
        fetchMetaModalField={fetchMetaModalField}
        fetchElseMetaModalField={fetchElseMetaModalField}
        getVariables={getVariables}
      />
      {!["isNull", "isNotNull", "isTrue", "isFalse", "between", "notBetween"].includes(
        operator as string,
      ) && (
        <IconButton size="small" className={styles.iconButton}>
          <Tooltip title={translate("Add Data transformation")}>
            <MaterialIcon
              icon="calculate"
              color="body"
              fontSize={18}
              onClick={() => {
                handleOpen("valueTransformations");
              }}
            />
          </Tooltip>
        </IconButton>
      )}
      <div style={{ display: "flex" }}>
        <IconButton size="small" onClick={() => onRemove(editor.id, index)}>
          <MaterialIcon icon="delete" color="body" fontSize={18} />
        </IconButton>
      </div>
      {open && (
        <TransformationBuilder
          initialData={
            transformationsMap[transform] as
              | {
                  library: Record<string, unknown>;
                  operation: { name: string; value: string; parameters: unknown[] | null };
                  [key: string]: unknown;
                }[]
              | null
          }
          open={open}
          onClose={() => setOpen(false)}
          handleOk={(value: unknown) => onChange({ name: transform, value }, editor)}
        />
      )}
    </Box>
  );
});

export default Rule;
