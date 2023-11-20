import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/styles";

import { translate } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    marginTop: 5,
  },
  label: {
    fontWeight: "bolder",
    color: "#666",
    marginBottom: 0,
  },
  checkbox: {
    margin: "3px 3px 3px 0px",
  },
});

export default function Checkbox({
  entry,
  element,
  className,
  labelClassName,
}) {
  const classes = useStyles();
  const { id, label, modelProperty, get, set } = entry || {};
  const [value, setValue] = useState(false);

  const updateValue = () => {
    setValue((value) => !value);
    set(element, { [modelProperty]: value });
  };

  useEffect(() => {
    if (!element || !get) return;
    const values = get && get(element);
    let value = values && values[modelProperty];
    setValue(value || false);
  }, [element, modelProperty, get]);

  return (
    <div className={classnames(classes.root, className)}>
      <input
        id={`camunda-${id}`}
        type="checkbox"
        name={modelProperty}
        checked={value}
        onChange={updateValue}
        className={classes.checkbox}
      />
      {label && (
        <label
          htmlFor={`camunda-${id}`}
          className={classnames(classes.label, labelClassName)}
        >
          {translate(label)}
        </label>
      )}
    </div>
  );
}
