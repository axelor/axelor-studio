import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Tooltip,
  Card,
  CardContent,
} from "@material-ui/core";
import { Add, Edit, Close, ReportProblem } from "@material-ui/icons";

import Select from "../../../../../components/Select";
import AlertDialog from "../../../../../components/AlertDialog";
import ProcessConfigTitleTranslation from "./ProcessConfigTitleTranslation";
import {
  TextField,
  Checkbox,
  FieldEditor,
  Textbox,
} from "../../../../../components/properties/components";
import {
  getMetaModels,
  getCustomModels,
  getProcessConfigModel,
  getMetaFields,
  fetchModels,
} from "../../../../../services/api";
import QueryBuilder from "../../../../../components/QueryBuilder";
import { translate, getBool } from "../../../../../utils";
import {
  getProcessConfig,
  createProcessConfiguration,
  createParameter,
} from "./utils";
import {
  addTranslations,
  removeAllTranslations,
} from "../../../../../services/api";

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
  button: {
    textTransform: "none",
  },
  reportTypography: {
    display: "flex",
    alignItems: "center",
    color: "#999",
    margin: "10px 0px",
  },
  newIcon: {
    marginInline: 2,
    color: "#58B423",
    cursor: "pointer",
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
  clearClassName: {
    paddingLeft: 10,
  },
  dialogContent: {
    display: "flex",
    alignItems: "flex-end",
  },
  grid: {
    padding: "0px 15px 0px 0px",
  },
  card: {
    margin: "5px 0px 10px 0px",
    boxShadow: "none",
    width: "100%",
    border: "1px solid #ccc",
    background: "#f8f8f8",
    borderRadius: 0,
  },
  cardContent: {
    padding: "10px !important",
  },
  cardContainer: {
    display: "flex",
    alignItems: "flex-start",
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    border: "1px solid #ccc",
    padding: 2,
    width: "fit-content",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  icon: {
    marginRight: 10,
  },
  textFieldRoot: {
    marginTop: 0,
  },
  textFieldLabel: {
    marginBottom: 0,
  },
  checkbox: {
    marginTop: 0,
    justifyContent: "center",
  },
  container: {
    display: "flex",
    alignItems: "center",
    marginBottom: 5,
  },
  checkboxLabel: {
    width: "100%",
  },
  scriptDialog: {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
  },
}));

const initialProcessConfigList = {
  isStartModel: "false",
  isDirectCreation: "true",
  isCustom: "false",
  metaJsonModel: null,
  metaJsonName: null,
  metaModelName: null,
  metaModelFullName: null,
  metaModel: null,
  model: null,
  pathCondition: null,
  processPath: null,
  userDefaultPath: null,
};

