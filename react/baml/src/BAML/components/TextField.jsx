import React, { useState, useEffect } from "react";
import { translate } from "../../utils";
import { Box, TextField } from "@axelor/ui";

export default function TextFieldInput({
  entry,
  element,
  canRemove = false,
  type = "text",
  isLabel = true,
  readOnly = false,
  bpmnModeler,
}) {
  const { label, description, name, modelProperty, set, get } = entry || {};
  const [value, setValue] = useState(null);

  const setProperty = (value) => {
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get("modeling");
    modeling.updateProperties(element, {
      [name]: value,
    });
  };

  const getProperty = React.useCallback(() => {
    return element.businessObject[name];
  }, [element, name]);

  const updateProperty = (value) => {
    if (set) {
      set(element, {
        [modelProperty]: value,
      });
    } else {
      setProperty(value);
    }
  };

  const handleClear = () => {
    setValue("");
    updateProperty(undefined);
  };

  useEffect(() => {
    if (!element) return;
    let value;
    if (get) {
      const property = get();
      value = property && property[modelProperty];
    } else {
      value = getProperty();
    }
    setValue(value);
  }, [element, get, getProperty, modelProperty]);

  return (
    <Box mt={2}>
      <TextField
        id={`camunda-${name}_${Date()}`}
        type={type}
        label={isLabel && translate(label)}
        readOnly={readOnly}
        name={name}
        value={value || ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => updateProperty(e.target.value)}
        icons={[
          canRemove &&
            value && {
              icon: "close",
              color: "body",
              onClick: handleClear,
              className: "pointer",
            },
        ].filter(Boolean)}
        description={description}
      />
    </Box>
  );
}
