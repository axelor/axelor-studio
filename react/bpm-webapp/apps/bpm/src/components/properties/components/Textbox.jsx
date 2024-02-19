import React, { useEffect, useState, useRef } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/styles";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-groovy";
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/ext-language_tools";
import { Resizable } from "re-resizable";

import Description from "./Description";
import { getTranslations } from "../../../services/api";
import { getBool } from "../../../utils";
import { InputLabel, Input } from "@axelor/ui";
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
  editor: {
    fontFamily: "monospace",
    background: "var(--bs-body-bg) !important",
    border: "1px solid var(--bs-tertiary-bg) !important",
    borderRadius: 4,
    "&.ace_focus": {
      border: "1px solid #666cff !important",
    },
  },
  error: {
    borderColor: "#cc3333 !important",
    "&:focus, &.ace_focus": {
      borderColor: "#cc3333 !important",
    },
  },
  readOnly: {
    borderColor: "#ccc !important",
    background: "#E3E3E3",
    color: "#7E7E7E",
    "&:focus , &.ace_focus": {
      boxShadow: "none !important",
      outline: "none",
      borderColor: "#ccc !important",
    },
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
const PADDING = 2; // to make box shadow visible
const FONT_SIZE = 12;
const INITIAL_HEIGHT = 120;

function ScriptEditor({
  id,
  value,
  width: containerWidth,
  onChange,
  onBlur,
  isError,
  readOnly,
  defaultHeight,
}) {
  const classes = useStyles();
  const [height, setHeight] = useState(defaultHeight || INITIAL_HEIGHT);
  const [width, setWidth] = useState(containerWidth - PADDING * 2);
  const savedDimension = useRef({ width, height });

  function handleChange(newValue) {
    onChange(newValue);
  }

  useEffect(() => {
    setWidth(containerWidth - PADDING * 2);
  }, [containerWidth]);

  return (
    <Resizable
      style={{ padding: PADDING }}
      onResizeStart={(e, direction, element) => {
        savedDimension.current = { width, height };
      }}
      enable={{
        top: false,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      onResize={(e, direction, ref, d) => {
        setHeight(savedDimension.current.height + d.height);
      }}
    >
      <AceEditor
        className={classnames(
          classes.editor,
          isError && classes.error,
          readOnly && classes.readOnly
        )}
        fontSize={FONT_SIZE}
        onLoad={(editor) => {
          editor.renderer.setScrollMargin(3);
        }}
        readOnly={readOnly}
        mode="groovy"
        theme="chrome"
        onChange={handleChange}
        name={id}
        editorProps={{ $blockScrolling: true }}
        value={value}
        showGutter={width > 500}
        wrapEnabled={true}
        height={`${height}px`}
        width={`${width}px`}
        enableLiveAutocompletion
        showPrintMargin={false}
        onBlur={onBlur}
      />
    </Resizable>
  );
}
