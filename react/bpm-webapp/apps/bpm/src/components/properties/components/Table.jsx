import React, { useEffect, useState } from "react";
import { IconButton } from "@material-ui/core";
import { Add, Close } from "@material-ui/icons";
import { makeStyles } from "@material-ui/styles";

import { translate } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
    marginBottom: 5,
  },
  add: {
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    borderRadius: 0,
  },
  clear: {
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderRadius: 0,
  },
  label: {
    fontWeight: "bolder",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
    marginRight: 10,
  },
  tableHead: {
    display: "table-row",
    verticalAlign: "inherit",
    borderColor: "inherit",
    textAlign: "center",
  },
  input: {
    padding: "3px 0px 3px 6px",
    border: "1px solid #ccc",
    minWidth: 30,
    maxWidth: "95%",
    width: "100%",
    "&:focus": {
      boxShadow: "rgba(82, 180, 21, 0.2) 0px 0px 1px 2px",
      outline: "none",
      borderColor: "rgb(82, 180, 21)",
    },
  },
});

export default function Table({ entry }) {
  const classes = useStyles();
  const {
    id,
    addLabel,
    labels,
    modelProperties,
    getElements,
    addElement,
    removeElement,
    updateElement,
  } = entry || {};
  const [options, setOptions] = useState([]);

  const getOptions = React.useCallback(() => {
    const options = getElements && getElements();
    setOptions([...(options || [])]);
  }, [getElements]);

  const addNewElement = () => {
    setOptions([
      ...(options || []),
      {
        key: undefined,
        value: undefined,
      },
    ]);
    addElement({
      key: undefined,
      value: undefined,
    });
  };

  const remove = (optionIndex) => {
    const cloneOptions = [...(options || [])];
    cloneOptions.splice(optionIndex, 1);
    setOptions([...(cloneOptions || [])]);
    removeElement(optionIndex);
  };

  const update = (value, label, optionIndex) => {
    const cloneOptions = [...(options || [])];
    cloneOptions[optionIndex][label] = value;
    setOptions(cloneOptions);
    updateElement(value, label, optionIndex);
  };

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div className={classes.root}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <label className={classes.label}>{translate(addLabel)}</label>
        <IconButton
          size="small"
          className={classes.add}
          id={`cam-extensionElements-create-${id}`}
          onClick={addNewElement}
        >
          <Add fontSize="small" />
        </IconButton>
      </div>
      {options && options.length > 0 && (
        <table>
          <tbody>
            <tr className={classes.tableHead}>
              {labels.map((label) => (
                <th key={label} className={classes.label}>
                  {translate(label)}
                </th>
              ))}
              <th key="add"></th>
            </tr>
            {options &&
              options.map((option, optionIndex) => (
                <tr key={`${option}_${optionIndex}`}>
                  <React.Fragment>
                    {modelProperties &&
                      modelProperties.map((label, index) => (
                        <td key={`${option[label]}_${index}`}>
                          {label === "expression" ? (
                            <input
                              className={classes.input}
                              type="checkbox"
                              defaultChecked={option[label] || false}
                              onChange={(e) => {
                                update(e.target.checked, label, optionIndex);
                              }}
                            />
                          ) : (
                            <input
                              className={classes.input}
                              type="text"
                              defaultValue={option[label] || ""}
                              onBlur={(e) => {
                                update(e.target.value, label, optionIndex);
                              }}
                            />
                          )}
                        </td>
                      ))}
                    <td>
                      <IconButton
                        size="small"
                        className={classes.clear}
                        id={`cam-extensionElements-remove-${id}`}
                        onClick={() => {
                          remove(optionIndex);
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </td>
                  </React.Fragment>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
