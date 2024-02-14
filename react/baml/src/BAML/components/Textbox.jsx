import React, { useEffect, useState } from "react";
import { translate } from "../../utils";
import { Box, TextField } from "@axelor/ui";

export default function Textbox({
  entry,
  element,
  rows = 1,
  bpmnModeler,
  className,
  readOnly,
}) {
  const { label, description, name, validate, get, set } = entry || {};
  const [value, setValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);

  const setProperty = (value) => {
    if (set) {
      set(element, {
        [name]: value,
      });
      setValue(value);
    } else {
      const modeling = bpmnModeler.get("modeling");
      modeling.updateProperties(element, {
        [name]: value,
      });
    }
  };

  const getProperty = React.useCallback(() => {
    if (get) {
      const values = get(element);
      return values[name];
    }
    return element.businessObject[name];
  }, [element, get, name]);

  const updateProperty = (value) => {
    setProperty(value);
    setValue(value);
    const isError = getValidation();
    setError(isError);
  };

  const getValidation = React.useCallback(() => {
    if (
      !validate ||
      ((value === null || value === undefined) && name === "id")
    ) {
      setErrorMessage(null);
      return false;
    }
    let valid = validate(element, {
      [name]: value === "" ? undefined : value,
    });
    if (valid && valid[name]) {
      setErrorMessage(valid[name]);
      return true;
    } else {
      setErrorMessage(null);
      return false;
    }
  }, [validate, element, value, name]);

  useEffect(() => {
    const isError = getValidation();
    setError(isError);
  }, [getValidation]);

  useEffect(() => {
    if (!element) return;
    let value = getProperty(element);
    setValue(value);
  }, [element, getProperty, entry]);

  return (
    <Box
      d="flex"
      style={{ width: "100%" }}
      flexDirection="column"
      mt={1}
      className={className}
    >
      <TextField
        style={{ height: "20px" }}
        id={`camunda_${name}_${Date()}`}
        as="textarea"
        value={value || ""}
        minRows={rows}
        label={translate(label)}
        onBlur={(e) => {
          if (!readOnly) {
            updateProperty(e.target.value);
          }
        }}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        readOnly={typeof readOnly === "function" ? readOnly() : readOnly}
        disabled={typeof readOnly === "function" ? readOnly() : readOnly}
        invalid={errorMessage}
        description={description}
      />
    </Box>
  );
}
