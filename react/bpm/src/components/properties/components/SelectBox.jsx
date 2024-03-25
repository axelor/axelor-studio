import React, { useState, useEffect } from "react";

import { translate } from "../../../utils";
import Description from "./Description";
import { Box, InputLabel, Select } from "@axelor/ui";
import styles from "./SelectBox.module.css";

export default function SelectBox({ entry, element }) {
  const {
    id,
    selectOptions,
    label,
    modelProperty,
    description,
    set,
    get,
    getProperty,
    setProperty,
    disabled = false,
  } = entry || {};
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleChange = (updatedValue) => {
    setSelectedOption(updatedValue);
    const { value = "" } = updatedValue || {};
    if (!set && !setProperty) return;
    if (set) {
      set(element, {
        [modelProperty]: value,
      });
    } else {
      setProperty(element, {
        [modelProperty]: value,
      });
    }
  };

  useEffect(() => {
    if (!element) return;
    const values = get && get(element);
    let value = getProperty
      ? getProperty(element)
      : values && values[modelProperty];
    setSelectedOption(options?.find((o) => o.value === value) || null);
  }, [element, modelProperty, get, options, getProperty]);

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
    <Box className={styles.root}>
      <InputLabel
        htmlFor={`camunda-${id}`}
        color="body"
        className={styles.label}
      >
        {translate(label)}
      </InputLabel>
      <Select
        placeholder={translate("Select a value")}
        options={options}
        onChange={handleChange}
        optionKey={(x) => x.value}
        optionLabel={(x) => x.name}
        optionEqual={(o, v) => o.value === v.value}
        value={selectedOption}
        disabled={disabled}
      />
      {description && <Description desciption={description} />}
    </Box>
  );
}
