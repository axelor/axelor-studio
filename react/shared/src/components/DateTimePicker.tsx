import React from "react";
import { Input, InputFeedback } from "@axelor/ui";

import { translate } from "../i18n/index";

const FORMAT_MAP: Record<string, string> = {
  datetime: "YYYY-MM-DDTHH:mm",
  date: "YYYY-MM-DD",
  time: "HH:mm",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatValue(value: any, type: string): string {
  if (!value) return "";
  // If value has a .format method (moment object), format it for HTML input
  if (value && typeof value === "object" && typeof value.format === "function") {
    return value.format(FORMAT_MAP[type] || FORMAT_MAP.date);
  }
  return value;
}

interface DateTimePickerProps {
  inline?: boolean;
  type?: string;
  className?: string;
  name?: string;
  title?: string;
  format?: string;
  error?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  disableUnderline?: boolean;
  [key: string]: unknown;
}

export function DateTimePicker({
  inline,
  type = "date",
  className,
  ...props
}: DateTimePickerProps) {
  const {
    name,
    title,
    error,
    onChange,
    value,
    disableUnderline: _disableUnderline,
    ...other
  } = props;

  return (
    <>
      <Input
        name={name}
        type={type === "datetime" ? "datetime-local" : type}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e?.target?.value)}
        className={className}
        w={100}
        invalid={error}
        value={formatValue(value, type)}
        style={{
          padding: "0.375rem 0.75rem",
          ...(inline ? { margin: 0 } : {}),
        }}
        placeholder={inline ? "" : translate(title ?? "")}
        rounded
        {...other}
      />
      {error && !inline && <InputFeedback invalid>Invalid date</InputFeedback>}
    </>
  );
}
