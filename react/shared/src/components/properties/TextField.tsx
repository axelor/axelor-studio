import React, { useState, useEffect } from "react";
import { Box, Button, Input, InputLabel, clsx } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { AlertDialog } from "../AlertDialog";
import { CodeEditor } from "../CodeEditor";
import { Description } from "../Description";
import { translate } from "../../i18n/index";
import type { ModdleElement, BpmnElement } from "../../types/moddl-types";
import type { DmnElement } from "../../types/dmn-types";

import styles from "./textfield.module.css";

/** Element types accepted by properties panel components */
type PropertiesElement = BpmnElement | ModdleElement | DmnElement;

export interface TextFieldEntry {
  label?: string;
  description?: string;
  modelProperty: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set?: (...args: any[]) => any;
  get?: (...args: any[]) => any;
  setProperty?: (...args: any[]) => any;
  getProperty?: (...args: any[]) => any;
  validate?: (...args: any[]) => any;
  required?: boolean;
  [key: string]: unknown;
}

interface TextFieldProps {
  entry: TextFieldEntry;
  element?: PropertiesElement;
  canRemove?: boolean;
  rootClass?: string;
  labelClass?: string;
  type?: string;
  isLabel?: boolean;
  readOnly?: boolean;
  clearClassName?: string;
  disabled?: boolean;
  showError?: boolean;
  isDefinition?: boolean;
  className?: string;
  endAdornment?: React.ReactNode;
  isScript?: boolean;
  language?: string;
  setField?: (value: unknown) => void;
  clearPropertises?: () => void;
  placeholder?: string;
  updateXMLProperty?: boolean;
  [key: string]: unknown;
}

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
  isScript,
  language,
  setField,
  clearPropertises,
  placeholder,
  updateXMLProperty = true,
}: TextFieldProps) {
  const {
    label,
    description,
    modelProperty,
    set,
    get,
    setProperty,
    getProperty,
    validate,
    required = false,
  } = entry || ({} as TextFieldEntry);
  const [value, setValue] = useState<string | number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isError, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [editorValue, setEditorValue] = useState("");

  const openEditor = () => {
    setEditorValue(String(value || ""));
    setOpen(true);
  };
  const handleOk = () => {
    updateProperty(editorValue);
    setOpen(false);
  };

  const updateProperty = (value: string | number) => {
    if (!set && !setProperty) return;
    if (set) {
      set(element, {
        [modelProperty]: value,
      });
    } else {
      setProperty!(element, {
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
    setField?.(null);
    clearPropertises?.();
    if (!isError) {
      updateProperty("");
    }
  };

  const getValidation = React.useCallback(() => {
    if (!validate || ((value === null || value === undefined) && modelProperty === "id")) {
      setErrorMessage(null);
      return false;
    }
    const valid = validate(element, {
      [modelProperty]: value === "" ? undefined : value,
    }) as Record<string, string> | null;
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
    const v = getProperty
      ? getProperty(element)
      : values && (values as Record<string, unknown>)[modelProperty];
    setValue(v as string | number | null);
  }, [element, modelProperty, get, getProperty]);

  return (
    <div className={clsx(styles.root, rootClass)}>
      {isLabel && (
        <InputLabel className={clsx(styles.label, labelClass)} color="body">
          {translate(label ?? "")}
          {required && <span className={styles.required}>*</span>}
        </InputLabel>
      )}
      <div className={styles.fieldWrapper}>
        <Box d="flex" alignItems="center">
          <Input
            flex="1"
            id={`camunda-${modelProperty}_${Date()}`}
            type={type}
            readOnly={readOnly || disabled}
            name={modelProperty}
            value={value || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const { value } = e.target;
              const updatedValue =
                modelProperty === "code"
                  ? value?.toUpperCase()
                  : type === "number" && value
                    ? parseInt(value)
                    : value;
              setValue(updatedValue);
              if (updateXMLProperty) {
                updateProperty(updatedValue);
              }
            }}
            disabled={readOnly || disabled}
            invalid={isError}
            className={className}
            style={{ textOverflow: "ellipsis" }}
            onBlur={() => !updateXMLProperty && value != null && updateProperty(value)}
            placeholder={placeholder}
          />
          {canRemove && !readOnly && (
            <Button
              onClick={handleClear}
              className={clsx(styles.clearButton, clearClassName)}
              style={{ visibility: value ? "visible" : "hidden" }}
            >
              <MaterialIcon icon="close" fontSize={16} />
            </Button>
          )}
          {isScript && (
            <Button onClick={openEditor} className={clsx(styles.clearButton, clearClassName)}>
              <MaterialIcon icon="code" fontSize={16} />
            </Button>
          )}
          {endAdornment}
        </Box>
        {errorMessage && <Description desciption={errorMessage} type="error" />}
      </div>
      {description && <Description desciption={description} />}
      <AlertDialog openAlert={open} alertClose={() => setOpen(false)} handleAlertOk={handleOk}>
        <CodeEditor
          height={typeof window !== "undefined" ? window.innerHeight - 205 : 400}
          value={editorValue}
          onChange={(v: string) => setEditorValue(v)}
          language={language as "groovy" | "jpql" | "xml" | "json" | "javascript"}
        />
      </AlertDialog>
    </div>
  );
}
