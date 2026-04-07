import React, { useState } from "react";

import { Selection, InputField } from "../../components";
import { getCustomModelData, getNameField, getData } from "../../services/data-service";
import { isBPMQuery } from "../../common/utils";

import styles from "./editor.module.css";

interface RenderRelationalWidgetProps {
  operator: string;
  editor?: unknown;
  internalProps: Record<string, unknown>;
  parentType?: string;
}

function RenderRelationalWidget(props: RenderRelationalWidgetProps) {
  const { operator, editor, internalProps, parentType } = props;
  const { onChange, value, ...rest } = internalProps as {
    onChange: (e: Record<string, unknown>, editor?: unknown) => void;
    value: unknown;
    [key: string]: unknown;
  };
  const { field = {} } = rest as { field?: Record<string, unknown> };
  const { targetName, target, targetModel, jsonTarget } = field as {
    targetName?: string;
    target?: string;
    targetModel?: string;
    jsonTarget?: string;
  };
  const [nameField, setNameField] = useState<string | null>(null);
  const fetchData = async () => {
    let data;
    if (jsonTarget) {
      data = await getCustomModelData(jsonTarget);
      const fieldData = await getNameField(jsonTarget);
      setNameField(fieldData && (fieldData.name as string) || null);
    } else {
      data = await getData((target || targetModel) as string);
    }
    return data;
  };
  if (["like", "notLike"].includes(operator)) {
    return (
      <InputField
        data-testid="render-relational-widget"
        name="fieldValue"
        onChange={(value: unknown) => {
          let isNameField;
          if (typeof value !== "string" && !isBPMQuery(parentType)) {
            isNameField =
              value && (value as Record<string, unknown>[]).length > 0
                ? value &&
                  (value as Record<string, unknown>[]).find(
                    (v: Record<string, unknown>) => v && targetName && v[targetName],
                  )
                : value && (value as Record<string, unknown>)[targetName || ""];
            onChange({ name: "nameField", value: isNameField ? nameField : "id" }, editor);
          }
          onChange({ name: "fieldValue", value: value }, editor);
        }}
        margin="none"
        style={{ marginTop: "15px", width: "250px !important" }}
        value={value as string}
        {...rest}
      />
    );
  } else if (["contains", "notContains", "in", "notIn", "=", "!="].includes(operator)) {
    const handleChange = (value: unknown) => {
      let isNameField;
      if (typeof value !== "string" && !isBPMQuery(parentType)) {
        isNameField = Array.isArray(value)
          ? (value as Record<string, unknown>[]).find(
              (v: Record<string, unknown>) => v && v[targetName || ""],
            )
          : value && (value as Record<string, unknown>)[targetName || ""];
        onChange({ name: "nameField", value: isNameField ? nameField : "id" }, editor);
      }
      onChange({ name: "fieldValue", value: value }, editor);
    };

    return (
      <Selection
        data-testid="render-relational-widget"
        name="fieldValue"
        title="Value"
        placeholder="Value"
        fetchAPI={fetchData}
        isMulti={
          (isBPMQuery(parentType) && ["contains", "notContains"].includes(operator)) ||
          ["=", "!="].includes(operator)
            ? false
            : true
        }
        optionLabelKey={targetName}
        onChange={(value: unknown) => handleChange(value)}
        value={(value as unknown[]) || []} // safety: value may be non-array, fallback to empty array
        handleRemove={(option: Record<string, unknown>) => {
          if (!option) return;
          const key = targetName || "id";
          handleChange(
            (value as Record<string, unknown>[])?.filter(
              (v: Record<string, unknown>) => v?.[key] !== option?.[key],
            ),
          );
        }}
        classes={{ root: styles.MuiAutocompleteRoot }}
      />
    );
  } else {
    return null;
  }
}

export default RenderRelationalWidget;
