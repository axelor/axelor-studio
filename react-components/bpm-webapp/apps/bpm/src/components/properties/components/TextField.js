import React, { useState, useEffect } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/styles";
import { Close } from "@material-ui/icons";

import Description from "./Description";
import { translate } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
    width: "100%",
  },
  error: {
    borderColor: "#cc3333 !important",
    background: "#f0c2c2",
    "&:focus": {
      boxShadow: "rgba(204,58,51, 0.2) 0px 0px 1px 2px !important",
      outline: "none",
      borderColor: "#cc3333 !important",
    },
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
  fieldWrapper: {
    position: "relative",
    flexGrow: 1,
  },
  input: {
    flexGrow: 1,
    padding: "3px 28px 3px 6px ",
    border: "1px solid #ccc",
    minWidth: 0,
    "&:focus": {
      boxShadow: "rgba(82, 180, 21, 0.2) 0px 0px 1px 2px",
      outline: "none",
      borderColor: "rgb(82, 180, 21)",
    },
  },
  clearButton: {
    marginLeft: 5,
    background: "transparent",
    border: "none",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  clear: {
    fontSize: "1rem",
  },
  readOnly: {
    borderColor: "#ccc !important",
    background: "#E3E3E3",
    color: "#7E7E7E",
    "&:focus": {
      boxShadow: "none !important",
      outline: "none",
      borderColor: "#ccc !important",
      color: "#7E7E7E",
    },
  },
});

export default function TextField({
  entry,
  element,
  canRemove = false,
  rootClass,
  labelClass,
  type = "text",
  isLabel = true,
  readOnly = false,
  clearClassName,
  disabled = false,
  showError,
  isDefinition = false,
  className,
  endAdornment,
}) {
  const classes = useStyles();
  const {
    label,
    description,
    modelProperty,
    set,
    get,
    setProperty,
    getProperty,
    validate,
  } = entry || {};
  const [value, setValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);

  const updateProperty = (value) => {
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
    const isError = getValidation();
    setError(isError);
  };

  const handleClear = () => {
    setValue("");
    const isError = getValidation();
    setError(isError);
    if (!isError) {
      updateProperty("");
    }
  };

  const getValidation = React.useCallback(() => {
    if (
      !validate ||
      ((value === null || value === undefined) && modelProperty === "id")
    ) {
      setErrorMessage(null);
      return false;
    }
    let valid = validate(element, {
      [modelProperty]: value === "" ? undefined : value,
    });
    if (valid && valid[modelProperty]) {
      setErrorMessage(valid[modelProperty]);
      return true;
    } else {
      setErrorMessage(null);
      return false;
    }
  }, [validate, element, value, modelProperty]);

  useEffect(() => {
    const checkValidation = () => {
      const isError = getValidation();
      setError(isError);
    };
    if (isDefinition) {
      if (showError) {
        checkValidation();
      } else {
        setErrorMessage(null);
        setError(false);
      }
    } else {
      checkValidation();
    }
  }, [getValidation, showError, isDefinition]);

  useEffect(() => {
    if (!element) return;
    const values = get && get(element);
    let value = getProperty
      ? getProperty(element)
      : values && values[modelProperty];
    setValue(value);
  }, [element, modelProperty, get, getProperty]);

  return (
    <div className={classnames(classes.root, rootClass)}>
      {isLabel && (
        <label className={classnames(classes.label, labelClass)}>
          {translate(label)}
        </label>
      )}
      <div className={classes.fieldWrapper}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            id={`camunda-${modelProperty}_${Date()}`}
            type={type}
            readOnly={readOnly}
            name={modelProperty}
            value={value || ""}
            onChange={(e) => {
              if (modelProperty === "code") {
                setValue(e.target.value && e.target.value.toUpperCase());
                return;
              }
              if (type === "number") {
                setValue(e.target.value && parseInt(e.target.value));
                return;
              }
              setValue(e.target.value);
            }}
            disabled={disabled}
            className={classnames(
              classes.input,
              isError && classes.error,
              readOnly && classes.readOnly,
              className
            )}
            onBlur={(e) => updateProperty(e.target.value)}
          />
          {canRemove && !readOnly && (
            <button
              onClick={handleClear}
              className={classnames(classes.clearButton, clearClassName)}
              style={{ visibility: value ? "visible" : "hidden" }}
            >
              <Close className={classes.clear} />
            </button>
          )}
          {endAdornment}
        </div>
        {errorMessage && <Description desciption={errorMessage} type="error" />}
      </div>
      {description && <Description desciption={description} />}
    </div>
  );
}