export default function ProcessConfiguration({
  element,
  index,
  label,
  bpmnFactory,
}) {
  const classes = useStyles();
  const [processConfigList, setProcessConfigList] = useState(null);
  const [openProcessPathDialog, setOpenProcessDialog] = useState(false);
  const [openUserPathDialog, setOpenUserPathDialog] = useState(false);
  const [startModel, setStartModel] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
  });
  const [selectedProcessConfig, setSelectedProcessConfig] = useState(null);
  const [openExpressionBuilder, setExpressionBuilder] = useState(false);
  const [pathCondition, setPathCondition] = useState(null);
  const [field, setField] = useState(null);
  const [openTranslationDialog, setTranslationDialog] = useState(false);
  const [translations, setTranslations] = useState(null);
  const [removedTranslations, setRemovedTranslations] = useState(null);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState(null);

  const handleExpressionBuilder = () => {
    setExpressionBuilder(false);
  };

  const getter = () => {
    const value = selectedProcessConfig?.processConfig?.pathConditionValue;
    const checked = getBool(selectedProcessConfig?.processConfig?.checked);
    let values;
    try {
      values = value !== undefined ? JSON.parse(value) : undefined;
    } catch (errror) {}
    return { values, checked };
  };

  const processConfigs = [
    selectedProcessConfig?.processConfig?.metaModel,
    selectedProcessConfig?.processConfig?.metaJsonModel,
  ];

  const setter = (val) => {
    const { expression, value, checked } = val;
    updateValue(
      expression,
      "pathCondition",
      undefined,
      selectedProcessConfig && selectedProcessConfig.key,
      { value, checked }
    );
  };

  const getProcessConfigList = React.useCallback(
    (field = "processConfigurationParameters") => {
      const processConfiguration = getProcessConfig(element);
      const processConfigurations =
        processConfiguration && processConfiguration[field];
      return processConfigurations;
    },
    [element]
  );

  const getProcessConfigs = React.useCallback(() => {
    const entries = getProcessConfigList();
    if (entries) {
      return entries;
    }
    return [];
  }, [getProcessConfigList]);

  const updateElement = (value, label, optionIndex) => {
    let entries = getProcessConfigList();
    if (!entries) return;
    const entry = entries[optionIndex];
    if (entry) {
      entry[label] = value;
    }
  };

  const newElement = function (
    type,
    prop,
    element,
    extensionElements,
    bpmnFactory
  ) {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo.processRef);
    }
    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      bo.extensionElements = extensionElements;
    }

    let processConfigurations = getProcessConfig(element);
    if (!processConfigurations) {
      let parent = bo.extensionElements;
      processConfigurations = createProcessConfiguration(parent, bpmnFactory, {
        processConfigurationParameters: [],
      });
      let newElem = createParameter(
        prop,
        processConfigurations,
        bpmnFactory,
        {}
      );
      newElem.isStartModel = "false";
      newElem.isDirectCreation = "true";
      newElem.isCustom = "false";
      processConfigurations[type] = [newElem];
      bo.extensionElements.values.push(processConfigurations);
    }
  };

  const addElement = (parameterType, type) => {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo && bo.processRef);
    }
    const extensionElements = bo.extensionElements;
    if (extensionElements && extensionElements.values) {
      const processConfigurations = extensionElements.values.find(
        (e) => e.$type === "camunda:ProcessConfiguration"
      );
      if (!processConfigurations) {
        newElement(
          parameterType,
          type,
          element,
          bo.extensionElements,
          bpmnFactory
        );
      } else {
        let newElem = createParameter(
          type,
          processConfigurations,
          bpmnFactory,
          {}
        );
        newElem.isStartModel = "false";
        newElem.isDirectCreation = "true";
        newElem.isCustom = "false";
        if (
          !processConfigurations[parameterType] ||
          processConfigurations[parameterType].length === 0
        ) {
          processConfigurations[parameterType] = [newElem];
        } else {
          processConfigurations[parameterType].push(newElem);
        }
      }
    } else {
      newElement(
        parameterType,
        type,
        element,
        bo.extensionElements,
        bpmnFactory
      );
    }
  };

  const removeElement = (optionIndex) => {
    let processConfigList = getProcessConfigList();
    if (optionIndex < 0) return;
    processConfigList.splice(optionIndex, 1);
    if (processConfigList.length === 0) {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      const extensionElements = bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return null;
      const processConfigurationsIndex = extensionElements.values.findIndex(
        (e) => e.$type === "camunda:ProcessConfiguration"
      );
      if (processConfigurationsIndex < 0) return;
      if (extensionElements && extensionElements.values) {
        extensionElements.values.splice(processConfigurationsIndex, 1);
        if (extensionElements.values.length === 0) {
          bo.extensionElements = undefined;
        }
      }
    }
  };

  const addItems = () => {
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList.push({ ...initialProcessConfigList });
    setProcessConfigList(cloneProcessConfigList);
    addElement(
      "processConfigurationParameters",
      "camunda:ProcessConfigurationParameter"
    );
  };

  const removeItem = (index) => {
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList.splice(index, 1);
    setProcessConfigList(cloneProcessConfigList);
  };

  const updateValue = async (value, name, label, index, valueLabel) => {
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList[index] = {
      ...(cloneProcessConfigList[index] || {}),
      [name]: (value && value[label]) || value,
    };
    if (name === "pathCondition") {
      cloneProcessConfigList[index] = {
        ...(cloneProcessConfigList[index] || {}),
        pathConditionValue: valueLabel?.value,
        checked: valueLabel?.checked,
      };
      updateElement(valueLabel?.checked, "checked", index);
      updateElement(valueLabel?.value, "pathConditionValue", index);
    }
    let model = "";
    if (name === "metaModel" || name === "metaJsonModel") {
      if (name === "metaModel") {
        cloneProcessConfigList[index][`${name}FullName`] =
          value && value.fullName;
      } else {
        cloneProcessConfigList[index][`${name}FullName`] = undefined;
      }
      model = await getProcessConfigModel({
        ...cloneProcessConfigList[index],
        [name]: value,
        [name === "metaModel" ? "metaJsonModel" : "metaModel"]: null,
      });
      cloneProcessConfigList[index] = {
        ...(cloneProcessConfigList[index] || {}),
        [name === "metaModel" ? "metaJsonModel" : "metaModel"]: null,
        model: model,
      };
      updateElement(
        undefined,
        `${name === "metaModel" ? "metaJsonModel" : "metaModel"}`,
        index
      );
      updateElement(model, "model", index);

      cloneProcessConfigList[index][`title`] = value ? valueLabel : undefined;
      updateElement(valueLabel, `title`, index);
      if (!valueLabel || !value) {
        cloneProcessConfigList[index]["title"] = undefined;
        updateElement(undefined, "title", index);
      }

      if (name === "metaModel" && value) {
        updateElement(value.fullName, "metaModelFullName", index);
      } else {
        updateElement(undefined, `metaModelFullName`, index);
      }
    }
    updateElement((value && value[label]) || value, name, index);
    setProcessConfigList(cloneProcessConfigList);
  };

  const getData = (processConfig) => {
    return processConfig && processConfig.metaModel
      ? {
          fullName: processConfig.metaModelFullName,
          name: processConfig.metaModel,
          type: "metaModel",
        }
      : processConfig && processConfig.metaJsonModel
      ? {
          name: processConfig.metaJsonModel,
          type: "metaJsonModel",
        }
      : undefined;
  };

  const updateStartModel = React.useCallback((processConfig) => {
    setStartModel(getData(processConfig));
  }, []);

  const onConfirm = async () => {
    if (translations) {
      await addTranslations(translations);
      updateValue(
        translations.length > 0 ? true : false,
        "isTranslations",
        undefined,
        selectedProcessConfig && selectedProcessConfig.key
      );
      if (
        removedTranslations &&
        removedTranslations.length > 0 &&
        removedTranslations[0].id
      ) {
        await removeAllTranslations(removedTranslations);
      }
    }
    setTranslationDialog(false);
  };

  useEffect(() => {
    const processConfigList = getProcessConfigs();
    setProcessConfigList(processConfigList);
    for (let i = 0; i < processConfigList.length; i++) {
      const processConfig = processConfigList[i];
      if (getBool(processConfig.isStartModel)) {
        updateStartModel(processConfig);
        return;
      }
    }
  }, [getProcessConfigs, updateStartModel, element]);

  return (
    <div>
      <React.Fragment>
        {index > 0 && <div className={classes.divider} />}
      </React.Fragment>
      <div>
        <Grid container alignItems="center">
          <Grid item xs={6}>
            <div className={classes.groupLabel}>{label}</div>
          </Grid>
        </Grid>
        <Grid>
          {processConfigList && processConfigList.length > 0 && (
            <Typography className={classes.reportTypography}>
              <ReportProblem fontSize="small" className={classes.icon} />
              {translate("Must provide meta model or custom model")}
            </Typography>
          )}
          {processConfigList && processConfigList.length > 0 && (
            <Grid>
              <Grid size="small" aria-label="a dense table">
                <Grid>
                  {processConfigList.map((processConfig, key) => (
                    <div key={`card_${key}`} className={classes.cardContainer}>
                      <Card className={classes.card}>
                        <CardContent className={classes.cardContent}>
                          <Grid key={key}>
                            <Grid container className={classes.container}>
                              <Grid
                                item
                                xs={12}
                                style={{ justifyContent: "flex-end" }}
                                className={classes.grid}
                              >
                                <label className={classes.label}>
                                  {translate("Model")}
                                </label>
                                {(
                                  processConfig.isCustom === undefined
                                    ? processConfig.metaJsonModel
                                      ? false
                                      : true
                                    : !getBool(processConfig.isCustom)
                                ) ? (
                                  <Select
                                    fetchMethod={(criteria) =>
                                      getMetaModels(criteria)
                                    }
                                    update={(value, label) => {
                                      updateValue(
                                        value,
                                        "metaModel",
                                        "name",
                                        key,
                                        label
                                      );
                                    }}
                                    name="metaModel"
                                    optionLabel="name"
                                    optionLabelSecondary="title"
                                    value={processConfig.metaModel || ""}
                                    isLabel={false}
                                  />
                                ) : (
                                  <Select
                                    fetchMethod={(options) =>
                                      getCustomModels(options)
                                    }
                                    update={(value, label) => {
                                      updateValue(
                                        value,
                                        "metaJsonModel",
                                        "name",
                                        key,
                                        label
                                      );
                                    }}
                                    name="metaJsonModel"
                                    value={processConfig.metaJsonModel || ""}
                                    isLabel={false}
                                    optionLabel="name"
                                    optionLabelSecondary="title"
                                  />
                                )}
                              </Grid>
                            </Grid>
                            <Grid container className={classes.container}>
                              <Grid item xs={4} className={classes.grid}>
                                <Checkbox
                                  className={classes.checkbox}
                                  labelClassName={classes.checkboxLabel}
                                  entry={{
                                    id: `custom-${key}`,
                                    modelProperty: "isCustom",
                                    label: translate("Custom"),
                                    get: function () {
                                      return {
                                        isCustom:
                                          processConfig.isCustom === undefined
                                            ? processConfig.metaJsonModel
                                              ? true
                                              : false
                                            : getBool(processConfig.isCustom),
                                      };
                                    },
                                    set: function (e, values) {
                                      updateValue(
                                        !values.isCustom,
                                        "isCustom",
                                        undefined,
                                        key
                                      );
                                    },
                                  }}
                                  element={element}
                                />
                              </Grid>
                              <Grid item xs={4} className={classes.grid}>
                                <Checkbox
                                  className={classes.checkbox}
                                  labelClassName={classes.checkboxLabel}
                                  entry={{
                                    id: `start-model-${key}`,
                                    label: translate("Start model ?"),
                                    modelProperty: "isStartModel",
                                    get: function () {
                                      return {
                                        isStartModel: getBool(
                                          processConfig.isStartModel
                                        ),
                                      };
                                    },
                                    set: function (e, values) {
                                      updateValue(
                                        !values.isStartModel,
                                        "isStartModel",
                                        undefined,
                                        key
                                      );
                                      if (!values.isStartModel) {
                                        updateStartModel(processConfig);
                                      }
                                    },
                                  }}
                                  element={element}
                                />
                              </Grid>
                              <Grid item xs={4} className={classes.grid}>
                                <Checkbox
                                  className={classes.checkbox}
                                  labelClassName={classes.checkboxLabel}
                                  entry={{
                                    id: `direct-creation-${key}`,
                                    modelProperty: "isDirectCreation",
                                    label: translate("Direct creation ?"),
                                    get: function () {
                                      return {
                                        isDirectCreation: getBool(
                                          processConfig.isDirectCreation
                                        ),
                                      };
                                    },
                                    set: function (e, values) {
                                      updateValue(
                                        !values.isDirectCreation,
                                        "isDirectCreation",
                                        undefined,
                                        key
                                      );
                                    },
                                  }}
                                  element={element}
                                />
                              </Grid>
                            </Grid>
                            <Grid container className={classes.container}>
                              <Grid item xs={6} className={classes.grid}>
                                <label className={classes.label}>
                                  {translate("Title")}
                                </label>
                                <TextField
                                  element={element}
                                  canRemove={
                                    getBool(processConfig.isTranslations)
                                      ? false
                                      : true
                                  }
                                  rootClass={classes.textFieldRoot}
                                  labelClass={classes.textFieldLabel}
                                  clearClassName={classes.clearClassName}
                                  disabled={getBool(
                                    processConfig.isTranslations
                                  )}
                                  readOnly={getBool(
                                    processConfig.isTranslations
                                  )}
                                  entry={{
                                    id: `title_${key}`,
                                    name: "title",
                                    modelProperty: "title",
                                    get: function () {
                                      return {
                                        title: processConfig.title,
                                      };
                                    },
                                    set: function (e, value) {
                                      if (value.title !== processConfig.title) {
                                        updateValue(
                                          value.title === ""
                                            ? undefined
                                            : value.title,
                                          "title",
                                          undefined,
                                          key
                                        );
                                      }
                                    },
                                  }}
                                  endAdornment={
                                    <Edit
                                      className={classes.newIcon}
                                      onClick={() => {
                                        setTranslationDialog(true);
                                        setSelectedProcessConfig({
                                          processConfig,
                                          key,
                                        });
                                      }}
                                    />
                                  }
                                />
                              </Grid>
                              <Grid item xs={6} className={classes.grid}>
                                <label className={classes.label}>
                                  {translate("Process path")}
                                </label>
                                <TextField
                                  element={element}
                                  canRemove={true}
                                  rootClass={classes.textFieldRoot}
                                  labelClass={classes.textFieldLabel}
                                  clearClassName={classes.clearClassName}
                                  disabled={getBool(processConfig.isStartModel)}
                                  entry={{
                                    id: `processPath_${key}`,
                                    name: "processPath",
                                    modelProperty: "processPath",
                                    get: function () {
                                      return {
                                        processPath: processConfig.processPath,
                                      };
                                    },
                                    set: function (e, value) {
                                      if (
                                        value.processPath !==
                                        processConfig.processPath
                                      ) {
                                        updateValue(
                                          value.processPath === ""
                                            ? undefined
                                            : value.processPath,
                                          "processPath",
                                          undefined,
                                          key
                                        );
                                      }
                                    },
                                  }}
                                  endAdornment={
                                    <>
                                      {!getBool(processConfig.isStartModel) && (
                                        <Edit
                                          className={classes.newIcon}
                                          onClick={() => {
                                            setOpenProcessDialog(true);
                                            setSelectedProcessConfig({
                                              processConfig,
                                              key,
                                            });
                                            setField(null);
                                            if (!startModel) {
                                              const model =
                                                processConfigList &&
                                                processConfigList.find((f) =>
                                                  getBool(f.isStartModel)
                                                );
                                              updateStartModel(model);
                                            }
                                          }}
                                        />
                                      )}
                                    </>
                                  }
                                />
                              </Grid>
                            </Grid>
                            <Grid container className={classes.container}>
                              <Grid item xs={6} className={classes.grid}>
                                <label className={classes.label}>
                                  {translate("Condition")}
                                </label>
                                <TextField
                                  element={element}
                                  canRemove={true}
                                  rootClass={classes.textFieldRoot}
                                  labelClass={classes.textFieldLabel}
                                  clearClassName={classes.clearClassName}
                                  readOnly={
                                    processConfig &&
                                    processConfig.pathConditionValue
                                      ? true
                                      : false
                                  }
                                  entry={{
                                    id: `pathCondition_${key}`,
                                    name: "pathCondition",
                                    modelProperty: "pathCondition",
                                    get: function () {
                                      return {
                                        pathCondition:
                                          processConfig.pathCondition || "",
                                      };
                                    },
                                    set: function (e, values) {
                                      if (
                                        values.pathCondition !==
                                        processConfig.pathCondition
                                      ) {
                                        updateValue(
                                          values.pathCondition === ""
                                            ? undefined
                                            : values.pathCondition,
                                          "pathCondition",
                                          undefined,
                                          key
                                        );
                                      }
                                    },
                                  }}
                                  endAdornment={
                                    <>
                                      <Tooltip
                                        title="Enable"
                                        aria-label="enable"
                                      >
                                        <i
                                          className="fa fa-code"
                                          style={{
                                            fontSize: 18,
                                            color: "#58B423",
                                            marginLeft: 5,
                                            cursor: "pointer",
                                          }}
                                          onClick={() => {
                                            setPathCondition({
                                              key,
                                              processConfig,
                                            });
                                            if (
                                              processConfig &&
                                              processConfig.pathConditionValue
                                            ) {
                                              setAlert({
                                                open: true,
                                                message:
                                                  "Path condition can't be managed using builder once changed manually.",
                                                title: "Warning",
                                                callback: () => {
                                                  updateValue(
                                                    processConfig?.pathCondition,
                                                    "pathCondition",
                                                    undefined,
                                                    key,
                                                    undefined
                                                  );
                                                  setScript(
                                                    processConfig?.pathCondition
                                                  );
                                                  setOpenScriptDialog(true);
                                                },
                                              });
                                            } else {
                                              setOpenScriptDialog(true);
                                            }
                                          }}
                                        />
                                      </Tooltip>
                                      <Edit
                                        className={classes.newIcon}
                                        onClick={() => {
                                          setSelectedProcessConfig({
                                            processConfig,
                                            key,
                                          });
                                          setExpressionBuilder(true);
                                        }}
                                      />
                                    </>
                                  }
                                />
                              </Grid>
                              <Grid item xs={6} className={classes.grid}>
                                <label className={classes.label}>
                                  {translate("User default path")}
                                </label>
                                <TextField
                                  element={element}
                                  canRemove={true}
                                  rootClass={classes.textFieldRoot}
                                  labelClass={classes.textFieldLabel}
                                  clearClassName={classes.clearClassName}
                                  entry={{
                                    id: `userDefaultPath_${key}`,
                                    name: "userDefaultPath",
                                    modelProperty: "userDefaultPath",
                                    get: function () {
                                      return {
                                        userDefaultPath:
                                          processConfig.userDefaultPath,
                                      };
                                    },
                                    set: function (e, value) {
                                      updateValue(
                                        value.userDefaultPath,
                                        "userDefaultPath",
                                        undefined,
                                        key
                                      );
                                    },
                                  }}
                                  endAdornment={
                                    <Edit
                                      className={classes.newIcon}
                                      onClick={() => {
                                        setOpenUserPathDialog(true);
                                        setField(null);
                                        setSelectedProcessConfig({
                                          processConfig,
                                          key,
                                        });
                                      }}
                                    />
                                  }
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                      <Grid align="center" className={classes.Grid}>
                        <IconButton
                          className={classes.iconButton}
                          onClick={() => {
                            removeItem(key);
                            removeElement(key);
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Grid>
                    </div>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
        <div className={classes.icons}>
          <IconButton className={classes.iconButton} onClick={addItems}>
            <Add fontSize="small" />
          </IconButton>
        </div>
      </div>
      <Dialog
        open={openProcessPathDialog}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            setOpenProcessDialog(false);
            setSelectedProcessConfig(null);
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        classes={{
          paper: classes.dialog,
        }}
      >
        <DialogTitle id="alert-dialog-title">
          {translate("Process Path")}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <FieldEditor
            getMetaFields={() =>
              getMetaFields(
                getData(
                  selectedProcessConfig && selectedProcessConfig.processConfig
                )
              )
            }
            onChange={(val, field) => {
              setField(field);
              setSelectedProcessConfig({
                processConfig: {
                  ...((selectedProcessConfig &&
                    selectedProcessConfig.processConfig) ||
                    {}),
                  processPath: val,
                },
                key: selectedProcessConfig && selectedProcessConfig.key,
              });
            }}
            startModel={startModel}
            value={{
              fieldName:
                selectedProcessConfig &&
                selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.processPath,
            }}
            isParent={true}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (
                field &&
                field.target !== (startModel && startModel.fullName) &&
                field.jsonTarget !== (startModel && startModel.name)
              ) {
                setAlert({
                  open: true,
                  message: "Last subfield should be related to start model",
                  title: "Warning",
                });
                return;
              }
              setOpenProcessDialog(false);
              if (selectedProcessConfig) {
                updateValue(
                  selectedProcessConfig.processConfig &&
                    selectedProcessConfig.processConfig.processPath,
                  "processPath",
                  undefined,
                  selectedProcessConfig.key
                );
              }
            }}
            color="primary"
            className={classes.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setOpenProcessDialog(false);
            }}
            color="primary"
            className={classes.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      {openExpressionBuilder && (
        <QueryBuilder
          open={openExpressionBuilder}
          close={handleExpressionBuilder}
          title="Add expression"
          setProperty={setter}
          getExpression={getter}
          fetchModels={() => fetchModels(element, processConfigs)}
        />
      )}
      {openScriptDialog && (
        <AlertDialog
          className={classes.scriptDialog}
          openAlert={openScriptDialog}
          alertClose={() => setOpenScriptDialog(false)}
          handleAlertOk={() => {
            updateValue(
              script === "" ? undefined : script,
              "pathCondition",
              undefined,
              pathCondition?.key
            );
            setOpenScriptDialog(false);
          }}
          title={translate("Add expression")}
          children={
            <Textbox
              element={element}
              className={classes.textbox}
              showLabel={false}
              defaultHeight={window?.innerHeight - 205}
              entry={{
                id: "script",
                label: translate("Condition"),
                modelProperty: "script",
                get: function () {
                  return {
                    script: pathCondition?.processConfig?.pathCondition || "",
                  };
                },
                set: function (e, values) {
                  setScript(values?.script);
                },
              }}
            />
          }
        />
      )}
      {alert?.open && (
        <Dialog
          open={alert?.open}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              setAlert({ open: false });
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {translate(alert?.title)}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {translate(alert?.message)}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              className={classes.save}
              onClick={() => {
                alert?.callback && alert.callback();
                setAlert({ open: false });
              }}
              color="primary"
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => setAlert({ open: false })}
              color="primary"
              className={classes.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {openUserPathDialog && (
        <Dialog
          open={openUserPathDialog}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              setOpenUserPathDialog(false);
              setSelectedProcessConfig(null);
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {translate("User default Path")}
          </DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <FieldEditor
              getMetaFields={() =>
                getMetaFields(
                  getData(
                    selectedProcessConfig && selectedProcessConfig.processConfig
                  )
                )
              }
              onChange={(val, field) => {
                setField(field);
                setSelectedProcessConfig({
                  processConfig: {
                    ...((selectedProcessConfig &&
                      selectedProcessConfig.processConfig) ||
                      {}),
                    userDefaultPath: val,
                  },
                  key: selectedProcessConfig && selectedProcessConfig.key,
                });
              }}
              value={{
                fieldName:
                  selectedProcessConfig &&
                  selectedProcessConfig.processConfig &&
                  selectedProcessConfig.processConfig.userDefaultPath,
              }}
              isParent={true}
              isUserPath={true}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (field && field.target !== "com.axelor.auth.db.User") {
                  setAlert({
                    open: true,
                    message: "Last subfield should be related to user",
                  });
                  return;
                }
                setOpenUserPathDialog(false);
                if (selectedProcessConfig) {
                  updateValue(
                    selectedProcessConfig.processConfig &&
                      selectedProcessConfig.processConfig.userDefaultPath,
                    "userDefaultPath",
                    undefined,
                    selectedProcessConfig.key
                  );
                }
              }}
              color="primary"
              className={classes.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setOpenUserPathDialog(false);
              }}
              color="primary"
              className={classes.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {openTranslationDialog && (
        <Dialog
          open={openTranslationDialog}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              setTranslationDialog(false);
              setSelectedProcessConfig(null);
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {translate("Translations")}
          </DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <ProcessConfigTitleTranslation
              element={element}
              configKey={
                selectedProcessConfig &&
                selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.title
              }
              onChange={(translations, removedTranslations) => {
                setTranslations(translations);
                setRemovedTranslations(removedTranslations);
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={onConfirm}
              color="primary"
              className={classes.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setTranslationDialog(false);
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
  );
}
