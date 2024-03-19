import React, { useEffect, useState, useRef } from "react";
import classnames from "classnames";
import { InputLabel, Input } from "@axelor/ui";
import ScriptEditor from "../EditorConfig/SrciptEditor";
import Description from "./Description";
import { getBool } from "../../../utils";
import { translate } from "../../../utils";
import { useStore } from "../../../store";
import { getNameProperty } from "../../../BPMN/Modeler/extra";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import styles from "./Textbox.module.css";

const getValue = (element) => {
  if (!element) return;
  const bo = getBusinessObject(element);
  if (!bo) return;
  return getBool(bo?.$attrs?.["camunda:isTranslations"]);
};

const getName = (element) => {
  if (!element) return;
  const bo = getBusinessObject(element);
  if (!bo) return;
  return bo?.[getNameProperty(element)];
};

export default function Textbox({
  entry,
  element,
  rows = 1,
  readOnly: parentReadOnly = false,
  className,
  defaultHeight,
  showLabel = true,
  minimap,
  setDummyProperty = () => {},
}) {
  const {
    label,
    description,
    get,
    set,
    modelProperty,
    getProperty,
    setProperty,
    validate,
  } = entry || {};
  const [value, setValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);
  const [readOnly, setReadOnly] = useState(parentReadOnly);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { state } = useStore();
  const { element: storeElement } = state;

  const updateProperty = (value) => {
    if (!set && !setProperty) return;
    setDummyProperty();
    if (set) {
      set(
        element,
        {
          [modelProperty]: value,
        },
        readOnly
      );
      setValue(value);
    } else {
      setProperty(element, {
        [modelProperty]: value,
      });
      setValue(value);
    }
    const isError = getValidation();
    setError(isError);
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
    let isSubscribed = true;
    const isError = getValidation();
    if (!isSubscribed) return;
    setError(isError);
    return () => (isSubscribed = false);
  }, [getValidation]);

  useEffect(() => {
    if (!element) return;
    let isSubscribed = true;
    const values = get && get(element);
    let value = getProperty
      ? getProperty(element)
      : values && values[modelProperty];
    if (!isSubscribed) return;
    setValue(value);
    return () => (isSubscribed = false);
  }, [element, modelProperty, get, getProperty, getName(storeElement)]);

  useEffect(() => {
    let isSubscribed = true;
    if (!isSubscribed) return;
    const readonly =
      getValue(storeElement) && modelProperty === getNameProperty(element);
    setReadOnly(readonly || parentReadOnly);
    return () => (isSubscribed = false);
  }, [parentReadOnly, getValue(storeElement)]);

  useEffect(() => {
    const container = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0].contentRect.width;
      setContainerWidth(containerWidth);
    });
    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, []);

  return (
    <div className={classnames(styles.root, className)} ref={containerRef}>
      {showLabel && (
        <InputLabel className={styles.label} color="body">
          {translate(label)}
        </InputLabel>
      )}
      {entry.id === "script" ? (
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
      ) : (
        <Input
          as="textarea"
          id={`camunda_${modelProperty}_${Date()}`}
          value={value || ""}
          rows={rows}
          onBlur={(e) => {
            if (typeof readOnly === "function" ? !readOnly() : !readOnly) {
              updateProperty(e.target.value);
            }
          }}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          invalid={isError}
          disabled={readOnly}
          readOnly={typeof readOnly === "function" ? readOnly() : readOnly}
        />
      )}
      {errorMessage && <Description desciption={errorMessage} type="error" />}
      {description &&
        (modelProperty !== getNameProperty(element) ||
          (readOnly && modelProperty === getNameProperty(element))) && (
          <Description desciption={description} />
        )}
    </div>
  );
}
