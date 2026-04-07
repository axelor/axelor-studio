import React, { useEffect, useState } from "react";
import classnames from "classnames";
import {  InputLabel, Input } from "@axelor/ui";
import { CodeEditor, Description } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import type { ModdleElement } from "@studio/shared/types";

import { getBool } from "../../../utils";
import { useStore } from "../../../store";
import { getNameProperty } from "../../../BPMN/Modeler/extra";


import styles from "./textbox.module.css";

interface TextboxEntry {
  id?: string;
  label?: string;
  description?: string;
  get?: (element: ModdleElement) => Record<string, unknown>;
  set?: (element: ModdleElement, values: Record<string, unknown>, readOnly?: boolean | (() => boolean)) => void;
  modelProperty?: string;
  getProperty?: (element: ModdleElement) => unknown;
  setProperty?: (element: ModdleElement, values: Record<string, unknown>) => void;
  validate?: (element: ModdleElement, values: Record<string, unknown>) => Record<string, string> | undefined;
  required?: boolean;
}

interface TextboxProps {
  entry: TextboxEntry;
  element: ModdleElement;
  rows?: number;
  readOnly?: boolean;
  className?: string;
  defaultHeight?: number;
  showLabel?: boolean;
  minimap?: boolean;
  suggestion?: boolean;
}

const getValue = (element: ModdleElement): boolean | undefined => {
  if (!element) return;
  const bo = getBusinessObject(element);
  if (!bo) return;
  return getBool(bo?.$attrs?.["camunda:isTranslations"]);
};

const getName = (element: ModdleElement): unknown => {
  if (!element) return;
  const bo = getBusinessObject(element);
  if (!bo) return;
  return bo?.[getNameProperty(element as unknown as { type?: string })]; // safety: bpmn-js element type property not in typed interface
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
  } = entry || {};
  const [value, setValue] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isError, setError] = useState(false);
  const [readOnly, setReadOnly] = useState<boolean | (() => boolean)>(parentReadOnly);
  const { state } = useStore();
  const { element: storeElement } = state as { element?: ModdleElement };

  const updateProperty = (value: string) => {
    if (!set && !setProperty) return;
    if (set) {
      set(
        element,
        {
          [modelProperty ?? ""]: value,
        },
        readOnly,
      );
      setValue(value);
    } else {
      setProperty?.(element, {
        [modelProperty ?? ""]: value,
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
    let isSubscribed = true;
    const isError = getValidation();
    if (!isSubscribed) return;
    setError(isError);
    return () => { isSubscribed = false; };
  }, [getValidation]);

  useEffect(() => {
    if (!element) return;
    let isSubscribed = true;
    const values: Record<string, unknown> = (get && get(element)) ?? {};
    const propValue = getProperty ? getProperty(element) : values[modelProperty ?? ""];
    if (!isSubscribed) return;
    setValue(propValue as string | null);
    return () => { isSubscribed = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element, modelProperty, get, getProperty, getName(storeElement as ModdleElement)]);

  useEffect(() => {
    let isSubscribed = true;
    if (!isSubscribed) return;
    const isReadonly = getValue(element) && modelProperty === getNameProperty(element as unknown as { type?: string }); // safety: bpmn-js element type property not in typed interface
    setReadOnly(isReadonly || parentReadOnly);
    return () => { isSubscribed = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentReadOnly, getValue(element)]);

  const isReadOnly = typeof readOnly === "function" ? readOnly() : readOnly;

  return (
    <div className={classnames(styles.root, className)}>
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
          readOnly={isReadOnly}
          onChange={(value: string) => {
            setValue(value);
            updateProperty((value ?? "").trim());
          }}
          onBlur={() => {
            if (!isReadOnly) {
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
            if (!isReadOnly) {
              updateProperty(e.target.value);
            }
          }}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setValue(e.target.value);
            updateProperty(e.target.value);
          }}
          invalid={isError}
          disabled={Boolean(readOnly)}
          readOnly={isReadOnly}
        />
      )}
      {errorMessage && <Description desciption={errorMessage} type="error" />}
      {description &&
        (modelProperty !== getNameProperty(element as unknown as { type?: string }) || // safety: bpmn-js element type property not in typed interface
          (readOnly && modelProperty === getNameProperty(element as unknown as { type?: string }))) && ( // safety: bpmn-js element type property not in typed interface
          <Description desciption={description} />
        )}
    </div>
  );
}
