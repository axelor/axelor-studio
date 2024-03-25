import React, { useState, useEffect } from "react";
import Description from "./Description";
import { translate } from "../../utils";
import { Box, InputLabel, Select } from "@axelor/ui";

export default function SelectBox({ entry, element }) {
  const {
    id,
    name,
    selectOptions,
    canBeDisabled,
    canBeHidden,
    label,
    modelProperty,
    description,
    set,
    get,
  } = entry || {};
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const value = options.find((val) => val.value === selectedOption);
  const setProperty = (value) => {
    element.businessObject[name] = value;
  };

  const getProperty = React.useCallback(() => {
    return element.businessObject[name];
  }, [element, name]);

  const handleChange = (e) => {
    setSelectedOption(e?.value);
    if (!set && !setProperty) return;
    if (set) {
      set(element, {
        [modelProperty]: e?.value,
      });
    } else {
      setProperty(e?.value);
    }
  };

  useEffect(() => {
    if (!element) return;
    const values = get && get(element);
    let value = getProperty
      ? getProperty(element)
      : values && values[modelProperty];
    setSelectedOption(value);
  }, [element, modelProperty, get, getProperty]);

  useEffect(() => {
    if (typeof selectOptions === "object") {
      setOptions(selectOptions);
    } else {
      let dynamicOptions = selectOptions(element);
      if (dynamicOptions) {
        setOptions(dynamicOptions);
      }
    }
  }, [selectOptions, element]);

  return (
    <Box d="flex" flexDirection="column">
      <InputLabel htmlFor={`camunda-${id}`}>{translate(label)}</InputLabel>
      <Select
        optionLabel={(op) => op.name}
        optionKey={(op) => op.name}
        options={options}
        onChange={handleChange}
        value={value || ""}
      />
      {description && <Description desciption={description} />}
    </Box>
  );
}
