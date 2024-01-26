import React, { useState, useEffect } from "react";
import { translate } from "../../../utils";
import { Box, Button, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import classnames from "classnames";
import styles from "./extension-table.module.css";

export default function ExtensionElementTable({
  entry,
  options: defaultOptions,
}) {
  const {
    label,
    defaultSize = 5,
    id,
    setOptionLabelValue,
    createExtensionElement,
    onSelectionChange,
    removeExtensionElement,
  } = entry || {};
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const addElement = () => {
    createExtensionElement();
    let label = setOptionLabelValue(options.length);
    setOptions((options) => [
      ...(options || []),
      { id: options.length, text: label },
    ]);
    setSelectedOption(options.length);
    onSelectionChange(options.length);
  };

  const handleChange = (e) => {
    setSelectedOption(e.target.value);
    onSelectionChange(e.target.value);
  };

  const removeElement = () => {
    removeExtensionElement(selectedOption);
  };

  useEffect(() => {
    if (defaultOptions) {
      setOptions(defaultOptions);
    }
  }, [defaultOptions]);

  return (
    <div className={styles.root}>
      <InputLabel
        color="body"
        htmlFor={`cam-extensionElements-${id}`}
        className={styles.label}
      >
        {translate(label)}
      </InputLabel>
      <Box position="relative">
        <select
          id={`cam-extensionElements-${id}`}
          className={styles.extensionElements}
          name="selectedExtensionElement"
          size={defaultSize}
          data-list-entry-container
          value={selectedOption || ""}
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
          overflow="hidden"
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
          overflow="hidden"
          position="absolute"
          outline
        >
          <MaterialIcon icon="clear" fontSize={16} />
        </Button>
      </Box>
    </div>
  );
}
