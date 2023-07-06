import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Edit } from "@material-ui/icons";

import { Selection } from "../expression-builder/components";
import { getModels, getMetaFields } from "../../services/api";
import { FieldEditor } from "../components";
import { translate, lowerCaseFirstLetter } from "../../utils";
import { Textbox } from "../components";

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
  dialogContent: {
    display: "flex",
    alignItems: "flex-end",
  },
  MuiAutocompleteRoot: {
    width: "250px",
    marginRight: "10px",
  },
}));

export default function FieldBuilder({ element, bpmnModeler }) {
  const [openAlert, setAlert] = useState(false);
  const [openExpressionBuilder, setExpressionBuilder] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [expression, setExpression] = useState(null);
  const [expressionPathDummy, setExpressionPathDummy] = useState(null);
  const [field, setField] = useState(null);
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

  const getData = () => {
    return model
      ? {
          fullName: model.fullName,
          name: model.name,
          type: model.type,
        }
      : undefined;
  };

  useEffect(() => {
    async function fetchModel() {
      const expression = getProperty("expression");
      setExpression(expression);
      setExpressionPathDummy(expression);
      if (expression) {
        setField({
          type: "MANY_TO_MANY",
        });
      }
      const modelName =
        expression && expression.split("?.") && expression.split("?.")[0];
      if (!modelName) {
        setModel(null);
        return;
      }
      const criteria = {
        criteria: [
          {
            fieldName: "name",
            operator: "like",
            value: modelName,
          },
        ],
        operator: "and",
      };
      const metaModels = await getModels(criteria);
      setModel(metaModels && metaModels[0]);
    }
    fetchModel();
  }, [getProperty]);

  return (
    <div className={classes.expressionBuilder}>
      <Textbox
        element={element}
        className={classes.textbox}
        bpmnModeler={bpmnModeler}
        entry={{
          id: "expression",
          label: translate("Expression"),
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
            if (!values.expression || values.expression === "") {
              setExpression(null);
              setModel(null);
              setExpressionPathDummy(null);
            }
            setProperty(
              "expression",
              values.expression === "" ? undefined : values.expression
            );
          },
        }}
      />
      <div className={classes.new}>
        <Edit
          className={classes.newIcon}
          onClick={() => {
            handleOpen();
          }}
        />
        {openExpressionBuilder && (
          <Dialog
            open={openExpressionBuilder}
            onClose={(event, reason) => {
              if (reason !== "backdropClick") {
                handleClose();
              }
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            classes={{
              paper: classes.dialog,
            }}
          >
            <DialogTitle id="alert-dialog-title">
              {translate("Expression")}
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
              <Selection
                name="model"
                title="Model"
                placeholder="Model"
                fetchAPI={() => getModels()}
                onChange={(e) => {
                  if (!e) {
                    setExpressionPathDummy(null);
                  }
                  setModel(e);
                }}
                optionLabelKey="name"
                value={model}
                classes={{ root: classes.MuiAutocompleteRoot }}
              />
              {model && (
                <FieldEditor
                  getMetaFields={() => getMetaFields(getData())}
                  isCollection={true}
                  onChange={(val, field) => {
                    if (val && val !== "") {
                      setExpressionPathDummy(
                        `${model && lowerCaseFirstLetter(model.name)}?.${val}`
                      );
                    } else {
                      setExpressionPathDummy(null);
                    }
                    setField(field);
                  }}
                  value={{
                    fieldName:
                      expressionPathDummy &&
                      expressionPathDummy.split("?.") &&
                      expressionPathDummy.split("?.")[1],
                  }}
                  isParent={true}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  if (
                    !["MANY_TO_MANY", "ONE_TO_MANY"].includes(
                      field && field.type && field.type.toUpperCase()
                    ) &&
                    model
                  ) {
                    setAlertMessage(
                      "Last field selected  must be of O2M or M2M type"
                    );
                    setAlert(true);
                    return;
                  }
                  setExpression(expressionPathDummy);
                  setProperty("expression", expressionPathDummy);
                  handleClose();
                }}
                color="primary"
                autoFocus
                className={classes.save}
              >
                {translate("OK")}
              </Button>
              <Button
                onClick={() => {
                  setExpressionPathDummy(expression);
                  handleClose();
                }}
                color="primary"
                className={classes.save}
              >
                {translate("Cancel")}
              </Button>
            </DialogActions>
          </Dialog>
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
  );
}
