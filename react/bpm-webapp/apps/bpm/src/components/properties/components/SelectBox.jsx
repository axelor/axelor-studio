import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/styles";

import { translate } from "../../../utils";
import Description from "./Description";
import { Box, InputLabel, Select } from "@axelor/ui";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
  },
  label: {
    display: "inline-block",
    verticalAlign: "middle",
    marginBottom: 3,
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
  },
});

export default function SelectBox({ entry, element }) {
  const classes = useStyles();
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
    <Box className={classes.root}>
      <InputLabel
        htmlFor={`camunda-${id}`}
        color="body"
        className={classes.label}
      >
        {translate(label)}
      </InputLabel>
      <Select
        placeholder="Select a value"
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
