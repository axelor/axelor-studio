import React, { useEffect, useState, useRef } from "react";
import { InputLabel, Input, clsx } from "@axelor/ui";

import { CodeEditor } from "../CodeEditor";
import { Description } from "../Description";
import { translate } from "../../i18n/index";
import type { ModdleElement, BpmnElement } from "../../types/moddl-types";
import type { DmnElement } from "../../types/dmn-types";

import styles from "./textbox.module.css";

/** Element types accepted by properties panel components */
type PropertiesElement = BpmnElement | ModdleElement | DmnElement;

export interface TextboxEntry {
  label?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get?: (...args: any[]) => any;
  set?: (...args: any[]) => any;
  modelProperty: string;
  getProperty?: (...args: any[]) => any;
  setProperty?: (...args: any[]) => any;
  validate?: (...args: any[]) => any;
  required?: boolean;
  [key: string]: unknown;
}

interface TextboxProps {
  entry: TextboxEntry;
  element?: PropertiesElement;
  rows?: number;
  readOnly?: boolean | (() => boolean);
  className?: string;
  showLabel?: boolean;
  defaultHeight?: number;
  minimap?: boolean;
  suggestion?: boolean;
  [key: string]: unknown;
}

export default function Textbox({
  entry,
  element,
  rows = 1,
  readOnly: parentReadOnly = false,
  className,
  showLabel = true,
  defaultHeight,
  minimap,
  suggestion,
}: TextboxProps) {
  const {
    label,
    description,
    get,
    set,
    modelProperty,
    getProperty,
    setProperty,
    validate,
    required = false,
  } = entry || ({} as TextboxEntry);
  const [value, setValue] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isError, setError] = useState(false);
  const [readOnly, setReadOnly] = useState<boolean | (() => boolean)>(parentReadOnly);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateProperty = (value: string) => {
    if (!set && !setProperty) return;
    if (set) {
      set(
        element,
        {
          [modelProperty]: value,
        },
        readOnly,
      );
      setValue(value);
    } else {
      setProperty!(element, {
        [modelProperty]: value,
      });
      setValue(value);
    }
    const isError = getValidation();
    setError(isError);
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
    let isSubscribed = true;
    const isError = getValidation();
    if (!isSubscribed) return;
    setError(isError);
    return () => {
      isSubscribed = false;
    };
  }, [getValidation]);

  useEffect(() => {
    if (!element) return;
    let isSubscribed = true;
    const values = get && get(element);
    const v = getProperty
      ? getProperty(element)
      : values && (values as Record<string, unknown>)[modelProperty];
    if (!isSubscribed) return;
    setValue(v as string | null);
    return () => {
      isSubscribed = false;
    };
  }, [element, modelProperty, get, getProperty]);

  useEffect(() => {
    setReadOnly(parentReadOnly);
  }, [parentReadOnly]);

  return (
    <div className={clsx(styles.root, className)} ref={containerRef}>
      {showLabel && (
        <InputLabel className={styles.label} color="body">
          {translate(label ?? "")}
          {required && <span className={styles.required}>*</span>}
        </InputLabel>
      )}
      {entry.id === "script" ? (
        <CodeEditor
          value={value || ""}
          isError={isError}
          height={defaultHeight}
          readOnly={typeof readOnly === "function" ? readOnly() : !!readOnly}
          onChange={(v: string) => {
            setValue(v);
            updateProperty((v ?? "").trim());
          }}
          onBlur={() => {
            if (typeof readOnly === "function" ? !readOnly() : !readOnly) {
              updateProperty((value ?? "").trim());
            }
          }}
          minimap={minimap}
          suggestion={suggestion}
        />
      ) : (
        <Input
          as="textarea"
          id={`camunda_${modelProperty}_${Date()}`}
          value={value || ""}
          rows={rows}
          onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
            if (typeof readOnly === "function" ? !readOnly() : !readOnly) {
              updateProperty(e.target.value);
            }
          }}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setValue(e.target.value);
            updateProperty(e.target.value);
          }}
          invalid={isError}
          disabled={typeof readOnly === "function" ? readOnly() : !!readOnly}
          readOnly={typeof readOnly === "function" ? readOnly() : readOnly}
        />
      )}
      {errorMessage && <Description desciption={errorMessage} type="error" />}
      {description && <Description desciption={description} />}
    </div>
  );
}
