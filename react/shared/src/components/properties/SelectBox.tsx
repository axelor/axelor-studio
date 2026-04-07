import React, { useState, useEffect } from "react";
import { Box, InputLabel, Select } from "@axelor/ui";

import { translate } from "../../i18n/index";
import { Description } from "../Description";
import type { ModdleElement, BpmnElement } from "../../types/moddl-types";
import type { DmnElement } from "../../types/dmn-types";

import styles from "./selectbox.module.css";

/** Element types accepted by properties panel components */
type PropertiesElement = BpmnElement | ModdleElement | DmnElement;

interface SelectOption {
  id?: string;
  name: string;
  value: string;
}

export interface SelectBoxEntry {
  id: string;
  selectOptions: SelectOption[] | ((element: PropertiesElement) => SelectOption[]);
  label: string;
  modelProperty: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set?: (...args: any[]) => any;
  get?: (...args: any[]) => any;
  getProperty?: (...args: any[]) => any;
  setProperty?: (...args: any[]) => any;
  disabled?: boolean;
  emptyParameter?: boolean;
  [key: string]: unknown;
}

interface SelectBoxProps {
  entry: SelectBoxEntry;
  element?: PropertiesElement;
}

export default function SelectBox({ entry, element }: SelectBoxProps) {
  const {
    id,
    selectOptions,
    label,
    modelProperty,
    description,
    set,
    get,
    getProperty,
    setProperty,
    disabled = false,
  } = entry || ({} as SelectBoxEntry);
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);

  const handleChange = (updatedValue: SelectOption | null) => {
    setSelectedOption(updatedValue);
    const { value = "" } = updatedValue || {};
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
  };

  useEffect(() => {
    if (!element) return;
    const values = get && get(element);
    const value = getProperty
      ? getProperty(element)
      : values && (values as Record<string, unknown>)[modelProperty];
    setSelectedOption(options?.find((o) => o.value === value) || null);
  }, [element, modelProperty, get, options, getProperty]);

  useEffect(() => {
    if (typeof selectOptions === "object") {
      setOptions(selectOptions);
    } else {
      const dynamicOptions = element ? selectOptions(element) : [];
      if (dynamicOptions) {
        setOptions(dynamicOptions);
      }
    }
  }, [selectOptions, element]);

  return (
    <Box className={styles.root}>
      <InputLabel htmlFor={`camunda-${id}`} color="body" className={styles.label}>
        {translate(label)}
      </InputLabel>
      <Select
        placeholder={translate("Select a value")}
        options={options}
        onChange={handleChange as (value: unknown) => void}
        optionKey={(x: SelectOption) => x.id || x.name}
        optionLabel={(x: SelectOption) => x.name}
        optionEqual={(o: SelectOption, v: SelectOption) => o.value === v.value}
        value={selectedOption}
        disabled={disabled}
      />
      {description && <Description desciption={description} />}
    </Box>
  );
}
