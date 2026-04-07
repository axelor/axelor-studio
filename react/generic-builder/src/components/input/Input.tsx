import React from "react";
import { Input } from "@axelor/ui";

import { translate } from "../../common/utils";

interface InputFieldProps {
  name?: string;
  title?: string;
  autoTitle?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  readOnly?: boolean;
  inline?: boolean;
  InputProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: unknown;
}

function InputField({
  name,
  title,
  _autoTitle,
  value = "",
  onChange,
  onBlur,
  readOnly = false,
  inline,
  _InputProps,
  style,
  ...other
}: InputFieldProps) {
  if (inline) {
    return (
      <Input
        type="text"
        style={{ width: "100%", ...style }}
        placeholder={translate(title || "")}
        name={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={readOnly}
        disabled={readOnly}
        value={value || ""}
      />
    );
  }
  return (
    <Input
      id={`filled-${name}`}
      type="text"
      name={name}
      style={{ width: "100%", ...style }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      value={value || ""}
      className={other.className}
    />
  );
}

export default InputField;
