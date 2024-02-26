import React, { useEffect, useState, useRef } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/styles";
import { InputLabel, Input } from "@axelor/ui";
import ScriptEditor from "../EditorConfig/SrciptEditor";
import Description from "./Description";
import { getTranslations } from "../../../services/api";
import { getBool } from "../../../utils";
import { translate } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
    overflow: "hidden",
    /* not adding overflow:hidden would cause horizontal scrollbar to appear when
     decreasing the size of the sidebar when scriptEditor is displayed
    */
  },
  label: {
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
    display: "inline-block",
    verticalAlign: "middle",
    marginBottom: 3,
  },
});

export default function Textbox({
  entry,
  element,
  rows = 1,
  bpmnModeler,
  readOnly: parentReadOnly = false,
  className,
  defaultHeight,
  showLabel = true,
  minimap,
}) {
  const classes = useStyles();
  const {
    label,
    description,
    get,
    set,
    modelProperty,
    getProperty,
    setProperty,
    validate,
    id,
  } = entry || {};
  const [value, setValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);
  const [readOnly, setReadOnly] = useState(parentReadOnly);
  const [translations, setTranslations] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const updateProperty = (value) => {
    if (!set && !setProperty) return;
    if (set) {
      set(
        element,
        {
          [modelProperty]: value,
        },
        readOnly,
        translations
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
    async function getAllTranslations() {
      if (!element || !["name", "text"].includes(modelProperty)) return;
      let bo = element.businessObject;
      const elementType = element && element.type;
      if (
        elementType === "bpmn:Participant" &&
        modelProperty === "name" &&
        id === "process-name"
      ) {
        bo = bo && bo.processRef;
      }
      let propertyName =
        elementType === "bpmn:TextAnnotation"
          ? "text"
          : elementType === "bpmn:Group"
          ? "categoryValue"
          : "name";

      if (!bo) return;
      const name = bo[propertyName];
      const key = bo.$attrs && bo.$attrs["camunda:key"];
      const value = key || name;
      const translations = await getTranslations(value);
      if (isSubscribed) {
        setValue(value);
        setTranslations(translations);
      }
      if (translations && translations.length > 0) {
        if (value && element.businessObject && element.businessObject.$attrs) {
          element.businessObject.$attrs["camunda:key"] = value;
        }
        const isTranslation =
          (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
        const isTranslated = getBool(isTranslation);
        if (isTranslated) {
          const directEditing = bpmnModeler.get("directEditing");
          if (isSubscribed) {
            setReadOnly(true);
          }
          if (!bpmnModeler) {
            return;
          }
          directEditing && directEditing.cancel();
        } else {
          if (isSubscribed) {
            setReadOnly(false);
          }
        }
      } else {
        if (key && element.businessObject && element.businessObject.$attrs) {
          element.businessObject.$attrs["camunda:key"] = key;
        }
        if (isSubscribed) {
          setValue(name);
        }
      }
    }
    getAllTranslations();
    return () => (isSubscribed = false);
  }, [element, modelProperty, id, bpmnModeler]);

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
  }, [element, modelProperty, get, getProperty]);

  useEffect(() => {
    let isSubscribed = true;
    if (!isSubscribed) return;
    setReadOnly(parentReadOnly);
    return () => (isSubscribed = false);
  }, [parentReadOnly]);

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
    <div className={classnames(classes.root, className)} ref={containerRef}>
      {showLabel && (
        <InputLabel className={classes.label} color="body">
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
          readOnly={typeof readOnly === "function" ? readOnly() : readOnly}
        />
      )}
      {errorMessage && <Description desciption={errorMessage} type="error" />}
      {description && <Description desciption={description} />}
    </div>
  );
}
