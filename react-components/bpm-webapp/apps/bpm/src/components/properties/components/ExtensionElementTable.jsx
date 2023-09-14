import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/styles";
import { translate } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
  extensionElements: {
    width: "100%",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
  add: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 0,
  },
  clear: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 23,
  },
  container: {
    position: "relative",
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
      <div>
        <label
          htmlFor={`cam-extensionElements-${id}`}
          className={classes.label}
        >
          {translate(label)}
        </label>
        <div className={classes.container}>
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
                >
                  {option.text}
                </option>
              ))}
          </select>
          <button
            className={classes.add}
            id={`cam-extensionElements-create-${id}`}
            onClick={addElement}
          >
            <span>+</span>
          </button>
          <button
            className={classes.clear}
            id={`cam-extensionElements-remove-${id}`}
            onClick={removeElement}
          >
            <span style={{ fontSize: 10 }}>X</span>
          </button>
        </div>
      </div>
    </div>
  );
}
