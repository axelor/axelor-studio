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

import ExpressionBuilder from "../expression-builder/index";
import { translate } from "../../utils";
import { Select, Checkbox, Textbox } from "../components";
import { getBool } from "../../utils";
import { getCustomModels, getMetaModels, getModels } from "../../services/api";

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

export default function ExtendedQueryProps({ element, bpmnModeler }) {
  const [isJson, setIsJson] = useState(false);
  const [isReadOnly, setReadOnly] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [openExpressionBuilder, setExpressionBuilder] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [model, setModel] = useState(null);
  const classes = useStyles();

  const setProperty = (name, value) => {
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get("modeling");
    modeling.updateProperties(element, {
      [name]: value,
    });
  };

  const getProperty = React.useCallback(
    (name) => {
      return element.businessObject[name];
    },
    [element]
  );

  const handleOpen = () => {
    setExpressionBuilder(true);
  };

  const handleClose = () => {
    setExpressionBuilder(false);
  };

  useEffect(() => {
    async function fetchModel() {
      const name = getProperty("model");
      const isJson = getProperty("isJson");
      if (!name) {
        setModel(null);
        return;
      }
      const criteria = {
        criteria: [
          {
            fieldName: "name",
            operator: "=",
            value: name,
          },
        ],
        operator: "and",
      };
      const metaModels = await getModels(
        criteria,
        isJson ? "metaJsonModel" : "metaModel"
      );
      setModel(metaModels && metaModels[0]);
    }
    const isJson = getProperty("isJson");
    setIsJson(isJson);
    setReadOnly(getProperty("expressionValue") ? true : false);
    fetchModel();
  }, [getProperty]);

  return (
    <div>
      <Checkbox
        entry={{
          id: "isJson",
          label: translate("Is json"),
          modelProperty: "isJson",
          widget: "checkbox",
          get: function () {
            return { isJson: getBool(isJson) };
          },
          set: function (e, value) {
            let isJson = value.isJson;
            setIsJson(isJson);
            setProperty("isJson", isJson);
          },
        }}
        element={element}
      />
      <Select
        element={element}
        bpmnModeler={bpmnModeler}
        entry={{
          fetchMethod: () => (isJson ? getCustomModels() : getMetaModels()),
          name: "model",
          label: translate("Model"),
        }}
        value={model}
        onChange={(value) => {
          setModel(
            value
              ? {
                  ...(value || {}),
                  type: isJson ? "metaJsonModel" : "metaModel",
                }
              : undefined
          );
        }}
      />
      <div className={classes.expressionBuilder}>
        <Textbox
          element={element}
          className={classes.textbox}
          readOnly={isReadOnly || !model || model === "" ? true : false}
          bpmnModeler={bpmnModeler}
          entry={{
            id: "expression",
            label: translate("Query"),
            modelProperty: "expression",
            name: "expression",
            get: function () {
              let expression = getProperty("expression");
              return {
                expression: (expression || "").replace(
                  /[\u200B-\u200D\uFEFF]/g,
                  ""
                ),
              };
            },
            set: function (e, values) {
              setProperty(
                "expression",
                values.expression === "" ? undefined : values.expression
              );
            },
          }}
        />
        {model && (
          <div className={classes.new}>
            <Tooltip title={translate("Enable")} aria-label="enable">
              <NotInterested
                className={classes.newIcon}
                onClick={() => {
                  if (isReadOnly) {
                    setAlertMessage(
                      "Query can't be managed using builder once changed manually."
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
                handleOpen();
              }}
            />
            {openExpressionBuilder && (
              <ExpressionBuilder
                open={openExpressionBuilder}
                handleClose={() => handleClose()}
                type="bpmQuery"
                defaultModel={model}
                getExpression={() => {
                  const value = getProperty("expressionValue");
                  let values;
                  if (value !== undefined) {
                    try {
                      values = JSON.parse(value);
                      if (!values.length) {
                        values = null;
                      }
                    } catch (errror) {}
                  }
                  return { values: values, combinator: undefined };
                }}
                setProperty={(val) => {
                  const { expression, value } = val;
                  setProperty("expression", expression);
                  if (
                    expression === "" ||
                    expression === null ||
                    expression === undefined
                  ) {
                    setProperty("expressionValue", undefined);
                    return;
                  }
                  if (value) {
                    (value || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                    setProperty("expressionValue", value);
                    setReadOnly(true);
                  }
                }}
                element={element}
                title={"Add query"}
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
                  <label className={classes.title}>
                    {translate(alertTitle)}
                  </label>
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
                      setProperty("expressionValue", undefined);
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
        )}
      </div>
    </div>
  );
}
