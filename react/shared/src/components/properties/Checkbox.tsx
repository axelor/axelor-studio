import React, { useEffect, useState } from "react";
import { Input, InputLabel, clsx } from "@axelor/ui";

import { translate } from "../../i18n/index";

import styles from "./checkbox.module.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProp = any;
interface CheckboxProps {
  entry?: AnyProp;
  element?: AnyProp;
  checked?: boolean;
  className?: string;
  labelClassName?: string;
  onExecute?: () => void;
}

export default function Checkbox({
  entry,
  element,
  checked,
  className,
  labelClassName,
  onExecute,
}: CheckboxProps) {
  const { id, label, modelProperty, get, set } = entry || {};
  const [value, setValue] = useState(checked || false);

  const updateValue = () => {
    setValue((value) => !value);
    set(element, { [modelProperty]: value });
    if (onExecute) {
      onExecute();
    }
  };

  useEffect(() => {
    if (!element || !get) return;
    const values = get && get(element);
    const value = values && values[modelProperty];
    setValue(value || false);
  }, [element, modelProperty, get]);

  return (
    <div className={clsx(styles.root, className)}>
      <Input
        id={`camunda-${id}`}
        type="checkbox"
        name={modelProperty}
        checked={value}
        onChange={updateValue}
        className={styles.checkbox}
        color="body"
      />
      {label && (
        <InputLabel
          htmlFor={`camunda-${id}`}
          color="body"
          className={clsx(styles.label, labelClassName)}
        >
          {translate(label)}
        </InputLabel>
      )}
    </div>
  );
}
