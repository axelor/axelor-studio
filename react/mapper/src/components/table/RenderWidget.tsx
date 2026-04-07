import React from "react";
import dayjs from "dayjs";
import { DateTimePicker } from "@studio/shared/components";

import { Selection, Select, NumberInput as NumberField, TextInput as InputField } from "../form";
import {
  getData,
  getCustomModelByDomain,
  getNameFieldByDomain,
  getCustomModelData,
} from "../../services/mapper-service";
import { translate, DATE_FORMAT } from "../../utils";
import type { BuilderField } from "../../utils";

function getRequiredField(builderFields: BuilderField[], row: BuilderField): boolean | undefined {
  if (!row?.required) {
    return;
  }
  const key = builderFields.find((f) => f.name === row.name)?.key;
  return builderFields.find((f) => f.name === row.name && row.key === key)?.required;
}

interface RenderRelationalWidgetProps {
  operator?: string;
  internalProps: Record<string, unknown>;
  parentType?: string;
}

function RenderRelationalWidget(props: RenderRelationalWidgetProps) {
  const { internalProps } = props;
  const { onChange, value, ...rest } = internalProps;
  const { field = {}, error = false } = rest as Record<string, unknown>;
  const fieldObj = field as Record<string, unknown>;
  const { targetName, target, targetModel } = fieldObj;
  const [nameField, setNameField] = React.useState<string | null>(null);
  const fetchData = async () => {
    let data: Record<string, unknown>[] = [];
    if (target === "com.axelor.meta.db.MetaJsonRecord" && fieldObj["domain"]) {
      data = await getCustomModelByDomain(fieldObj["domain"] as string);
      const fieldData = await getNameFieldByDomain(fieldObj["jsonTarget"] as string);
      setNameField((fieldData && (fieldData.name as string)) || null);
    } else if (fieldObj.targetJsonModel) {
      data = await getCustomModelData(fieldObj["targetJsonModel.name"] as string);
    } else {
      data = await getData((target || targetModel) as string);
    }
    return data;
  };
  const _value =
    value && (value as Record<string, unknown>)._selectId
      ? { ...(value as Record<string, unknown>), id: (value as Record<string, unknown>)._selectId }
      : value;
  return (
    <Selection
      name="fieldValue"
      placeholder="Value"
      fetchAPI={fetchData}
      isMulti={false}
      error={error as boolean}
      optionValueKey={targetName as string}
      optionLabelKey={targetName as string}
      onChange={(value: unknown) => {
        (onChange as (val: Record<string, unknown>) => void)({
          name: "fieldValue",
          value: value,
          nameField,
        });
      }}
      value={_value || null}
    />
  );
}

interface RenderSimpleWidgetProps {
  Component: React.ComponentType<Record<string, unknown>>;
  operator?: string;
  internalProps: Record<string, unknown>;
}

function RenderSimpleWidget(props: RenderSimpleWidgetProps) {
  const { Component, internalProps } = props;
  const { onChange, value, _value2, _classes, style, _targetName, ...rest } = internalProps;
  const { error = false } = rest;
  const showError = !value || (typeof value === "string" && value.trim() === "");
  return (
    <Component
      name="fieldValue"
      onChange={(value: unknown) =>
        (onChange as (val: Record<string, unknown>) => void)({ name: "fieldValue", value: value })
      }
      value={value}
      style={style}
      error={error && showError}
      {...rest}
    />
  );
}

interface RenderWidgetProps {
  type: string;
  operator?: string;
  onChange: (change: Record<string, unknown>, index?: unknown) => void;
  value: { fieldValue: unknown; fieldValue2: unknown };
  classes?: Record<string, string>;
  parentType?: string;
  row?: BuilderField;
  error?: boolean;
  field?: Record<string, unknown>;
  [key: string]: unknown;
}

