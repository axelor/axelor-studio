import React from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Selection, IconButton, Tooltip } from "../../components";
import { translate } from "../../common/utils";

import styles from "./editor.module.css";

export interface RenderSimpleWidgetProps {
  Component: React.ComponentType<Record<string, unknown>>;
  operator: string;
  editor?: unknown;
  internalProps: Record<string, unknown>;
  handleOpen?: (key: string) => void;
  [key: string]: unknown;
}

function RenderSimpleWidget(props: RenderSimpleWidgetProps) {
  const { Component, operator, editor, internalProps, handleOpen } = props;
  const { onChange, value, value2, _classes, style, targetName, ...rest } = internalProps as {
    onChange: (e: Record<string, unknown>, editor?: unknown) => void;
    value: unknown;
    value2: unknown;
    classes?: Record<string, string>;
    style?: React.CSSProperties;
    targetName?: string;
    [key: string]: unknown;
  };
  if (["=", "!=", ">", ">=", "<", "<=", "like", "notLike"].includes(operator)) {
    return (
      <Component
        data-testid="render-simple-widget"
        name="fieldValue"
        onChange={(value: unknown) => onChange({ name: "fieldValue", value }, editor)}
        value={value}
        style={style}
        {...rest}
      />
    );
  } else if (["between", "notBetween"].includes(operator)) {
    return (
      <React.Fragment>
        <Component
          data-testid="render-simple-widget"
          name="fieldValue"
          style={{ marginRight: 8, ...style }}
          onChange={(value: unknown) => onChange({ name: "fieldValue", value }, editor)}
          value={value}
          {...rest}
        />
        <React.Fragment>
          <IconButton size="small" className={styles.iconButton}>
            <Tooltip title={translate("Add Data transformation")}>
              <MaterialIcon
                icon="calculate"
                color="body"
                fontSize={18}
                onClick={() => {
                  handleOpen?.("valueTransformations");
                }}
              />
            </Tooltip>
          </IconButton>
        </React.Fragment>
        <Component
          name="fieldValue2"
          onChange={(value: unknown) => onChange({ name: "fieldValue2", value: value }, editor)}
          value={value2}
          style={style}
          {...rest}
        />
        <React.Fragment>
          <IconButton size="small" className={styles.iconButton}>
            <Tooltip title={translate("Add Data transformation")}>
              <MaterialIcon
                icon="calculate"
                color="body"
                fontSize={18}
                onClick={() => {
                  handleOpen?.("valueTransformations2");
                }}
              />
            </Tooltip>
          </IconButton>
        </React.Fragment>
      </React.Fragment>
    );
  } else if (["in", "notIn"].includes(operator)) {
    return (
      <Selection
        data-testid="render-simple-widget"
        name="fieldValue"
        title="Value"
        placeholder="Value"
        isMulti={true}
        optionLabelKey={targetName}
        onChange={(val: unknown) => {
          onChange({ name: "fieldValue", value: val }, editor);
        }}
        value={(value as unknown[]) || []} // safety: value may be non-array, fallback to empty array
        classes={{ root: styles.MuiAutocompleteRoot }}
        optionValueKey="name"
        handleRemove={(option: Record<string, unknown>) => {
          if (!option) return;
          onChange(
            {
              name: "fieldValue",
              value: (value as Record<string, unknown>[])?.filter(
                (v: Record<string, unknown>) =>
                  v[targetName || "name"] !== option[targetName || "name"],
              ),
            },
            editor,
          );
        }}
        {...rest}
      />
    );
  } else {
    return null;
  }
}

export default RenderSimpleWidget;
