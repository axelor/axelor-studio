import React from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import {  Select, DateTimePicker, NumberField, InputField } from "../../components";
import { DATE_FORMAT } from "../../common/constants";

import RenderRelationalWidget from "./RenderRelationalWidget";
import RenderSimpleWidget, { type RenderSimpleWidgetProps } from "./RenderSimpleWidget";
type RelationalFieldType =
  | "one_to_one"
  | "many_to_one"
  | "many_to_many"
  | "one_to_many"
  | "json_one_to_one"
  | "json_many_to_one"
  | "json_many_to_many"
  | "json_one_to_many";
type DateFieldType = "date" | "time" | "datetime";
type NumericFieldType = "integer" | "long" | "decimal";
type FieldType =
  | RelationalFieldType
  | DateFieldType
  | NumericFieldType
  | "enum"
  | (string & {});

export const getValue = (val: unknown): string | undefined => {
  if (val && typeof val === "string") {
    const values = val.toString().split(".");
    if (values && values.length > 1) {
      return values.slice(1).join(".");
    } else {
      return val;
    }
  } else {
    return;
  }
};

interface RenderWidgetProps {
  type: FieldType;
  operator: string;
  onChange: (e: Record<string, unknown>, editor?: unknown, index?: number) => void;
  value: { fieldValue: unknown; fieldValue2: unknown };
  classes: Record<string, string>;
  parentType?: string;
  editor?: unknown;
  handleOpen?: (key: string) => void;
  field?: Record<string, unknown>;
  [key: string]: unknown;
}

function RenderWidget({
  type,
  operator,
  onChange,
  value,
  classes,
  parentType,
  editor,
  handleOpen,
  ...rest
}: RenderWidgetProps) {
  const props = {
    value: value.fieldValue,
    value2: value.fieldValue2,
    onChange,
    ...rest,
  };

  let options: Record<string, unknown>[] | undefined | false, widgetProps: RenderSimpleWidgetProps;
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
          editor={editor}
          internalProps={{ ...props }}
          parentType={parentType}
        />
      );
    case "date":
    case "time":
    case "datetime":
      const stringToDate = (value: unknown) =>
        value ? dayjs(value as string, DATE_FORMAT[type]) : null;
      return (
        <RenderSimpleWidget
          Component={DateTimePicker}
          operator={operator}
          editor={editor}
          handleOpen={handleOpen}
          internalProps={{
            type,
            value: stringToDate(value.fieldValue),
            value2: stringToDate(value.fieldValue2),
            onChange: (
              {
                name,
                value: val,
              }: { name: string; value: { format: (fmt: string) => string } | null },
              index: number,
            ) => onChange({ name, value: val && val.format(DATE_FORMAT[type]) }, index),
            ...rest,
            margin: "none",
            classes,
            style: { marginTop: "15px", width: "250px !important" },
          }}
        />
      );
    case "integer":
    case "long":
    case "decimal":
      options =
        !!(rest.field)?.selectionList &&
        (
          (rest.field).selectionList as Array<Record<string, unknown>>
        ).map(({ title, value, data }) => ({
          name:
            ((data as Record<string, unknown>) && (data as Record<string, unknown>).value) || value,
          title: title,
        }));

      widgetProps = {
        Component: (options ? Select : NumberField) as unknown as React.ComponentType< // safety: @axelor/ui component props differ from generic Component type
          Record<string, unknown>
        >,
        handleOpen,
        operator,
        editor,
        internalProps: {
          ...(options
            ? {
                options,
                classes,
                ...props,
              }
            : {
                type,
                ...props,
                margin: "none",
                classes,
                style: { marginTop: "15px", width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
    case "enum":
      options = (
        (rest.field as Record<string, unknown>).selectionList as Array<Record<string, unknown>>
      ).map(({ title, value, data }) => ({
        name:
          ((data as Record<string, unknown>) && (data as Record<string, unknown>).value) || value,
        title: title,
      }));
      return (
        <RenderSimpleWidget
          Component={Select as unknown as React.ComponentType<Record<string, unknown>>} // safety: @axelor/ui Select props differ from generic Component type
          operator={operator}
          editor={editor}
          handleOpen={handleOpen}
          internalProps={{
            options,
            classes,
            ...props,
          }}
        />
      );
    default:
      options =
        (rest.field) &&
        ((rest.field).selectionList as
          | Array<Record<string, unknown>>
          | undefined) &&
        (
          (rest.field).selectionList as Array<Record<string, unknown>>
        ).map(({ title, value, data }) => ({
          name:
            ((data as Record<string, unknown>) && (data as Record<string, unknown>).value) || value,
          title: title,
        }));
      widgetProps = {
        Component: (options ? Select : InputField) as unknown as React.ComponentType< // safety: @axelor/ui Select props differ from generic Component type
          Record<string, unknown>
        >,
        operator,
        editor,
        handleOpen,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                classes,
                ...props,
                margin: "none",
                style: { marginTop: "15px", width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
  }
}

export default RenderWidget;
