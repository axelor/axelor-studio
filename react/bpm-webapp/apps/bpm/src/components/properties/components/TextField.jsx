import React, { useState, useEffect } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/styles";

import Description from "./Description";
import { translate } from "../../../utils";
import { Box, Button, Input, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  label: {
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
    display: "inline-block",
    verticalAlign: "middle",
    marginBottom: 3,
  },
  fieldWrapper: {
    position: "relative",
    flexGrow: 1,
  },
  clearButton: {
    background: "transparent",
    border: "none",
    height: 23,
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
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
        <InputLabel
          className={classnames(classes.label, labelClass)}
          color="body"
        >
          {translate(label)}
        </InputLabel>
      )}
      <div className={classes.fieldWrapper}>
        <Box d="flex" alignItems="center">
          <Input
            flex="1"
            id={`camunda-${modelProperty}_${Date()}`}
            type={type}
            readOnly={readOnly || disabled}
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
            disabled={readOnly || disabled}
            invalid={isError}
            className={className}
            style={{ textOverflow: "ellipsis" }}
            onBlur={(e) => updateProperty(e.target.value)}
          />
          {canRemove && !readOnly && (
            <Button
              onClick={handleClear}
              className={classnames(classes.clearButton, clearClassName)}
              style={{ visibility: value ? "visible" : "hidden" }}
            >
              <MaterialIcon icon="close" fontSize={16} />
            </Button>
          )}
          {endAdornment}
        </Box>
        {errorMessage && <Description desciption={errorMessage} type="error" />}
      </div>
      {description && <Description desciption={description} />}
    </div>
  );
}
