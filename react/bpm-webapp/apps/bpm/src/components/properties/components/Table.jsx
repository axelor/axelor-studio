import React, { useEffect, useState } from "react";
import { IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import { translate } from "../../../utils";
import {
  Box,
  InputLabel,
  Table as AxTable,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const useStyles = makeStyles({
  add: {
    border: "1px solid #ccc",
    width: "fit-content",
    color: "inherit",
    overflow: "hidden",
    cursor: "pointer",
    borderRadius: 0,
  },
  clear: {
    width: "fit-content",
    overflow: "hidden",
    color: "inherit",
    border: "1px solid #ccc",
    borderRadius: 0,
  },
  label: {
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
    verticalAlign: "middle",
    marginBottom: 3,
    marginRight: 10,
  },
  tableHead: {
    verticalAlign: "middle",
    textAlign: "center",
  },
  input: {
    padding: "3px 0px 3px 6px",
    minWidth: 30,
    maxWidth: "95%",
    width: "100%",
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
    <Box d="flex" flexDirection="column" style={{ margin: "5px 0" }}>
      <Box d="flex" alignItems="center" color="body">
        <InputLabel className={classes.label}>{translate(addLabel)}</InputLabel>
        <IconButton
          size="small"
          className={classes.add}
          id={`cam-extensionElements-create-${id}`}
          onClick={addNewElement}
        >
          <MaterialIcon icon="add" fontSize={12} />
        </IconButton>
      </Box>
      {options && options.length > 0 && (
        <Box
          rounded={2}
          bgColor="body"
          shadow
          style={{ marginTop: 5, marginBottom: 0 }}
        >
          <AxTable>
            <TableHead>
              <TableRow>
                {labels.map((label) => (
                  <TableCell as="th" key={label} className={classes.tableHead}>
                    {translate(label)}
                  </TableCell>
                ))}
                <TableCell as="th" key="add" className={classes.tableHead} />
              </TableRow>
            </TableHead>
            <TableBody>
              {options &&
                options.map((option, optionIndex) => (
                  <TableRow key={`${option}_${optionIndex}`}>
                    <React.Fragment>
                      {modelProperties &&
                        modelProperties.map((label, index) => (
                          <TableCell key={`${option[label]}_${index}`}>
                            {label === "expression" ? (
                              <Box
                                d="flex"
                                alignItems="center"
                                justifyContent="center"
                                className={classes.input}
                              >
                                <Input
                                  type="checkbox"
                                  defaultChecked={option[label] || false}
                                  onChange={(e) => {
                                    update(
                                      e.target.checked,
                                      label,
                                      optionIndex
                                    );
                                  }}
                                />
                              </Box>
                            ) : (
                              <Input
                                className={classes.input}
                                type="text"
                                defaultValue={option[label] || ""}
                                onBlur={(e) => {
                                  update(e.target.value, label, optionIndex);
                                }}
                              />
                            )}
                          </TableCell>
                        ))}
                      <TableCell>
                        <IconButton
                          size="small"
                          className={classes.clear}
                          id={`cam-extensionElements-remove-${id}`}
                          onClick={() => {
                            remove(optionIndex);
                          }}
                        >
                          <MaterialIcon icon="close" fontSize={12} />
                        </IconButton>
                      </TableCell>
                    </React.Fragment>
                  </TableRow>
                ))}
            </TableBody>
          </AxTable>
        </Box>
      )}
    </Box>
  );
}
