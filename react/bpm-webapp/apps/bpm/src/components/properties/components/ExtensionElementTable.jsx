import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/styles";
import { translate } from "../../../utils";
import { Box, Button, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import classnames from "classnames";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
  extensionElements: {
    width: "100%",
    overflow: "auto",
    border: "var(--ax-theme-panel-border, 1px solid var(--bs-border-color))",
    borderRadius:
      "var(--ax-theme-panel-border-radius, var(--bs-border-radius))",
    padding: "var(--ax-theme-panel-body-padding, .5rem)",
  },
  label: {
    display: "inline-block",
    verticalAlign: "middle",
    marginBottom: 3,
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
  },
  add: {
    right: 0,
  },
  clear: {
    right: 26,
  },
  icon: {
    top: "-23px !important",
    height: 23,
    borderRadius: 0,
    width: 24,
    padding: 0,
    background: "var(--bs-body-bg)",
    border: "none",
    justifyContent: "center",
    display: "flex",
    alignItems: "center",
  },
});

export default function ExtensionElementTable({
  entry,
  options: defaultOptions,
}) {
  const classes = useStyles();
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
    <div className={classes.root}>
      <InputLabel
        color="body"
        htmlFor={`cam-extensionElements-${id}`}
        className={classes.label}
      >
        {translate(label)}
      </InputLabel>
      <Box position="relative">
        <select
          id={`cam-extensionElements-${id}`}
          className={classes.extensionElements}
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
          className={classnames(classes.icon, classes.add)}
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
          className={classnames(classes.icon, classes.clear)}
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
