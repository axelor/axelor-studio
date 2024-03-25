import React, { useEffect, useState } from "react";
import { getBool, translate } from "../../utils";
import { Box, Input, InputLabel } from "@axelor/ui";

export default function Checkbox({ entry, element, className }) {
  const {
    id,
    name,
    label,
    modelProperty,
    get,
    set,
    defaultValue = false,
  } = entry || {};
  const [value, setValue] = useState(defaultValue);

  const setProperty = React.useCallback(
    (value) => {
      element.businessObject[name] = value.toString();
    },
    [element, name]
  );

  const getProperty = React.useCallback(() => {
    return getBool(
      element.businessObject[name] || element.businessObject.$attrs[name]
    );
  }, [element, name]);

  const updateValue = (e) => {
    setValue((value) => !value);
    if (set) {
      set(element, {
        [modelProperty]: e.target.checked,
      });
    } else {
      setProperty(e.target.checked);
    }
  };

  useEffect(() => {
    if (!element) return;
    let value;
    if (get) {
      const values = get(element);
      value = values && values[modelProperty];
    } else {
      value = getProperty();
      setProperty(value);
    }
    setValue(value);
  }, [element, modelProperty, get, getProperty, setProperty]);

  return (
    <Box d="flex" gap={4}>
      <Input
        id={`camunda-${id}`}
        type="checkbox"
        name={modelProperty}
        checked={value}
        onChange={updateValue}
      />
      {label && (
        <InputLabel htmlFor={`camunda-${id}`}>{translate(label)}</InputLabel>
      )}
    </Box>
  );
}
