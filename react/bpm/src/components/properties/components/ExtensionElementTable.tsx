import React, { useState, useEffect } from "react";
import { translate } from "@studio/shared/i18n";
import { Box, Button, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import classnames from "classnames";

import styles from "./extension-table.module.css";

interface ExtensionOption {
  id: string | number;
  text: string;
}

interface ExtensionEntry {
  label?: string;
  defaultSize?: number;
  id?: string;
  modelProperty?: string;
  setOptionLabelValue?: (index: number) => string;
  createExtensionElement?: (...args: unknown[]) => unknown;
  onSelectionChange?: (value: string | number) => void;
  removeExtensionElement?: (value: string | number | null) => void;
  [key: string]: unknown;
}

interface ExtensionElementTableProps {
  entry: ExtensionEntry;
  options?: ExtensionOption[];
  element?: unknown;
  [key: string]: unknown;
}

export default function ExtensionElementTable({
  entry,
  options: defaultOptions,
}: ExtensionElementTableProps) {
  const {
    label,
    defaultSize = 5,
    id,
    setOptionLabelValue,
    createExtensionElement,
    onSelectionChange,
    removeExtensionElement,
  } = entry || {};
  const [options, setOptions] = useState<ExtensionOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);

  const addElement = () => {
    createExtensionElement?.();
    const optionLabel = setOptionLabelValue?.(options.length) ?? "";
    setOptions((options) => [...(options || []), { id: options.length, text: optionLabel }]);
    setSelectedOption(options.length);
    onSelectionChange?.(options.length);
  };

  const handleChange = (e: React.MouseEvent<HTMLOptionElement>) => {
    const target = e.target as HTMLOptionElement;
    setSelectedOption(target.value);
    onSelectionChange?.(target.value);
  };

  const removeElement = () => {
    removeExtensionElement?.(selectedOption);
  };

  useEffect(() => {
    if (defaultOptions) {
      setOptions(defaultOptions);
    }
  }, [defaultOptions]);

  return (
    <div className={styles.root}>
      <InputLabel color="body" htmlFor={`cam-extensionElements-${id}`} className={styles.label}>
        {translate(label ?? "")}
      </InputLabel>
      <Box position="relative">
        <select
          id={`cam-extensionElements-${id}`}
          className={styles.extensionElements}
          name="selectedExtensionElement"
          size={defaultSize}
          data-list-entry-container
          value={selectedOption ?? ""}
          onChange={() => {}}
        >
          {options &&
            options.length > 0 &&
            options.map((option) => (
              <option
                key={option.id}
                value={option.id}
                onClick={handleChange}
                style={{ background: "var(--bs-tertiary-bg)" }}
              >
                {option.text}
              </option>
            ))}
        </select>
        <Button
          className={classnames(styles.icon, styles.add)}
          id={`cam-extensionElements-create-${id}`}
          onClick={addElement}
          variant="secondary"
          position="absolute"
          outline
        >
          <MaterialIcon icon="add" fontSize={16} />
        </Button>
        <Button
          className={classnames(styles.icon, styles.clear)}
          id={`cam-extensionElements-remove-${id}`}
          onClick={removeElement}
          variant="secondary"
          position="absolute"
          outline
        >
          <MaterialIcon icon="close" fontSize={16} />
        </Button>
      </Box>
    </div>
  );
}