const RenderWidget = React.memo(function RenderWidgetMemo({
  type,
  operator = "=",
  onChange,
  value,
  classes,
  parentType,
  ...rest
}: RenderWidgetProps) {
  const props = {
    value: value.fieldValue,
    value2: value.fieldValue2,
    onChange,
    ...rest,
  };
  const { error = false } = rest;

  let options: { name: unknown; title: string }[] | undefined | null | false;
  let widgetProps: RenderSimpleWidgetProps;
  switch (type) {
    case "one_to_one":
    case "many_to_one":
    case "many_to_many":
    case "one_to_many":
    case "json_one_to_one":
    case "json_many_to_one":
    case "json_many_to_many":
    case "json_one_to_many":
      return (
        <RenderRelationalWidget
          operator={operator}
          internalProps={{ ...props, value: value.fieldValue }}
          parentType={parentType}
        />
      );
    case "date":
    case "time":
    case "datetime":
      return (
        <RenderSimpleWidget
          Component={DateTimePicker as unknown as React.ComponentType<Record<string, unknown>>} // safety: @axelor/ui DateTimePicker props differ from generic Component type
          operator={operator}
          internalProps={{
            type,
            value: value.fieldValue || "",
            onChange: ({ name, value: val }: Record<string, unknown>, index: unknown) => {
              return onChange(
                {
                  name: name as string,
                  value: val && dayjs(val as string).format(DATE_FORMAT[type]),
                },
                index,
              );
            },
            ...rest,
            margin: "none",
            classes,
            style: { width: "250px !important" },
          }}
        />
      );
    case "integer":
    case "long":
    case "decimal":
      options = (rest.field as Record<string, unknown>)?.selectionList
        ? (
            (rest.field as Record<string, unknown>).selectionList as Array<{
              title: string;
              value: unknown;
              data?: { value: unknown };
            }>
          ).map(({ title, value, data }) => ({
            name: (data && data.value) || value,
            title: title,
          }))
        : null;

      widgetProps = {
        Component: (options ? Select : NumberField) as unknown as React.ComponentType< // safety: @axelor/ui component props differ from generic Component type
          Record<string, unknown>
        >,
        operator,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                type,
                ...props,
                margin: "none",
                classes,
                style: { width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
    case "enum":
      options = (
        (rest.field as Record<string, unknown>).selectionList as Array<{
          title: string;
          value: unknown;
          data?: { value: unknown };
        }>
      ).map(({ title, value, data }) => ({
        name: (data && data.value) || value,
        title: title,
      }));
      return (
        <RenderSimpleWidget
          Component={Select as unknown as React.ComponentType<Record<string, unknown>>} // safety: @axelor/ui Select props differ from generic Component type
          operator={operator}
          internalProps={{
            options,
            classes,
            ...props,
          }}
        />
      );
    case "boolean": {
      const booleanOptions = [
        { title: translate("Yes"), value: true },
        { title: translate("No"), value: false },
      ];
      return (
        <Selection
          optionLabelKey="title"
          optionValueKey="value"
          error={error}
          options={booleanOptions}
          value={booleanOptions.find((b) => b.value === value.fieldValue)}
          onChange={(e: Record<string, unknown> | null) => onChange({ value: e?.value })}
        />
      );
    }
    default:
      options =
        rest.field && (rest.field).selectionList
          ? (
              (rest.field).selectionList as Array<{
                title: string;
                value: unknown;
                data?: { value: unknown };
              }>
            ).map(({ title, value, data }) => ({
              name: (data && data.value) || value,
              title: title,
            }))
          : null;
      widgetProps = {
        Component: (options ? Select : InputField) as unknown as React.ComponentType< // safety: @axelor/ui Select props differ from generic Component type
          Record<string, unknown>
        >,
        operator,
        internalProps: {
          ...(options
            ? {
                options,
                classes,
                ...props,
                value: value.fieldValue,
                className: classes?.input,
              }
            : {
                classes,
                ...props,
                onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
                  props.onChange(e.target as unknown as Record<string, unknown>), // safety: DOM event target shape differs from onChange parameter type
                margin: "none",
                style: { width: "100%" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
  }
});

export { RenderWidget };
export { getRequiredField };
