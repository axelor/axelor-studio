import React, { useState, useEffect } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";
import { InputLabel, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useDialog } from "@studio/shared/hooks";

import { createElement } from "../../../../../../utils/ElementUtil";
import { IconButton } from "@studio/shared/components";
import { getProcessConfigModel, addTranslations, removeAllTranslations  } from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import { getProcessConfig, createProcessConfiguration, createParameter } from "../utils";
import CollapsePanel from "../../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import styles from "./process-config.module.css";
import ProcessConfigItem from "./ProcessConfigItem";
import ProcessConfigDialogs from "./ProcessConfigDialogs";


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
  _index,
  label,
  bpmnFactory,
  bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [processConfigList, setProcessConfigList] = useState<any>(null);
  const [openProcessPathDialog, setOpenProcessDialog] = useState(false);
  const [openUserPathDialog, setOpenUserPathDialog] = useState(false);
  const [startModel, setStartModel] = useState<any>(null);
  const [selectedProcessConfig, setSelectedProcessConfig] = useState<any>(null);
  const [openExpressionBuilder, setExpressionBuilder] = useState(false);
  const [_pathCondition, setPathCondition] = useState<any>(null);
  const [field, setField] = useState<any>(null);
  const [openTranslationDialog, setTranslationDialog] = useState(false);
  const [translations, setTranslations] = useState<any>(null);
  const [removedTranslations, setRemovedTranslations] = useState<any>(null);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState<any>(null);
  const openDialog = useDialog();

  const getter = () => {
    const value = selectedProcessConfig?.processConfig?.pathConditionValue;
    const checked = getBool(selectedProcessConfig?.processConfig?.checked);
    let values: any;
    try {
      values = value !== undefined ? JSON.parse(value) : undefined;
    } catch (_e) {}
    return { values, checked };
  };

  const processConfigs = [
    selectedProcessConfig?.processConfig?.metaModel,
    selectedProcessConfig?.processConfig?.metaJsonModel,
  ];

  const setter = (val: any) => {
    const { expression, value, checked } = val;
    updateValue(
      !expression?.trim() ? undefined : expression,
      "pathCondition",
      undefined,
      selectedProcessConfig && selectedProcessConfig.key,
      { value, checked },
    );
  };

  const getProcessConfigList = React.useCallback(
    (field = "processConfigurationParameters") => {
      const processConfiguration = getProcessConfig(element);
      return processConfiguration && processConfiguration[field];
    },
    [element],
  );

  const getProcessConfigs = React.useCallback(() => {
    const entries = getProcessConfigList();
    return entries || [];
  }, [getProcessConfigList]);

  const updateElement = (value: any, label: any, optionIndex: any) => {
    const entries = getProcessConfigList();
    if (!entries) return;
    const entry = entries[optionIndex];
    if (entry) entry[label] = value;
  };

  const newElement = function (
    type: any,
    prop: any,
    element: any,
    extensionElements: any,
    bpmnFactory: any,
  ) {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") bo = getBusinessObject(bo.processRef);
    if (!extensionElements) {
      extensionElements = createElement("bpmn:ExtensionElements", { values: [] }, bo, bpmnFactory);
      bo.extensionElements = extensionElements;
    }
    let processConfigurations = getProcessConfig(element);
    if (!processConfigurations) {
      const parent = bo.extensionElements;
      processConfigurations = createProcessConfiguration(parent, bpmnFactory, {
        processConfigurationParameters: [],
      });
      const newElem = createParameter(prop, processConfigurations, bpmnFactory, {});
      newElem.isStartModel = "false";
      newElem.isDirectCreation = "true";
      newElem.isCustom = "false";
      processConfigurations[type] = [newElem];
      bo.extensionElements.values.push(processConfigurations);
    }
  };

  const addElement = (parameterType: any, type: any) => {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant")
      bo = getBusinessObject(bo && bo.processRef);
    const extensionElements = bo.extensionElements;
    if (extensionElements && extensionElements.values) {
      const processConfigurations = extensionElements.values.find(
        (e: any) => e.$type === "camunda:ProcessConfiguration",
      );
      if (!processConfigurations) {
        newElement(parameterType, type, element, bo.extensionElements, bpmnFactory);
      } else {
        const newElem = createParameter(type, processConfigurations, bpmnFactory, {});
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
      newElement(parameterType, type, element, bo.extensionElements, bpmnFactory);
    }
  };

  const removeElement = (optionIndex: any) => {
    const pcl = getProcessConfigList();
    if (optionIndex < 0) return;
    pcl.splice(optionIndex, 1);
    if (pcl.length === 0) {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant")
        bo = getBusinessObject(bo && bo.processRef);
      const ext = bo.extensionElements;
      if (!ext || !ext.values) return null;
      const idx = ext.values.findIndex((e: any) => e.$type === "camunda:ProcessConfiguration");
      if (idx < 0) return;
      if (ext && ext.values) {
        ext.values.splice(idx, 1);
        if (ext.values.length === 0) bo.extensionElements = undefined;
      }
    }
  };

  const addItems = () => {
    const clone = [...(processConfigList || [])];
    clone.push({ ...initialProcessConfigList });
    setProcessConfigList(clone);
    addElement("processConfigurationParameters", "camunda:ProcessConfigurationParameter");
  };

  const removeItem = (index: any) => {
    const clone = [...(processConfigList || [])];
    clone.splice(index, 1);
    setProcessConfigList(clone);
  };

  const updateValue = async (value: any, name: any, label?: any, index?: any, valueLabel?: any) => {
    const clone = [...(processConfigList || [])];
    clone[index] = { ...(clone[index] || {}), [name]: (value && value[label]) || value };
    if (name === "pathCondition") {
      clone[index] = {
        ...(clone[index] || {}),
        pathConditionValue: valueLabel?.value,
        checked: valueLabel?.checked,
      };
      updateElement(valueLabel?.checked, "checked", index);
      updateElement(valueLabel?.value, "pathConditionValue", index);
    }
    let model = "";
    if (name === "metaModel" || name === "metaJsonModel") {
      if (name === "metaModel") {
        clone[index][`${name}FullName`] = value && value.fullName;
      } else {
        clone[index][`${name}FullName`] = undefined;
      }
      // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
      model = await getProcessConfigModel({
        ...clone[index],
        [name]: value,
        [name === "metaModel" ? "metaJsonModel" : "metaModel"]: null,
      });
      clone[index] = {
        ...(clone[index] || {}),
        [name === "metaModel" ? "metaJsonModel" : "metaModel"]: null,
        model,
      };
      updateElement(undefined, `${name === "metaModel" ? "metaJsonModel" : "metaModel"}`, index);
      updateElement(model, "model", index);
      clone[index][`title`] = value ? valueLabel : undefined;
      updateElement(valueLabel, `title`, index);
      if (!valueLabel || !value) {
        clone[index]["title"] = undefined;
        updateElement(undefined, "title", index);
      }
      if (name === "metaModel" && value) {
        updateElement(value.fullName, "metaModelFullName", index);
      } else {
        updateElement(undefined, `metaModelFullName`, index);
      }
    }
    updateElement((value && value[label]) || value, name, index);
    setProcessConfigList(clone);
  };

  const getData = (pc: any) => {
    return pc && pc.metaModel
      ? { fullName: pc.metaModelFullName, name: pc.metaModel, type: "metaModel" }
      : pc && pc.metaJsonModel
        ? { name: pc.metaJsonModel, type: "metaJsonModel" }
        : undefined;
  };

  const updateStartModel = React.useCallback(
    (pc: any) => {
      setStartModel(getData(pc));
    },
    [bpmnModeler, element],
  );

  const onConfirm = async () => {
    if (translations) {
      await addTranslations(translations);
      updateValue(
        translations.length > 0 ? true : false,
        "isTranslations",
        undefined,
        selectedProcessConfig && selectedProcessConfig.key,
      );
      if (removedTranslations && removedTranslations.length > 0 && removedTranslations[0].id) {
        await removeAllTranslations(removedTranslations);
      }
    }
    setTranslationDialog(false);
  };

  useEffect(() => {
    const pcl = getProcessConfigs();
    setProcessConfigList(pcl);
    for (let i = 0; i < pcl.length; i++) {
      if (getBool(pcl[i].isStartModel)) {
        updateStartModel(pcl[i]);
        return;
      }
    }
  }, [getProcessConfigs, updateStartModel, element]);

  return (
    <CollapsePanel label={label}>
      <div>
        <Box>
          {(!processConfigList?.length ||
            !!processConfigList?.find((l: any) => !l.metaJsonModel && !l.metaModel)) && (
            <InputLabel
              d="flex"
              alignItems="center"
              style={{ margin: "10px 0", color: "var(--red)" }}
            >
              <MaterialIcon icon="report" fontSize={16} className={styles.icon} />
              {translate("Must provide meta model or custom model")}
            </InputLabel>
          )}
          {processConfigList?.length > 0 && (
            <Box>
              <Box>
                {processConfigList.map((processConfig: any, key: number) => (
                  <ProcessConfigItem
                    key={`card_${key}`}
                    element={element}
                    processConfig={processConfig}
                    configKey={key}
                    updateValue={updateValue}
                    updateStartModel={updateStartModel}
                    removeItem={removeItem}
                    removeElement={removeElement}
                    startModel={startModel}
                    processConfigList={processConfigList}
                    setOpenProcessDialog={setOpenProcessDialog}
                    setOpenUserPathDialog={setOpenUserPathDialog}
                    setSelectedProcessConfig={setSelectedProcessConfig}
                    setField={setField}
                    setPathCondition={setPathCondition}
                    setScript={setScript}
                    setOpenScriptDialog={setOpenScriptDialog}
                    setExpressionBuilder={setExpressionBuilder}
                    setTranslationDialog={setTranslationDialog}
                    openDialog={openDialog}
                  />
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

      <ProcessConfigDialogs
        element={element}
        bpmnModeler={bpmnModeler}
        openProcessPathDialog={openProcessPathDialog}
        setOpenProcessDialog={setOpenProcessDialog}
        openUserPathDialog={openUserPathDialog}
        setOpenUserPathDialog={setOpenUserPathDialog}
        openExpressionBuilder={openExpressionBuilder}
        setExpressionBuilder={setExpressionBuilder}
        openScriptDialog={openScriptDialog}
        setOpenScriptDialog={setOpenScriptDialog}
        openTranslationDialog={openTranslationDialog}
        setTranslationDialog={setTranslationDialog}
        selectedProcessConfig={selectedProcessConfig}
        setSelectedProcessConfig={setSelectedProcessConfig}
        startModel={startModel}
        field={field}
        setField={setField}
        script={script}
        setScript={setScript}
        translations={translations}
        setTranslations={setTranslations}
        removedTranslations={removedTranslations}
        setRemovedTranslations={setRemovedTranslations}
        processConfigs={processConfigs}
        getter={getter}
        setter={setter}
        updateValue={updateValue}
        onConfirm={onConfirm}
        getData={getData}
        openDialog={openDialog}
      />
    </CollapsePanel>
  );
}
