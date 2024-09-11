import React, { useEffect, useState } from "react";
import IconButton from "../../IconButton";

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
  TextField,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import AlertDialog from "../../AlertDialog";
import ScriptEditor from "../EditorConfig/SrciptEditor";
import styles from "./table.module.css";

export default function Table({ entry }) {
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
        <InputLabel className={styles.label}>{translate(addLabel)}</InputLabel>
        <IconButton
          size="small"
          className={styles.add}
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
                  <TableCell as="th" key={label} className={styles.tableHead}>
                    {translate(label)}
                  </TableCell>
                ))}
                <TableCell as="th" key="add" className={styles.tableHead} />
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
                                className={styles.input}
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
                              <ValueCell
                                label={label}
                                optionIndex={optionIndex}
                                index={index}
                                option={option}
                                classes={styles}
                                update={update}
                              />
                            )}
                          </TableCell>
                        ))}
                      <TableCell>
                        <IconButton
                          size="small"
                          className={styles.clear}
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

const ValueCell = ({ label, index, optionIndex, option, classes, update }) => {
  const [open, setOpen] = useState(false);
  const [editorValue, setEditorValue] = useState("");
  const openEditor = () => {
    setEditorValue(option[label] || "");
    setOpen(true);
  };
  const handleOk = () => {
    update(editorValue, label, optionIndex);
    setOpen(false);
  };
  const handleEditorChange = (value) => {
    setEditorValue(value);
  };

  return (
    <Box>
      <TextField
        type="text"
        defaultValue={option[label] || ""}
        onBlur={(e) => {
          update(e.target.value, label, optionIndex);
        }}
        icons={
          index && [
            {
              icon: "code",
              color: "body",
              className: styles.editorIcon,
              onClick: openEditor,
            },
          ]
        }
      />
      <AlertDialog
        openAlert={open}
        alertClose={() => setOpen(false)}
        handleAlertOk={handleOk}
      >
        <ScriptEditor
          defaultHeight={window?.innerHeight - 205}
          value={editorValue}
          onChange={handleEditorChange}
        />
      </AlertDialog>
    </Box>
  );
};
