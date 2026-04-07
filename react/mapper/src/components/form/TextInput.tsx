import React from "react";
import { Input } from "@axelor/ui";

import { translate } from "../../utils";

interface InputFieldProps {
  name?: string;
  title?: string;
  autoTitle?: string;
  value?: string;
  onChange?: (value: unknown) => void;
  onBlur?: (e: unknown) => void;
  readOnly?: boolean;
  inline?: boolean;
  InputProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  error?: boolean;
  minRows?: number;
  className?: string;
  field?: { defaultValue?: string; [key: string]: unknown };
  [key: string]: unknown;
}

function InputField({
  name,
  title,
  autoTitle,
  value = "",
  _onChange,
  onBlur,
  readOnly = false,
  inline,
  _InputProps,
  style,
  error,
  _minRows = 3,
  ...other
}: InputFieldProps) {
  const [text, setText] = React.useState<string | undefined>();
  const { field } = other || {};
  const showError = !text || text === field?.defaultValue || text.trim() === "";

  React.useEffect(() => {
    setText(value);
  }, [value]);

  if (inline) {
    return (
      <Input
        style={{ width: "100%", ...style }}
        placeholder={translate(title || "")}
        name={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => onBlur?.(e.target.value)}
        autoComplete="off"
        readOnly={readOnly}
        disabled={readOnly}
        value={text || ""}
        {...other}
        invalid={!!error && showError}
      />
    );
  }
  return (
    <Input
      placeholder={translate(title || autoTitle || "")}
      name={name}
      style={{ width: "100%", ...style }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
      onBlur={onBlur}
      autoComplete="off"
      readOnly={readOnly}
      value={text || ""}
      className={other.className}
      {...other}
      invalid={!!error && showError}
    />
  );
}

export default InputField;
