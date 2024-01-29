import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import AlertDialog from "../../../../../components/AlertDialog";
import QueryBuilder from "../../../../../components/QueryBuilder";
import Select from "../../../../../components/Select";
import Tooltip from "../../../../../components/Tooltip";
import Service from "../../../../../services/Service";
import {
  TextField,
  SelectBox,
  Checkbox,
  FieldEditor,
  Textbox,
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
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  InputLabel,
  Box,
  Divider,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import Alert from "../../../../../components/Alert";

function nextId() {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("Process_");
}

const useStyles = makeStyles((theme) => ({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
  },
  linkIcon: {
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
    display: "inline-block",
    verticalAlign: "middle",
    marginTop: 3,
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(--ax-theme-panel-header-font-size, 1rem)",
  },
  save: {
    minWidth: 64,
    margin: theme.spacing(1),
    textTransform: "none",
  },
  newIcon: {
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
    minWidth: 300,
    fontSize: 16,
  },
  scriptDialog: {
    width: "100%",
    height: "100%",
  },
  parentPathDialog: {
    "& > div": {
      maxWidth: "90%",
      width: "fit-content",
      minWidth: 500,
    },
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
  setDummyProperty = () => {},
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
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");

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
        "danger",
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
          wkfModel: wkfProcess?.wkfModel,
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
      setDummyProperty({ bpmnModeler, element, value });
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
    [element, bpmnModeler]
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

  const getCallLinkCondition = () => {
    let condition = getProperty("condition");
    condition = (condition || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    return {
      condition,
    };
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
    if (!element) return;
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
          {index > 0 && <Divider className={classes.divider} />}
        </React.Fragment>
        <Box color="body" className={classes.groupLabel}>
          {translate(label)}
        </Box>
        <SelectBox
          element={element}
          entry={{
            id: "callActivity",
            label: "Call activity type",
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
              setDummyProperty({
                bpmnModeler,
                element,
                value: values?.callActivityType,
              });
              setCallActivityType(values.callActivityType);
              element.businessObject.calledElement = undefined;
              element.businessObject.calledElementBinding = undefined;
              element.businessObject.caseRef = undefined;
              setWkfModel(null);
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
                setDummyProperty({
                  bpmnModeler,
                  element,
                  value: values?.calledElement,
                });
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
                <Box
                  color="body"
                  onClick={handleClickOpen}
                  className={classes.link}
                >
                  <MaterialIcon
                    icon="edit"
                    fontSize={16}
                    className={classes.linkIcon}
                  />
                </Box>
                <Box
                  color="body"
                  onClick={addNewBPMRecord}
                  className={classes.link}
                >
                  <MaterialIcon
                    icon="add"
                    fontSize={16}
                    className={classes.linkIcon}
                  />
                </Box>
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
                    <MaterialIcon
                      fontSize={16}
                      icon="open_in_new"
                      className={classes.linkIcon}
                    />
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
                setDummyProperty({
                  bpmnModeler,
                  element,
                  value: values?.caseRef,
                });
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
        <Divider className={classes.divider} />
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
        <InputLabel color="body" className={classes.label}>
          {translate("Call model")}
        </InputLabel>
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
          <InputLabel color="body" className={classes.label}>
            {translate("Call link")}
          </InputLabel>
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
                  <Box color="body" className={classes.new}>
                    <MaterialIcon
                      icon="edit"
                      fontSize={16}
                      className={classes.newIcon}
                      onClick={() => {
                        setOpenParentPath(true);
                      }}
                    />
                  </Box>
                )}
              </>
            }
          />
          <Dialog
            open={openParentPath}
            centered
            backdrop
            className={classes.parentPathDialog}
          >
            <DialogHeader>
              <h3>{translate("Parent path")}</h3>
            </DialogHeader>
            <DialogContent d="flex" overflow="auto" alignItems="flex-end">
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
            <DialogFooter>
              <Button
                onClick={() => {
                  setOpenParentPath(false);
                  setParentPath(parentPathDummy);
                  setProperty("parentPath", parentPathDummy);
                }}
                variant="primary"
                className={classes.save}
              >
                {translate("OK")}
              </Button>
              <Button
                onClick={() => {
                  setOpenParentPath(false);
                }}
                variant="secondary"
                className={classes.save}
              >
                {translate("Cancel")}
              </Button>
            </DialogFooter>
          </Dialog>
          <TextField
            element={element}
            readOnly={!readOnly && model ? false : true}
            entry={{
              id: "condition",
              label: translate("Call link condition"),
              modelProperty: "condition",
              get: function () {
                return getCallLinkCondition();
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
                  <Box color="body" className={classes.new}>
                    <Tooltip title="Enable" aria-label="enable">
                      <i
                        className="fa fa-code"
                        style={{
                          fontSize: 18,
                          marginLeft: 5,
                        }}
                        onClick={() => {
                          if (readOnly) {
                            setAlertMessage(
                              "Link condition can't be managed using builder once changed manually."
                            );
                            setAlertTitle("Warning");
                            setAlert(true);
                          } else {
                            setScript(getCallLinkCondition()?.condition);
                            setOpenScriptDialog(true);
                          }
                        }}
                      ></i>
                    </Tooltip>
                    <MaterialIcon
                      icon="edit"
                      fontSize={16}
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
                  </Box>
                )}
              </>
            }
          />
          <Dialog
            open={openAlert}
            backdrop
            centered
            scrollable
            className={classes.dialog}
          >
            <DialogHeader onCloseClick={() => setAlert(false)}>
              <h3>{translate(alertTitle)}</h3>
            </DialogHeader>
            <DialogContent>
              <Box as="p" color="body" fontSize={5}>
                {translate(alertMessage)}
              </Box>
            </DialogContent>
            <DialogFooter>
              <Button
                onClick={() => {
                  setAlert(false);
                  setAlertMessage(null);
                  setAlertTitle(null);
                  setReadOnly(false);
                  setScript(getCallLinkCondition()?.condition);
                  setProperty("conditionValue", undefined);
                  setProperty("conditionCombinator", undefined);
                  setOpenScriptDialog(true);
                }}
                variant="primary"
                className={classes.save}
              >
                {translate("OK")}
              </Button>
              <Button
                className={classes.save}
                onClick={() => {
                  setAlert(false);
                }}
                variant="secondary"
              >
                {translate("Cancel")}
              </Button>
            </DialogFooter>
          </Dialog>
          <Divider className={classes.divider} />
        </React.Fragment>
        <AlertDialog
          className={classes.scriptDialog}
          openAlert={openScriptDialog}
          alertClose={() => {
            setScript(getCallLinkCondition()?.condition);
            setOpenScriptDialog(false);
          }}
          handleAlertOk={() => {
            setProperty(
              "condition",
              (script || "").replace(/[\u200B-\u200D\uFEFF]/g, "")
            );
            setOpenScriptDialog(false);
          }}
          title={translate("Call link condition")}
          children={
            <Textbox
              element={element}
              className={classes.textbox}
              showLabel={false}
              defaultHeight={window?.innerHeight - 205}
              entry={{
                id: "script",
                label: translate("Call link condition"),
                modelProperty: "condition",
                get: function () {
                  return { condition: script };
                },
                set: function (e, values) {
                  setScript(values?.condition);
                },
              }}
            />
          }
        />
        <Dialog open={open} backdrop centered className={classes.dialogPaper}>
          <DialogHeader onCloseClick={() => setOpen(false)}>
            <h3>{translate("Select BPMN")}</h3>
          </DialogHeader>
          <DialogContent style={{ minHeight: 90 }}>
            <InputLabel color="body" className={classes.label}>
              {translate("BPMN")}
            </InputLabel>
            <Select
              className={classes.select}
              update={(value) => {
                if (!value) return;
                setWkfModel({
                  ...value,
                  id: value.wkfModel?.id,
                  name: value.name,
                  processId: value.name || "",
                });
              }}
              value={wkfModel}
              name="wkfModel"
              fetchMethod={(options) => {
                return getBPMNModels({
                  data: {
                    criteria: [
                      {
                        fieldName: "wkfModel.statusSelect",
                        operator: "!=",
                        value: 3,
                      },
                      ...(options?.criteria || []),
                    ],
                  },
                });
              }}
              optionLabel="name"
            />
          </DialogContent>
          <DialogFooter>
            <Button
              onClick={handleClose}
              className={classes.save}
              variant="secondary"
            >
              {translate("Cancel")}
            </Button>
            <Button
              onClick={onConfirm}
              className={classes.save}
              variant="primary"
            >
              {translate("OK")}
            </Button>
          </DialogFooter>
        </Dialog>
        {openSnackbar.open && (
          <Alert
            open={openSnackbar.open}
            onClose={handleSnackbarClose}
            message={openSnackbar.message}
            messageType={openSnackbar.messageType}
          />
        )}
      </div>
    )
  );
}
