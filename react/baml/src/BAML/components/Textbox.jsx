import React, { useEffect, useState, useRef } from "react";
import { translate } from "../../utils";
import { Box, TextField ,InputLabel} from "@axelor/ui";
import ScriptEditor from "./editorConfig/ScriptEditor";

export default function Textbox({
  entry,
  element,
  rows = 1,
  bpmnModeler,
  className,
  readOnly,
  showLabel = true,
  defaultHeight,
  minimap=false,
}) {
  const { id, label, description, name, validate, get, set, modelProperty  } = entry || {};
  const [value, setValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null)

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


  useEffect(() => {
    const container = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0].contentRect.width;
      setContainerWidth(containerWidth)
    })
    observer.observe(container);
    return () => {
      observer.unobserve(container);
    }
  }, [])



  return (
    <Box
    d="flex"
    style={{ width: "100%" }}
    flexDirection="column"
    mt={1}
    className={className}
    ref={containerRef}

  >
      {
        id === 'script' ?
          <div>
            {showLabel && (
              <InputLabel  color="body">
                {translate(label)}
              </InputLabel>
            )}
            <ScriptEditor
              id={`camunda_${modelProperty}`}
              value={value || ""}
              isError={isError}
              defaultHeight={defaultHeight}
              readOnly={typeof readOnly === "function" ? readOnly() : readOnly}
              width={containerWidth}
              onChange={setValue}
              onBlur={(e, editor) => {
                if (typeof readOnly === "function" ? !readOnly() : !readOnly) {
                  updateProperty((value ?? "").trim());
                }
              }}
              minimap={minimap}
            />
          </div>
          :
        
            <TextField
              style={{ height: `${defaultHeight ? `${defaultHeight}px` : "20px"}` }}
              id={`camunda_${name}_${Date()}`}
              as="textarea"
              value={value || ""}
              minRows={rows}
              label={showLabel ? translate(label) : ""}
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
         
      }
   </Box>
  );
}
