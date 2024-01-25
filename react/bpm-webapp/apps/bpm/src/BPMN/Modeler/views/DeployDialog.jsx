import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";

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
} from "@axelor/ui";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    padding: 5,
    minWidth: 450,
  },
  dialogContent: {
    maxHeight: "50vh",
    overflow: "auto",
  },
  button: {
    minWidth: 64,
    margin: theme.spacing(1),
    textTransform: "none",
  },
  select: {
    minWidth: 250,
    marginLeft: 10,
  },
  tableCell: {
    padding: "0px 10px",
    textAlign: "center",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: 12,
    textAlign: "center",
  },
  process: {
    marginTop: 10,
  },
  processHeader: {
    marginBottom: 10,
    fontSize: 12,
  },
}));

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
  const classes = useStyles();

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
    const elements =
      currentProcess &&
      currentProcess.elements &&
      currentProcess.elements.filter((element) => element.type === elementType);
    return elements || [];
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
      return (
        (wkfMigrationMap &&
          wkfMigrationMap[processId] &&
          wkfMigrationMap[processId][elementId]) ||
        getCurrentElement(processId, elementId)
      );
    },
    [wkfMigrationMap, getCurrentElement]
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
          {label}
        </InputLabel>
      </Box>
    );
  };

  return (
    <Dialog open={open} backdrop centered className={classes.dialogPaper}>
      <DialogHeader onCloseClick={onClose}>
        <h3>
          <strong>{translate("Node mapping")}</strong>
        </h3>
      </DialogHeader>
      <DialogContent className={classes.dialogContent}>
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
            <Box color="body" key={key} className={classes.process}>
              <InputLabel fontWeight="bolder" className={classes.processHeader}>
                {key}
              </InputLabel>
              <Box rounded={2} bgColor="body-tertiary" shadow>
                <Table size="sm" aria-label="a dense table">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHead} F>
                        {translate("Source node")}
                      </TableCell>
                      <TableCell className={classes.tableHead}>
                        {translate("Target node")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {value?.elements?.map((oldEle, index) => (
                      <TableRow key={index}>
                        <TableCell as="th" className={classes.tableCell}>
                          {oldEle.name}
                        </TableCell>
                        <TableCell as="th" className={classes.tableCell}>
                          <Select
                            className={classes.select}
                            isLabel={false}
                            options={getCurrentElements(key, oldEle.type)}
                            value={getValue(key, oldEle.id)}
                            update={(value) => handleAdd(oldEle, value, key)}
                            isTranslated={false}
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
          onClick={onConfirm}
          className={classes.button}
          variant="primary"
        >
          {translate("OK")}
        </Button>
        <Button
          onClick={onClose}
          variant="secondary"
          className={classes.button}
        >
          {translate("Cancel")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
