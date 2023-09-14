import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Tooltip,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Edit, NotInterested } from "@material-ui/icons";

import MapperBuilder from "../mapper-builder/App";
import { translate } from "../../utils";
import { Textbox, TextField } from "../components";

const useStyles = makeStyles((theme) => ({
  expressionBuilder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  new: {
    cursor: "pointer",
    marginTop: 18.6,
    display: "flex",
  },
  textbox: {
    width: "100%",
  },
  dialog: {
    minWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    textTransform: "none",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
}));

const createElement = (elementType, properties, parent, factory) => {
  let element = factory.create(elementType, properties);
  element.$parent = parent;
  return element;
};

export default function ScriptProps({ element, bpmnFactory, bpmnModeler }) {
  const [isReadOnly, setReadOnly] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [openMapper, setMapper] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  const classes = useStyles();

  const handleMapperOpen = () => {
    setMapper(true);
  };

  const handleCloseMapper = () => {
    setMapper(false);
  };

  const getPropertyValue = (name) => {
    if (!element) return;
    const bo = element.businessObject;
    return bo[name];
  };

  const setProperty = (name, value) => {
    if (!element) return;
    const bo = element.businessObject;
    if (!bo) return;
    bo[name] = value;
    if (!value) {
      delete bo[name];
    }
  };

  const onSave = (expr) => {
    const { resultField, resultMetaField, sourceField, targetField } =
      expr || {};
    updateScript(resultField, resultMetaField);
    setProperty("sourceField", sourceField);
    setProperty("targetField", targetField);
    handleCloseMapper();
  };

  const getExpression = () => {
    const bo = element && element.businessObject;
    if (!bo) return {};
    let script = bo.script && bo.script.value;
    let scriptMeta = bo.scriptMeta && bo.scriptMeta.value;

    return {
      resultField: script,
      resultMetaField: scriptMeta,
    };
  };

  const getProperty = React.useCallback(
    (name) => {
      let bo = element.businessObject;
      return (bo && bo[name] && bo[name].value) || "";
    },
    [element]
  );

  const updateScript = (scriptValue, scriptMetaValue) => {
    if (element.businessObject && element.businessObject.script) {
      element.businessObject.script.value = scriptValue;
    } else {
      const script = createElement(
        "bpmn:Script",
        { value: scriptValue },
        element.businessObject,
        bpmnFactory
      );
      element.businessObject.script = script;
    }
    if (element.businessObject && element.businessObject.scriptMeta) {
      element.businessObject.scriptMeta.value = scriptMetaValue;
    } else {
      const scriptMeta = createElement(
        "bpmn:ScriptMeta",
        { value: scriptMetaValue },
        element.businessObject,
        bpmnFactory
      );
      element.businessObject.scriptMeta = scriptMeta;
    }
    if (!scriptMetaValue) {
      delete element.businessObject["scriptMeta"];
    }
    if (!scriptValue) {
      delete element.businessObject["script"];
    }
  };

  useEffect(() => {
    const scriptMeta = getProperty("scriptMeta");
    setReadOnly(scriptMeta ? true : false);
  }, [getProperty]);

  return (
    <React.Fragment>
      <div className={classes.expressionBuilder}>
        <Textbox
          element={element}
          className={classes.textbox}
          rows={3}
          readOnly={isReadOnly}
          bpmnModeler={bpmnModeler}
          entry={{
            id: "script",
            label: translate("Script"),
            modelProperty: "script",
            name: "script",
            get: function () {
              const bo = element && element.businessObject;
              let script = bo && bo.script && bo.script.value;
              return {
                script: (script || "").replace(/[\u200B-\u200D\uFEFF]/g, ""),
              };
            },
            set: function (e, values) {
              updateScript(values.script, undefined);
            },
          }}
        />
        <div className={classes.new}>
          <Tooltip title={translate("Enable")} aria-label="enable">
            <NotInterested
              className={classes.newIcon}
              onClick={() => {
                if (isReadOnly) {
                  setAlertMessage(
                    "Script can't be managed using builder once changed manually."
                  );
                  setAlertTitle("Warning");
                  setAlert(true);
                }
              }}
            />
          </Tooltip>
          <Edit
            className={classes.newIcon}
            onClick={() => {
              handleMapperOpen();
            }}
          />
          {openMapper && (
            <MapperBuilder
              open={openMapper}
              handleClose={handleCloseMapper}
              bpmnModeler={bpmnModeler}
              onSave={(expr) => {
                onSave(expr);
                setReadOnly(true);
              }}
              params={() => getExpression()}
            />
          )}
          {openAlert && (
            <Dialog
              open={openAlert}
              onClose={(e, reason) => {
                if (reason !== "backdropClick") {
                  setAlert(false);
                }
              }}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              classes={{
                paper: classes.dialog,
              }}
            >
              <DialogTitle id="alert-dialog-title">
                <label className={classes.title}>{translate(alertTitle)}</label>
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {translate(alertMessage)}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setAlert(false);
                    setAlertMessage(null);
                    setAlertTitle(null);
                    setReadOnly(false);
                    if (element.businessObject) {
                      element.businessObject.scriptValue = undefined;
                    }
                  }}
                  color="primary"
                  className={classes.save}
                  autoFocus
                >
                  {translate("OK")}
                </Button>
                <Button
                  onClick={() => {
                    setAlert(false);
                  }}
                  color="primary"
                  className={classes.save}
                >
                  {translate("Cancel")}
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </div>
      </div>
      <TextField
        entry={{
          id: "sourceField",
          label: translate("Source field"),
          modelProperty: "sourceField",
          get: function () {
            return { sourceField: getPropertyValue("sourceField") };
          },
          set: function (e, values) {
            setProperty("sourceField", values.sourceField);
          },
        }}
        bpmnModeler={bpmnModeler}
        element={element}
        canRemove={true}
      />
      <TextField
        entry={{
          id: "targetField",
          label: translate("Target field"),
          modelProperty: "targetField",
          get: function () {
            return { targetField: getPropertyValue("targetField") };
          },
          set: function (e, values) {
            setProperty("targetField", values.targetField);
          },
        }}
        element={element}
        canRemove={true}
      />
    </React.Fragment>
  );
}
