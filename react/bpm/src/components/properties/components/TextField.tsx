import React, { useState, useEffect } from "react";
import classnames from "classnames";
import { Description, AlertDialog, CodeEditor  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import type { ModdleElement } from "@studio/shared/types";
import { Box, Button, Input, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import styles from "./textfield.module.css";

interface TextFieldEntry {
  id?: string;
  label?: string;
  description?: string;
  modelProperty?: string;
  set?: (element: ModdleElement, values: Record<string, unknown>) => void;
  get?: (element: ModdleElement) => Record<string, unknown>;
  setProperty?: (element: ModdleElement, values: Record<string, unknown>) => void;
  getProperty?: (element: ModdleElement) => unknown;
  validate?: (element: ModdleElement, values: Record<string, unknown>) => Record<string, string> | undefined;
  required?: boolean;
}

interface TextFieldProps {
  entry?: TextFieldEntry;
  element?: ModdleElement;
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
  language?: "javascript" | "groovy" | "jpql" | "xml" | "json";
  setField?: (value: unknown) => void;
  clearPropertises?: () => void;
  placeholder?: string;
  updateXMLProperty?: boolean;
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
  } = entry || {};
  const [value, setValue] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isError, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [editorValue, setEditorValue] = useState("");

  const openEditor = () => {
    setEditorValue(value || "");
    setOpen(true);
  };
  const handleOk = () => {
    updateProperty(editorValue);
    setOpen(false);
  };
  const handleEditorChange = (value: string) => {
    setEditorValue(value);
  };
  const updateProperty = (value: string) => {
    if (!set && !setProperty) return;
    if (set && element) {
      set(element, {
        [modelProperty ?? ""]: value,
      });
    } else if (setProperty && element) {
      setProperty(element, {
        [modelProperty ?? ""]: value,
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
    if (!validate || !element || ((value === null || value === undefined) && modelProperty === "id")) {
      setErrorMessage(null);
      return false;
    }
    const valid = validate(element, {
      [modelProperty ?? ""]: value === "" ? undefined : value,
    });
    if (valid && valid[modelProperty ?? ""]) {
      setErrorMessage(valid[modelProperty ?? ""]);
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
    const values: Record<string, unknown> = (get && get(element)) ?? {};
    const propValue = getProperty ? getProperty(element) : values[modelProperty ?? ""];
    setValue(propValue as string | null);
  }, [element, modelProperty, get, getProperty]);

  return (
    <div className={classnames(styles.root, rootClass)}>
      {isLabel && (
        <InputLabel className={classnames(styles.label, labelClass)} color="body">
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
                    ? parseInt(value, 10)
                    : value;
              setValue(String(updatedValue ?? ""));
              if (updateXMLProperty) {
                updateProperty(String(updatedValue ?? ""));
              }
            }}
            disabled={readOnly || disabled}
            invalid={isError}
            className={className}
            style={{ textOverflow: "ellipsis" }}
            onBlur={() => !updateXMLProperty && updateProperty(value ?? "")}
            placeholder={placeholder}
          />
          {canRemove && !readOnly && (
            <Button
              onClick={handleClear}
              className={classnames(styles.clearButton, clearClassName)}
              style={{ visibility: value ? "visible" : "hidden" }}
            >
              <MaterialIcon icon="close" fontSize={16} />
            </Button>
          )}
          {isScript && (
            <Button onClick={openEditor} className={classnames(styles.clearButton, clearClassName)}>
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
          height={window?.innerHeight - 205}
          value={editorValue}
          onChange={handleEditorChange}
          language={language}
        />
      </AlertDialog>
    </div>
  );
}
