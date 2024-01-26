import React, { useState, useEffect } from "react";

import Select from "../../../components/Select";
import { translate, getBool } from "../../../utils";
import {
  Button,
  Switch,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  InputLabel,
  Box,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  DialogTitle,
} from "@axelor/ui";
import styles from "./deploy-dialog.module.css";

export default function DeployDialog({
  open,
  onClose,
  ids,
  onOk,
  wkf,
  element,
  getNewVersionInfo,
}) {
  const { oldElements, currentElements } = ids || {};
  const [wkfMigrationMap, setWkfMigrationMap] = useState({});
  const [isMigrateOld, setIsMigrateOld] = useState(false);
  const [removeOldVersionMenu, setRemoveOldVersionMenu] = useState(false);

  const handleAdd = (oldEle, newEle, processId) => {
    const cloneWkfMigrationMap = { ...wkfMigrationMap };
    cloneWkfMigrationMap[processId] = {
      ...cloneWkfMigrationMap[processId],
      [oldEle && oldEle.id]: newEle && newEle.id,
    };
    setWkfMigrationMap(cloneWkfMigrationMap);
  };

  const onConfirm = () => {
    onOk(
      {
        ...wkfMigrationMap,
        props: { removeOldVersionMenu: JSON.stringify(removeOldVersionMenu) },
      },
      isMigrateOld
    );
  };

  const getCurrentElements = (processId, elementType) => {
    const currentProcess = currentElements[processId];
    return (
      currentProcess?.elements?.filter(
        (element) => element?.type === elementType
      ) || []
    );
  };

  const getCurrentElement = React.useCallback(
    (processId, elementId) => {
      const currentProcess = currentElements[processId];
      const element =
        currentProcess &&
        currentProcess.elements &&
        currentProcess.elements.find((element) => element.id === elementId);
      return element;
    },
    [currentElements]
  );

  const getValue = React.useCallback(
    (processId, elementId) => {
      const currentProcess = currentElements[processId];
      return (
        currentProcess?.elements?.find(
          (e) =>
            e.id ===
            (wkfMigrationMap &&
              wkfMigrationMap[processId] &&
              wkfMigrationMap[processId][elementId])
        ) || getCurrentElement(processId, elementId)
      );
    },
    [wkfMigrationMap, getCurrentElement, getCurrentElements]
  );

  useEffect(() => {
    const wkfMigrationMap = {};
    if (!oldElements) return;
    Object.entries(oldElements).forEach(([key, value]) => {
      let values = {};
      value.elements.forEach((element) => {
        const value = getCurrentElement(key, element.id);
        if (element) {
          values[element.id] = value && value.id;
        }
      });
      if (key) {
        wkfMigrationMap[key] = values;
      }
    });
    setWkfMigrationMap(wkfMigrationMap);
  }, [oldElements, getCurrentElement]);

  const FormControl = ({ onChange, checked, label }) => {
    return (
      <Box d="flex" alignItems="center" gap={5}>
        <Switch
          size="lg"
          fontSize={5}
          checked={checked}
          color="primary"
          onChange={onChange}
          id={label}
        />
        <InputLabel htmlFor={label} color="body" mb={0}>
          {translate(label)}
        </InputLabel>
      </Box>
    );
  };

  return (
    <Dialog open={open} backdrop centered className={styles.dialogPaper}>
      <DialogHeader onCloseClick={onClose}>
        <DialogTitle>
          <strong>{translate("Node mapping")}</strong>
        </DialogTitle>
      </DialogHeader>
      <DialogContent className={styles.dialogContent}>
        {(wkf?.statusSelect === 1 || getBool(getNewVersionInfo())) &&
          oldElements && (
            <Box d="flex" justifyContent="space-around">
              <FormControl
                checked={isMigrateOld}
                onChange={() => {
                  setIsMigrateOld((isMigrateOld) => !isMigrateOld);
                }}
                label={translate("Migrate previous version records?")}
              />
              <FormControl
                checked={removeOldVersionMenu}
                onChange={() => {
                  setRemoveOldVersionMenu(
                    (removeOldVersionMenu) => !removeOldVersionMenu
                  );
                }}
                label={translate("Remove old version menu")}
              />
            </Box>
          )}
        {oldElements &&
          Object.entries(oldElements).map(([key, value]) => (
            <Box color="body" key={key} className={styles.process}>
              <InputLabel fontWeight="bolder" className={styles.processHeader}>
                {key}
              </InputLabel>
              <Box rounded={2} bgColor="body-tertiary" shadow>
                <Table size="sm" aria-label="a dense table">
                  <TableHead>
                    <TableRow>
                      <TableCell className={styles.tableHead} F>
                        {translate("Source node")}
                      </TableCell>
                      <TableCell className={styles.tableHead}>
                        {translate("Target node")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {value?.elements?.map((oldEle, index) => (
                      <TableRow key={index}>
                        <TableCell as="th" className={styles.tableCell}>
                          {oldEle.name}
                        </TableCell>
                        <TableCell as="th" className={styles.tableCell}>
                          <Select
                            className={styles.select}
                            isLabel={false}
                            options={getCurrentElements(key, oldEle.type)}
                            value={getValue(key, oldEle.id)}
                            update={(value) => handleAdd(oldEle, value, key)}
                            isTranslated={false}
                            optionLabel="name"
                            optionLabelSecondary="id"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ))}
      </DialogContent>
      <DialogFooter>
        <Button
          onClick={onClose}
          variant="secondary"
          className={styles.button}
        >
          {translate("Cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          className={styles.button}
          variant="primary"
        >
          {translate("OK")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
