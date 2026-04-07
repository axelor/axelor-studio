import React, { useState, useEffect } from "react";
import { translate } from "@studio/shared/i18n";
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
} from "@axelor/ui";

import Select from "../../../components/Select";

import styles from "./deploy-dialog.module.css";

interface DeployElementEntry {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

interface DeployElementInfo {
  elements: Array<DeployElementEntry>;
}

interface DeployIds {
  oldElements?: Record<string, DeployElementInfo>;
  currentElements?: Record<string, DeployElementInfo>;
}

interface DeployDialogProps {
  open: boolean;
  onClose: () => void;
  ids: DeployIds | null;
  onOk: (wkfMigrationMap: unknown, isMigrateOld: boolean) => void;
  element: unknown;
}

export default function DeployDialog({
  open,
  onClose,
  ids,
  onOk,
  element: _element,
}: DeployDialogProps) {
  const { oldElements, currentElements } = ids ?? {};
  const [wkfMigrationMap, setWkfMigrationMap] = useState<
    Record<string, Record<string, string | undefined>>
  >({});
  const [isMigrateOld, setIsMigrateOld] = useState(false);
  const [removeOldVersionMenu, setRemoveOldVersionMenu] = useState(false);

  const handleAdd = (
    oldEle: DeployElementEntry | null,
    newEle: DeployElementEntry | null,
    processId: string,
  ) => {
    const cloneWkfMigrationMap = { ...wkfMigrationMap };
    cloneWkfMigrationMap[processId] = {
      ...cloneWkfMigrationMap[processId],
      [String(oldEle?.id ?? "")]: newEle?.id,
    };
    setWkfMigrationMap(cloneWkfMigrationMap);
  };

  const onConfirm = () => {
    onOk(
      {
        ...wkfMigrationMap,
        props: { removeOldVersionMenu: JSON.stringify(removeOldVersionMenu) },
      },
      isMigrateOld,
    );
  };

  const getCurrentElements = (
    processId: string,
    elementType: string,
  ): Array<DeployElementEntry> => {
    const currentProcess = currentElements?.[processId];
    return currentProcess?.elements?.filter((element) => element?.type === elementType) || [];
  };

  const getCurrentElement = React.useCallback(
    (processId: string, elementId: string) => {
      if (!currentElements) return undefined;
      const currentProcess = currentElements[processId];
      const element =
        currentProcess &&
        currentProcess.elements &&
        currentProcess.elements.find((element) => element.id === elementId);
      return element;
    },
    [currentElements],
  );

  const getValue = React.useCallback(
    (processId: string, elementId: string) => {
      if (!currentElements) return undefined;
      const currentProcess = currentElements[processId];
      return (
        currentProcess?.elements?.find(
          (e) =>
            e.id ===
            (wkfMigrationMap &&
              wkfMigrationMap[processId] &&
              wkfMigrationMap[processId][elementId]),
        ) || getCurrentElement(processId, elementId)
      );
    },
    [wkfMigrationMap, getCurrentElement, currentElements],
  );

  useEffect(() => {
    const migrationMap: Record<string, Record<string, string | undefined>> = {};
    if (!oldElements) return;
    Object.entries(oldElements).forEach(([key, value]) => {
      const values: Record<string, string | undefined> = {};
      value.elements.forEach((element) => {
        const found = getCurrentElement(key, element.id);
        if (element) {
          values[element.id] = found?.id;
        }
      });
      if (key) {
        migrationMap[key] = values;
      }
    });
    setWkfMigrationMap(migrationMap);
  }, [oldElements, getCurrentElement]);

  const FormControl = ({
    onChange,
    checked,
    label,
  }: {
    onChange: () => void;
    checked: boolean;
    label: string;
  }) => {
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
        <h3>
          <strong>{translate("Node mapping")}</strong>
        </h3>
      </DialogHeader>
      <DialogContent className={styles.dialogContent}>
        {oldElements && (
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
                setRemoveOldVersionMenu((removeOldVersionMenu) => !removeOldVersionMenu);
              }}
              label={translate("Remove old version menu")}
            />
          </Box>
        )}
        <Box className={styles.processContainer}>
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
                        <TableCell className={styles.tableHead}>
                          {translate("Source node")}
                        </TableCell>
                        <TableCell className={styles.tableHead}>
                          {translate("Target node")}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {value?.elements?.map((oldEle, index: number) => (
                        <TableRow key={index}>
                          <TableCell as="th" className={styles.tableCell}>
                            {oldEle.name}
                          </TableCell>
                          <TableCell as="th" className={styles.tableCell}>
                            <Select
                              name="target-node"
                              className={styles.select}
                              isLabel={false}
                              options={getCurrentElements(key, oldEle.type)}
                              value={getValue(key, oldEle.id)}
                              update={(value: DeployElementEntry) =>
                                handleAdd(oldEle, value, key)
                              }
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
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button onClick={onConfirm} className={styles.button} variant="primary">
          {translate("OK")}
        </Button>
        <Button onClick={onClose} variant="secondary" className={styles.button}>
          {translate("Cancel")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
