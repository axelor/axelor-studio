import React, { useEffect, useState } from "react";
import {
  Box,
  InputLabel,
  Table as AxTable,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TextField,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import IconButton from "../IconButton";
import { AlertDialog } from "../AlertDialog";
import { CodeEditor } from "../CodeEditor";
import { translate } from "../../i18n/index";


import styles from "./table.module.css";

interface TableEntry {
  id: string;
  addLabel: string;
  labels: string[];
  modelProperties: string[];
  getElements?: () => Record<string, unknown>[];
  addElement: (value: Record<string, unknown>) => void;
  removeElement: (index: number) => void;
  updateElement: (value: unknown, label: string, index: number) => void;
}

interface TableProps {
  entry: TableEntry;
}

export default function Table({ entry }: TableProps) {
  const {
    id,
    addLabel,
    labels,
    modelProperties,
    getElements,
    addElement,
    removeElement,
    updateElement,
  } = entry || ({} as TableEntry);
  const [options, setOptions] = useState<Record<string, unknown>[]>([]);

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

  const remove = (optionIndex: number) => {
    const cloneOptions = [...(options || [])];
    cloneOptions.splice(optionIndex, 1);
    setOptions([...(cloneOptions || [])]);
    removeElement(optionIndex);
  };

  const update = (value: unknown, label: string, optionIndex: number) => {
    const cloneOptions = [...(options || [])];
    (cloneOptions[optionIndex])[label] = value;
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
        <Box rounded={2} bgColor="body" shadow style={{ marginTop: 5, marginBottom: 0 }}>
          <AxTable>
            <TableHead>
              <TableRow>
                {labels.map((label: string) => (
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
                        modelProperties.map((label: string, index: number) => (
                          <TableCell key={`${option[label]}_${index}`}>
                            {label === "expression" ? (
                              <Box
                                d="flex"
                                alignItems="center"
                                justifyContent="center"
                                className={styles.input}
                              >
                                <input
                                  type="checkbox"
                                  defaultChecked={(option[label] as boolean) || false}
                                  onChange={(e) => {
                                    update(e.target.checked, label, optionIndex);
                                  }}
                                />
                              </Box>
                            ) : (
                              <ValueCell
                                label={label}
                                optionIndex={optionIndex}
                                index={index}
                                option={option}
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

interface ValueCellProps {
  label: string;
  optionIndex: number;
  index: number;
  option: Record<string, unknown>;
  update: (value: unknown, label: string, optionIndex: number) => void;
}

function ValueCell({ label, index, optionIndex, option, update }: ValueCellProps) {
  const [open, setOpen] = useState(false);
  const [editorValue, setEditorValue] = useState("");

  const openEditor = () => {
    setEditorValue(String(option[label] || ""));
    setOpen(true);
  };
  const handleOk = () => {
    update(editorValue, label, optionIndex);
    setOpen(false);
  };

  return (
    <Box>
      <Box d="flex" alignItems="center">
        <TextField
          type="text"
          defaultValue={(option[label] as string) || ""}
          onBlur={(e) => {
            update((e.target as HTMLInputElement).value, label, optionIndex);
          }}
        />
        {index > 0 && (
          <IconButton size="small" className={styles.editorIcon} onClick={openEditor}>
            <MaterialIcon icon="code" fontSize={12} />
          </IconButton>
        )}
      </Box>
      <AlertDialog openAlert={open} alertClose={() => setOpen(false)} handleAlertOk={handleOk}>
        <CodeEditor
          height={typeof window !== "undefined" ? window.innerHeight - 205 : 400}
          value={editorValue}
          onChange={(v: string) => setEditorValue(v)}
        />
      </AlertDialog>
    </Box>
  );
}
