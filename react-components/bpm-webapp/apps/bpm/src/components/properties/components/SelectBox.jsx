import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/styles";

import { translate } from "../../../utils";
import Description from "./Description";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
});

export default function SelectBox({ entry, element }) {
  const classes = useStyles();
  const {
    id,
    emptyParameter,
    selectOptions,
    canBeDisabled,
    canBeHidden,
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

  const handleChange = (e) => {
    setSelectedOption(e.target.value);
    if (!set && !setProperty) return;
    if (set) {
      set(element, {
        [modelProperty]: e.target.value,
      });
    } else {
      setProperty(element, {
        [modelProperty]: e.target.value,
      });
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
    <div className={classes.root}>
      <label htmlFor={`camunda-${id}`} className={classes.label}>
        {translate(label)}
      </label>
      <select
        id={`camunda-${id}-select`}
        name={modelProperty}
        data-disable={canBeDisabled ? "isDisabled" : ""}
        data-show={canBeHidden ? "isHidden" : ""}
        value={selectedOption || ""}
        onChange={handleChange}
        disabled={disabled}
      >
        {options &&
          options.map((option, index) => (
            <option value={option.value} key={index}>
              {option.name ? option.name : ""}{" "}
            </option>
          ))}
        {emptyParameter && <option value=""></option>}
      </select>
      {description && <Description desciption={description} />}
    </div>
  );
}
