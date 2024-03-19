import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { IconButton } from "@material-ui/core";

import Select from "../../../../../components/Select";
import AlertDialog from "../../../../../components/AlertDialog";
import ProcessConfigTitleTranslation from "./ProcessConfigTitleTranslation";
import {
  TextField,
  Checkbox,
  FieldEditor,
  Textbox,
} from "../../../../../components/properties/components";
import Tooltip from "../../../../../components/Tooltip";
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
import styles from "./ProcessConfiguration.module.css";

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
  bpmnModeler,
  setDummyProperty = () => {},
}) {
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
    setDummyProperty({ bpmnModeler, element, value: optionIndex });
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
    setDummyProperty({ bpmnModeler, element, value: true });
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList.push({ ...initialProcessConfigList });
    setProcessConfigList(cloneProcessConfigList);
    addElement(
      "processConfigurationParameters",
      "camunda:ProcessConfigurationParameter"
    );
  };

  const removeItem = (index) => {
    setDummyProperty({ bpmnModeler, element, value: index });
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList.splice(index, 1);
    setProcessConfigList(cloneProcessConfigList);
  };

  const updateValue = async (value, name, label, index, valueLabel) => {
    setDummyProperty({ bpmnModeler, element, value });

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

  const updateStartModel = React.useCallback(
    (processConfig) => {
      setDummyProperty({ bpmnModeler, element, value: true });
      setStartModel(getData(processConfig));
    },
    [bpmnModeler, element]
  );

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
        {index > 0 && <Divider className={styles.divider} />}
      </React.Fragment>
      <div>
        <Box d="flex" alignItems="center">
          <InputLabel color="body" className={styles.groupLabel}>
            {label}
          </InputLabel>
        </Box>
        <Box>
          {(!processConfigList?.length ||
            !!processConfigList?.find(
              (l) => !l.metaJsonModel && !l.metaModel
            )) && (
            <InputLabel
              d="flex"
              alignItems="center"
              style={{ margin: "10px 0", color: "var(--red)" }}
            >
              <MaterialIcon
                icon="report"
                fontSize={16}
                className={styles.icon}
              />
              {translate("Must provide meta model or custom model")}
            </InputLabel>
          )}
          {processConfigList?.length > 0 && (
            <Box>
              <Box>
                {processConfigList.map((processConfig, key) => (
                  <Box d="flex" alignItems="flex-start" key={`card_${key}`}>
                    <Box
                      w={100}
                      rounded={2}
                      border
                      bg="body-tertiary"
                      color="body"
                      style={{ marginTop: 5, marginBottom: 10 }}
                    >
                      <Box key={key} style={{ padding: 10 }}>
                        <Box d="flex" className={styles.container}>
                          <Box
                            flex="1"
                            justifyContent="flex-end"
                            className={styles.grid}
                          >
                            <InputLabel color="body" className={styles.label}>
                              {translate("Model")}
                            </InputLabel>
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
                          </Box>
                        </Box>
                        <Box
                          d="flex"
                          justifyContent="space-between"
                          className={styles.container}
                        >
                          <Box className={styles.grid}>
                            <Checkbox
                              className={styles.checkbox}
                              labelClassName={styles.checkboxLabel}
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
                          </Box>
                          <Box className={styles.grid}>
                            <Checkbox
                              className={styles.checkbox}
                              labelClassName={styles.checkboxLabel}
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
                          </Box>
                          <Box className={styles.grid}>
                            <Checkbox
                              className={styles.checkbox}
                              labelClassName={styles.checkboxLabel}
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
                          </Box>
                        </Box>
                        <Box d="flex" className={styles.container}>
                          <Box style={{ width: "50%" }} className={styles.grid}>
                            <InputLabel color="body" className={styles.label}>
                              {translate("Title")}
                            </InputLabel>
                            <TextField
                              element={element}
                              canRemove={
                                getBool(processConfig.isTranslations)
                                  ? false
                                  : true
                              }
                              rootClass={styles.textFieldRoot}
                              labelClass={styles.textFieldLabel}
                              clearClassName={styles.clearClassName}
                              disabled={getBool(processConfig.isTranslations)}
                              readOnly={getBool(processConfig.isTranslations)}
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
                                <MaterialIcon
                                  fontSize={18}
                                  icon="edit"
                                  className={styles.newIcon}
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
                          </Box>
                          <Box style={{ width: "50%" }} className={styles.grid}>
                            <InputLabel color="body" className={styles.label}>
                              {translate("Process path")}
                            </InputLabel>
                            <TextField
                              element={element}
                              canRemove={true}
                              rootClass={styles.textFieldRoot}
                              labelClass={styles.textFieldLabel}
                              clearClassName={styles.clearClassName}
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
                                    <MaterialIcon
                                      icon="edit"
                                      fontSize={18}
                                      className={styles.newIcon}
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
                          </Box>
                        </Box>
                        <Box d="flex" className={styles.container}>
                          <Box style={{ width: "50%" }} className={styles.grid}>
                            <InputLabel color="body" className={styles.label}>
                              {translate("Condition")}
                            </InputLabel>
                            <TextField
                              element={element}
                              canRemove={true}
                              rootClass={styles.textFieldRoot}
                              labelClass={styles.textFieldLabel}
                              clearClassName={styles.clearClassName}
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
                                  <Tooltip title="Enable" aria-label="enable">
                                    <i
                                      className="fa fa-code"
                                      style={{
                                        fontSize: 18,
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
                                          setScript(
                                            processConfig?.pathCondition
                                          );
                                          setOpenScriptDialog(true);
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                  <MaterialIcon
                                    icon="edit"
                                    fontSize={18}
                                    className={styles.newIcon}
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
                          </Box>
                          <Box style={{ width: "50%" }} className={styles.grid}>
                            <InputLabel color="body" className={styles.label}>
                              {translate("User default path")}
                            </InputLabel>
                            <TextField
                              element={element}
                              canRemove={true}
                              rootClass={styles.textFieldRoot}
                              labelClass={styles.textFieldLabel}
                              clearClassName={styles.clearClassName}
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
                                <MaterialIcon
                                  icon="edit"
                                  fontSize={18}
                                  className={styles.newIcon}
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
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Box color="body" align="center" className={styles.Grid}>
                      <IconButton
                        className={styles.iconButton}
                        onClick={() => {
                          removeItem(key);
                          removeElement(key);
                        }}
                      >
                        <MaterialIcon icon="close" fontSize={14} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
        <Box color="body">
          <IconButton className={styles.iconButton} onClick={addItems}>
            <MaterialIcon icon="add" fontSize={14} />
          </IconButton>
        </Box>
      </div>
      <Dialog
        open={openProcessPathDialog}
        backdrop
        centered
        className={styles.processPathDialog}
      >
        <DialogHeader onCloseClick={() => setOpenProcessDialog(false)}>
          <h3>{translate("Process Path")}</h3>
        </DialogHeader>
        <DialogContent className={styles.dialogContent}>
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
        <DialogFooter>
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
            variant="primary"
            className={styles.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setOpenProcessDialog(false);
            }}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
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
          className={styles.scriptDialog}
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
              className={styles.textbox}
              showLabel={false}
              defaultHeight={window?.innerHeight - 205}
              entry={{
                id: "script",
                label: translate("Condition"),
                modelProperty: "script",
                get: function () {
                  return {
                    script,
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
      <Dialog centered open={alert?.open} backdrop>
        <DialogHeader onCloseClick={() => setAlert({ open: false })}>
          <h3>{translate(alert?.title || translate("Warning"))}</h3>
        </DialogHeader>
        <DialogContent className={styles.dialogContent}>
          <Box as="p" color="body" fontSize={5}>
            {translate(alert?.message)}
          </Box>
        </DialogContent>
        <DialogFooter>
          <Button
            className={styles.save}
            onClick={() => {
              alert?.callback && alert.callback();
              setAlert({ open: false });
            }}
            variant="primary"
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => setAlert({ open: false })}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>
      <Dialog
        open={openUserPathDialog}
        backdrop
        centered
        className={styles.processPathDialog}
      >
        <DialogHeader
          id="alert-dialog-title"
          onCloseClick={() => {
            setOpenUserPathDialog(false);
            setSelectedProcessConfig(null);
          }}
        >
          <h3>{translate("User default Path")}</h3>
        </DialogHeader>
        <DialogContent className={styles.dialogContent}>
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
        <DialogFooter>
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
            variant="primary"
            className={styles.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setOpenUserPathDialog(false);
            }}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>
      <Dialog backdrop centered open={openTranslationDialog}>
        <DialogHeader
          id="alert-dialog-title"
          onCloseClick={(event, reason) => {
            if (reason !== "backdropClick") {
              setTranslationDialog(false);
              setSelectedProcessConfig(null);
            }
          }}
        >
          <h3>{translate("Translations")}</h3>
        </DialogHeader>
        <DialogContent className={styles.dialogContent}>
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
            bpmnModeler={bpmnModeler}
            setDummyProperty={setDummyProperty}
          />
        </DialogContent>
        <DialogFooter>
          <Button onClick={onConfirm} variant="primary" className={styles.save}>
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setTranslationDialog(false);
            }}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
