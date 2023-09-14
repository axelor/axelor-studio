import React, { useEffect, useState } from "react";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Button,
  Snackbar,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import classnames from "classnames";
import { Edit, NotInterested, Add } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import QueryBuilder from "../../../../../components/QueryBuilder";
import Select from "../../../../../components/Select";
import Tooltip from "../../../../../components/Tooltip";
import Service from "../../../../../services/Service";
import {
  TextField,
  SelectBox,
  Checkbox,
  FieldEditor,
} from "../../../../../components/properties/components";
import { translate, getLowerCase, getBool } from "../../../../../utils";
import {
  getBPMNModels,
  getCustomModels,
  getMetaModels,
  getMetaFields,
  fetchModels,
} from "../../../../../services/api";
import { openWebApp } from "./utils";
import Ids from "ids";

function nextId() {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("Process_");
}

const useStyles = makeStyles((theme) => ({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  linkIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  link: {
    cursor: "pointer",
  },
  dialogPaper: {
    padding: 5,
    minWidth: 450,
    overflow: "auto",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginTop: 3,
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
  expressionBuilder: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  newIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  new: {
    cursor: "pointer",
    display: "flex",
  },
  dialog: {
    minWidth: 300,
  },
  select: {
    margin: 0,
  },
  dialogContent: {
    display: "flex",
    alignItems: "flex-end",
  },
}));

function getCallableType(bo) {
  let boCalledElement = bo.get("calledElement"),
    boCaseRef = bo.get("camunda:caseRef");
  let callActivityType = "";
  if (typeof boCalledElement !== "undefined") {
    callActivityType = "bpmn";
  } else if (typeof boCaseRef !== "undefined") {
    callActivityType = "cmmn";
  }
  return callActivityType;
}

export default function CallActivityProps({
  element,
  index,
  label,
  bpmnModeler,
}) {
  const [isVisible, setVisible] = useState(false);
  const [custom, setCustom] = useState(false);
  const [callActivityType, setCallActivityType] = useState("bpmn");
  const [wkfModel, setWkfModel] = useState(null);
  const [open, setOpen] = useState(false);
  const [openCondition, setOpenCondition] = useState(false);
  const [model, setModel] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [openAlert, setAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [openParentPath, setOpenParentPath] = useState(false);
  const [parentPathDummy, setParentPathDummy] = useState(null);
  const [parentPath, setParentPath] = useState(null);
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const classes = useStyles();
  const id = nextId();
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseCondition = () => {
    setOpenCondition(false);
  };

  const getter = () => {
    const value = getProperty("conditionValue");
    const combinator = getProperty("conditionCombinator");
    const checked = getBool(getProperty("checked"));

    let values;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
      } catch (errror) {}
    }
    return { values: values, combinator, checked };
  };

  const setter = (val) => {
    const { expression, value, combinator, checked } = val;
    setProperty("condition", expression);
    if (value === "" || value === null || value === undefined) {
      setProperty("conditionValue", value);
    }
    if (value) {
      setProperty("conditionValue", value);
      setReadOnly(true);
    }
    if (combinator) {
      setProperty("conditionCombinator", combinator);
    }
    setProperty("checked", checked);
  };

  const onConfirm = () => {
    if (wkfModel) {
      if (element && element.businessObject) {
        element.businessObject.calledElement = wkfModel.processId;
      }
    }
    handleClose();
  };

  const handleSnackbarClick = (messageType, message) => {
    setSnackbar({
      open: true,
      messageType,
      message,
    });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({
      open: false,
      messageType: null,
      message: null,
    });
  };

  const checkId = async (id) => {
    const model = await Service.search("com.axelor.studio.db.WkfModel", {
      data: {
        _domain: `self.code = '${id}'`,
      },
      limit: 1,
    });
    if (model.total > 0) {
      let newId = nextId();
      checkId(newId);
    } else {
      return id;
    }
  };

  const addNewBPMRecord = async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
      <bpmn2:definitions 
        xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" 
        xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
        xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
        id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn2:process id="${id}" isExecutable="true">
          <bpmn2:startEvent id="StartEvent_1" />
        </bpmn2:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${id}">
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1" bioc:stroke="#55c041" bioc:fill="#ccecc6">
              <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0" />
            </bpmndi:BPMNShape>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn2:definitions>`;

    const uniqueCode = await checkId(id);
    let res = await Service.add("com.axelor.studio.db.WkfModel", {
      name: uniqueCode,
      code: uniqueCode,
      diagramXml: xml,
      generatedFromCallActivity: true,
    });
    const wkfModel = res && res.data && res.data[0];
    if (wkfModel) {
      element.businessObject.calledElement = uniqueCode;
      setWkfModel(wkfModel);
      handleSnackbarClick("success", "New process added successfully");
      if (wkfModel.id) {
        openWebApp(`wkf-editor/?id=${wkfModel.id}`, translate("BPM editor"));
      }
    } else {
      handleSnackbarClick(
        "error",
        (res && res.data && (res.data.message || res.data.title)) || "Error"
      );
    }
  };

  const updateModel = React.useCallback(
    async (userInput) => {
      const wkfProcessRes = await getBPMNModels({
        data: {
          criteria: [
            {
              fieldName: "processId",
              operator: "=",
              value: userInput,
            },
            {
              fieldName: "name",
              operator: "=",
              value: userInput,
            },
          ],
          operator: "or",
        },
      });
      const wkfProcess = wkfProcessRes && wkfProcessRes[0];
      if (!wkfProcess) {
        const model = await Service.search("com.axelor.studio.db.WkfModel", {
          data: {
            _domain: `self.code = '${userInput}' AND self.generatedFromCallActivity is true`,
          },
          limit: 1,
        });
        const data = model && model.data && model.data[0];
        if (data) {
          setWkfModel(data);
          if (element) {
            element.businessObject.calledElement = data.code;
          }
        }
      } else {
        setWkfModel({
          name: wkfProcess.name,
          id: wkfProcess.wkfModel && wkfProcess.wkfModel.id,
          processId: wkfProcess.name,
        });
        if (element && element.businessObject) {
          element.businessObject.calledElement = wkfProcess.name;
        }
      }
    },
    [element]
  );

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}Name`, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}Name`, value["fullName"] || value["name"]);
  };

  const updateSelectValue = (name, value, label, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if (is(element, "bpmn:Participant")) {
        bo = getBusinessObject(element).get("processRef");
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const setProperty = React.useCallback(
    (name, value) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      let propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (value === undefined) {
        delete bo.$attrs[propertyName];
      }
    },
    [element]
  );

  const getSelectValue = React.useCallback(
    (name) => {
      let label = getProperty(`${name}Label`);
      let newName = getProperty(name);
      let fullName = getProperty(`${name}Name`);
      if (newName) {
        let value = { name: newName, fullName };
        if (label) {
          value.title = label;
        }
        return value;
      } else {
        return null;
      }
    },
    [getProperty]
  );

  const updateCallActivitiyFields = () => {
    setParentPath(null);
    setParentPathDummy(null);
    setProperty("parentPath", undefined);
    setProperty("condition", undefined);
    setProperty("conditionValue", undefined);
    setProperty("conditionCombinator", undefined);
    setReadOnly(false);
  };

  useEffect(() => {
    if (is(element, "camunda:CallActivity")) {
      let bo = getBusinessObject(element);
      const callActivityType = getCallableType(bo) || "bpmn";
      setVisible(true);
      setCallActivityType(callActivityType);
    } else {
      setVisible(false);
    }
  }, [element]);

  useEffect(() => {
    const bo = getBusinessObject(element);
    updateModel(bo.calledElement);
  }, [element, updateModel]);

  useEffect(() => {
    const conditionValue = getProperty("conditionValue");
    const custom = getBool(getProperty("custom"));
    const parentPath = getProperty("parentPath");
    const model = getSelectValue("model");
    setParentPath(parentPath);
    setParentPathDummy(parentPath);
    setCustom(custom);
    setModel(
      custom
        ? { ...(model || {}), type: "metaJsonModel" }
        : { ...(model || {}), type: "metaModel" }
    );
    if (conditionValue) {
      setReadOnly(true);
    } else {
      setReadOnly(false);
    }
  }, [getProperty, getSelectValue]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{translate(label)}</div>
        <SelectBox
          element={element}
          entry={{
            id: "callActivity",
            label: "CallActivity type",
            modelProperty: "callActivityType",
            selectOptions: [
              { name: "BPMN", value: "bpmn" },
              { name: "CMMN", value: "cmmn" },
            ],
            emptyParameter: true,
            get: function () {
              return { callActivityType: callActivityType };
            },

            set: function (element, values) {
              setCallActivityType(values.callActivityType);
            },
          }}
        />
        {callActivityType === "bpmn" && (
          <TextField
            element={element}
            entry={{
              id: "calledElement",
              label: translate("Called element"),
              modelProperty: "calledElement",
              get: function () {
                const bo = getBusinessObject(element);
                return { calledElement: bo && bo.calledElement };
              },
              set: function (e, values) {
                if (!values.calledElement || values.calledElement === "") {
                  setWkfModel(undefined);
                }
                element.businessObject.calledElement = values.calledElement;
                element.businessObject.calledElementBinding = "latest";
                element.businessObject.caseRef = undefined;
                updateModel(values.calledElement);
              },
              validate: function (e, values) {
                if (!values.calledElement && callActivityType === "bpmn") {
                  return { calledElement: translate("Must provide a value") };
                }
              },
            }}
            canRemove={true}
            endAdornment={
              <>
                <div onClick={handleClickOpen} className={classes.link}>
                  <Edit className={classes.linkIcon} />
                </div>
                <div onClick={addNewBPMRecord} className={classes.link}>
                  <Add className={classes.linkIcon} />
                </div>
                {wkfModel && (
                  <div
                    onClick={() => {
                      openWebApp(
                        `wkf-editor/?id=${wkfModel.id || ""}`,
                        translate("BPM editor")
                      );
                    }}
                    className={classes.link}
                  >
                    <OpenInNewIcon className={classes.linkIcon} />
                  </div>
                )}
              </>
            }
          />
        )}
        {callActivityType === "cmmn" && (
          <TextField
            element={element}
            entry={{
              id: "caseRef",
              label: translate("Case ref"),
              modelProperty: "caseRef",
              get: function () {
                const bo = getBusinessObject(element);
                return { caseRef: bo && bo.caseRef };
              },
              set: function (e, values) {
                element.businessObject.caseRef = values.caseRef;
                element.businessObject.calledElement = undefined;
                element.businessObject.caseBinding = "latest";
              },
              validate: function (e, values) {
                if (!values.caseRef && callActivityType === "cmmn") {
                  return { caseRef: translate("Must provide a value") };
                }
              },
            }}
            canRemove={true}
          />
        )}
        <div className={classes.divider} />
        <Checkbox
          element={element}
          entry={{
            id: "custom",
            label: translate("Custom"),
            modelProperty: "custom",
            get: function () {
              return {
                custom: custom,
              };
            },
            set: function (e, value) {
              const custom = !value.custom;
              setCustom(custom);
              setProperty("custom", custom);
            },
          }}
        />
        <label className={classes.label}>{translate("Call model")}</label>
        {custom ? (
          <Select
            className={classnames(classes.select, classes.metajsonModel)}
            fetchMethod={(options) => getCustomModels(options)}
            update={(value, label) => {
              setModel(
                value ? { ...(value || {}), type: "metaJsonModel" } : undefined
              );
              updateCallActivitiyFields();
              updateSelectValue("model", value, label);
            }}
            name="model"
            value={model}
            placeholder={translate("Call model")}
            isLabel={false}
            optionLabel="name"
            optionLabelSecondary="title"
          />
        ) : (
          <Select
            className={classes.select}
            fetchMethod={(options) => getMetaModels(options)}
            update={(value, label) => {
              const val = value
                ? { ...(value || {}), type: "metaModel" }
                : undefined;
              setModel(val);
              updateCallActivitiyFields();
              updateSelectValue("model", value, label);
            }}
            name="model"
            value={model}
            isLabel={false}
            placeholder={translate("Call model")}
            optionLabel="name"
            optionLabelSecondary="title"
          />
        )}
        <React.Fragment>
          <label className={classes.label}>{translate("Call link")}</label>
          <TextField
            element={element}
            canRemove={true}
            rootClass={classes.textFieldRoot}
            labelClass={classes.textFieldLabel}
            clearClassName={classes.clearClassName}
            readOnly={model ? false : true}
            entry={{
              id: `parentPath`,
              name: "parentPath",
              modelProperty: "parentPath",
              get: function () {
                return {
                  parentPath: parentPath,
                };
              },
              set: function (e, value) {
                setParentPath(value.parentPath);
                setProperty("parentPath", value.parentPath);
              },
            }}
            endAdornment={
              <>
                {model && (
                  <div className={classes.new}>
                    <Edit
                      className={classes.newIcon}
                      onClick={() => {
                        setOpenParentPath(true);
                      }}
                    />
                  </div>
                )}
              </>
            }
          />
          {openParentPath && (
            <Dialog
              open={openParentPath}
              onClose={(e, reason) => {
                if (reason !== "backdropClick") {
                  setOpenParentPath(false);
                }
              }}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              classes={{
                paper: classes.dialog,
              }}
            >
              <DialogTitle id="alert-dialog-title">
                {translate("Parent path")}
              </DialogTitle>
              <DialogContent className={classes.dialogContent}>
                <FieldEditor
                  getMetaFields={() => getMetaFields(model)}
                  onChange={(val, field) => {
                    setParentPathDummy(val);
                  }}
                  value={{
                    fieldName: parentPathDummy,
                  }}
                  isParent={true}
                  allowAllFields={true}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setOpenParentPath(false);
                    setParentPath(parentPathDummy);
                    setProperty("parentPath", parentPathDummy);
                  }}
                  color="primary"
                  className={classes.save}
                >
                  {translate("OK")}
                </Button>
                <Button
                  onClick={() => {
                    setOpenParentPath(false);
                  }}
                  color="primary"
                  className={classes.save}
                >
                  {translate("Cancel")}
                </Button>
              </DialogActions>
            </Dialog>
          )}
          <TextField
            element={element}
            readOnly={!readOnly && model ? false : true}
            entry={{
              id: "condition",
              label: translate("Call link condition"),
              modelProperty: "condition",
              get: function () {
                let condition = getProperty("condition");
                condition = (condition || "").replace(
                  /[\u200B-\u200D\uFEFF]/g,
                  ""
                );
                return {
                  condition,
                };
              },
              set: function (e, values) {
                let oldVal = getProperty("condition");
                let currentVal = values["condition"];
                (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                setProperty("condition", currentVal);
                if (getLowerCase(oldVal) !== getLowerCase(currentVal)) {
                  setProperty("conditionValue", undefined);
                  setProperty("conditionCombinator", undefined);
                }
              },
            }}
            canRemove={true}
            endAdornment={
              <>
                {model && (
                  <div className={classes.new}>
                    <Tooltip title="Enable" aria-label="enable">
                      <NotInterested
                        className={classes.newIcon}
                        onClick={() => {
                          if (readOnly) {
                            setAlertMessage(
                              "Completed If can't be managed using builder once changed manually."
                            );
                            setAlertTitle("Warning");
                            setAlert(true);
                          }
                        }}
                      />
                    </Tooltip>
                    <Edit
                      className={classes.newIcon}
                      onClick={() => setOpenCondition(true)}
                    />
                    {openCondition && (
                      <QueryBuilder
                        open={setOpenCondition}
                        close={handleCloseCondition}
                        title="Add expression"
                        setProperty={setter}
                        getExpression={getter}
                        defaultModel={model}
                        fetchModels={() => fetchModels(element)}
                      />
                    )}
                  </div>
                )}
              </>
            }
          />
          {openAlert && (
            <Dialog
              open={openAlert}
              onClose={(event, reason) => {
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
                {translate(alertTitle)}
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
                    setProperty("conditionValue", undefined);
                    setProperty("conditionCombinator", undefined);
                  }}
                  color="primary"
                  className={classes.save}
                >
                  {translate("OK")}
                </Button>
                <Button
                  className={classes.save}
                  onClick={() => {
                    setAlert(false);
                  }}
                  color="primary"
                >
                  {translate("Cancel")}
                </Button>
              </DialogActions>
            </Dialog>
          )}
          <div className={classes.divider} />
        </React.Fragment>
        {open && (
          <Dialog
            open={open}
            onClose={(event, reason) => {
              if (reason !== "backdropClick") {
                handleClose();
              }
            }}
            aria-labelledby="form-dialog-title"
            maxWidth="sm"
            classes={{
              paper: classes.dialogPaper,
            }}
          >
            <DialogTitle id="form-dialog-title">
              {translate("Select BPMN")}
            </DialogTitle>
            <DialogContent>
              <label className={classes.label}>{translate("BPMN")}</label>
              <Select
                className={classes.select}
                update={(value) => {
                  if (!value) return;
                  setWkfModel({
                    id: value.wkfModel.id,
                    name: `${value.wkfModel.name} (${value.name})`,
                    processId: value.name,
                  });
                }}
                name="wkfModel"
                isLabel={true}
                fetchMethod={(options) => getBPMNModels(options)}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                className={classes.save}
                color="primary"
                variant="outlined"
              >
                {translate("Cancel")}
              </Button>
              <Button
                onClick={onConfirm}
                className={classes.save}
                color="primary"
                variant="outlined"
              >
                {translate("OK")}
              </Button>
            </DialogActions>
          </Dialog>
        )}
        {openSnackbar.open && (
          <Snackbar
            open={openSnackbar.open}
            autoHideDuration={2000}
            onClose={handleSnackbarClose}
          >
            <Alert
              elevation={6}
              variant="filled"
              onClose={handleSnackbarClose}
              className="snackbarAlert"
              severity={openSnackbar.messageType}
            >
              {translate(openSnackbar.message)}
            </Alert>
          </Snackbar>
        )}
      </div>
    )
  );
}
