import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { Input, InputLabel } from "@axelor/ui";
import { translate } from "../../../utils";
import styles from "./Checkbox.module.css";
import { useStore } from "../../../store";

export default function Checkbox({
  entry,
  element,
  checked,
  className,
  labelClassName,
  setDummyProperty = () => {},
}) {
  const { id, label, modelProperty, get, set } = entry || {};
  const [value, setValue] = useState(checked || false);
  const { update } = useStore();
  const updateValue = () => {
    setDummyProperty();
    setValue((value) => !value);
    set(element, { [modelProperty]: value });
    update((prevState) => ({
      ...prevState,
      execute: !prevState.execute,
    }));
  };

  useEffect(() => {
    if (!element || !get) return;
    const values = get && get(element);
    let value = values && values[modelProperty];
    setValue(value || false);
  }, [element, modelProperty, get]);

  return (
    <div className={classnames(styles.root, className)}>
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
          className={classnames(styles.label, labelClassName)}
        >
          {translate(label)}
        </InputLabel>
      )}
    </div>
  );
}
