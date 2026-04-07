import React, { useState, useCallback } from "react";
import { Input } from "@axelor/ui";

import { translate } from "../i18n/index";

interface NumberInputProps {
  type?: string;
  title?: string;
  onChange: (value: number) => void;
  value?: number;
  readOnly?: boolean;
  scale?: number;
  customeFormat?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
  disableUnderline?: boolean;
  [key: string]: unknown;
}

export function NumberInput({
  type = "integer",
  title,
  onChange,
  value = 0,
  readOnly = false,
  scale = 2,
  customeFormat: _customeFormat,
  onBlur: blur,
  className,
  disableUnderline: _disableUnderline,
  ...other
}: NumberInputProps) {
  const [val, setVal] = useState<number | string>(value);

  const formatValue = useCallback(
    (value: number | string) => Number(Number(value).toFixed(type === "integer" ? 0 : scale)),
    [type, scale],
  );

  React.useEffect(() => {
    setVal(formatValue(value));
  }, [value, setVal, formatValue]);

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    onChange(formatValue(val));
    setVal(formatValue(val));
    blur && blur(e);
  }

  return (
    <Input
      className={className}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
      placeholder={title ? translate(title) : undefined}
      type="number"
      value={`${val}`}
      onBlur={handleBlur}
      readOnly={readOnly}
      disabled={readOnly}
      {...other}
    />
  );
}
