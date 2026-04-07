import React from "react";
import classnames from "classnames";
import { Input } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

interface InputFieldProps {
  name?: string;
  title?: string;
  autoTitle?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler;
  readOnly?: boolean;
  inline?: boolean;
  InputProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  disableUnderline?: boolean;
  className?: string;
  minRows?: number;
  [key: string]: unknown;
}

function InputField({
  name,
  title,
  autoTitle,
  value = "",
  onChange,
  onBlur,
  readOnly = false,
  inline,
  _InputProps,
  style,
  _disableUnderline = false,
  className,
  _minRows = 3,
  ..._other
}: InputFieldProps) {
  if (inline) {
    return (
      <Input
        style={{ width: "100%", ...style }}
        className={className}
        placeholder={translate(title ?? "")}
        aria-label={title}
        name={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        onBlur={onBlur}
        autoComplete="off"
        readOnly={readOnly}
        disabled={readOnly}
        value={value || ""}
      />
    );
  }
  return (
    <Input
      type="text"
      id={`filled-${name}`}
      placeholder={translate(title || autoTitle || "")}
      name={name}
      style={{ width: "100%", ...style }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
      onBlur={onBlur}
      disabled={readOnly}
      readOnly={readOnly}
      autoComplete="off"
      value={value || ""}
      className={classnames(className)}
    />
  );
}

export default InputField;
