import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  DialogTitle,
  Typography,
  Switch,
  FormControlLabel,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import Select from "../../../components/Select";
import { translate } from "../../../utils";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    padding: 5,
    minWidth: 450,
    overflow: "auto",
  },
  button: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  select: {
    minWidth: 250,
    marginLeft: 10,
  },
  tableCell: {
    padding: "0px 10px",
    textAlign: "left",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: 12,
  },
  process: {
    marginTop: 10,
  },
  processHeader: {
    marginBottom: 10,
    fontSize: 12,
  },
}));

export default function DeployDialog({ open, onClose, ids, onOk, wkf }) {
  const { oldElements, currentElements } = ids || {};
  const [wkfMigrationMap, setWkfMigrationMap] = useState({});
  const [isMigrateOld, setIsMigrateOld] = useState(true);
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
    onOk(wkfMigrationMap, isMigrateOld);
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

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          onClose(event);
        }
      }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle>
        <strong>{translate("Node mapping")}</strong>
      </DialogTitle>
      <DialogContent>
        {wkf && wkf.statusSelect === 1 && oldElements && (
          <FormControlLabel
            control={
              <Switch
                checked={isMigrateOld}
                onChange={() => {
                  setIsMigrateOld((isMigrateOld) => !isMigrateOld);
                }}
                color="primary"
                name="isMigrateOld"
              />
            }
            label={translate("Migrate previous version records?")}
          />
        )}
        {oldElements &&
          Object.entries(oldElements).map(([key, value]) => (
            <div key={key} className={classes.process}>
              <Typography className={classes.processHeader}>
                <strong>{key}</strong>
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="a dense table">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHead} align="center">
                        {translate("Old node")}
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        {translate("Current node")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {value.elements &&
                      value.elements.map((oldEle, index) => (
                        <TableRow key={index}>
                          <TableCell
                            component="th"
                            scope="row"
                            align="center"
                            className={classes.tableCell}
                          >
                            {oldEle.name}
                          </TableCell>
                          <TableCell
                            component="th"
                            scope="row"
                            align="center"
                            className={classes.tableCell}
                          >
                            <Select
                              className={classes.select}
                              isLabel={false}
                              options={getCurrentElements(key, oldEle.type)}
                              defaultValue={
                                getCurrentElement(key, oldEle.id) || {}
                              }
                              update={(value) => handleAdd(oldEle, value, key)}
                              isTranslated={false}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          ))}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onConfirm}
          className={classes.button}
          color="primary"
          variant="outlined"
        >
          {translate("OK")}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          className={classes.button}
          style={{
            textTransform: "none",
          }}
        >
          {translate("Cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
