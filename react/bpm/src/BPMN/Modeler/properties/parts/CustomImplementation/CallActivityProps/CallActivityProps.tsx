import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import React, { useEffect, useState } from "react";
import { Divider } from "@axelor/ui";
import { useDialog } from "@studio/shared/hooks";
import Service from "@studio/shared/services/Service";
import type { WkfModel } from "@studio/shared/types";
import { translate } from "@studio/shared/i18n";

import { Checkbox, SelectBox } from "../../../../../../components/properties/components";
import { getBPMNModels } from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import CollapsePanel from "../../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import styles from "./callactivity.module.css";
import CallLinkSection from "./CallLinkSection";
import CalledElementSection from "./CalledElementSection";
import BpmnSelectorDialog from "./BpmnSelectorDialog";
import { nextId, getCallableType, addNewBPMRecord } from "./utils";


export default function CallActivityProps({
  element,
  _index,
  label,
  bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [custom, setCustom] = useState(false);
  const [callActivityType, setCallActivityType] = useState("bpmn");
  const [wkfModel, setWkfModel] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [openCondition, setOpenCondition] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [openParentPath, setOpenParentPath] = useState(false);
  const [parentPathDummy, setParentPathDummy] = useState<any>(null);
  const [parentPath, setParentPath] = useState<any>(null);
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  const openDialog = useDialog();
  const id = nextId();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function updateModelingProperty(key: any, value: any) {
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get("modeling");
    // @ts-expect-error -- safety: bpmn-js is() accepts any element-like shape at runtime
    modeling.updateProperties(element, {
      [key]: value,
    });
  }

  const handleSnackbarClick = (messageType: any, message: any) => {
    setSnackbar({ open: true, messageType, message });
  };

  const handleSnackbarClose = (event: any, reason: any) => {
    if (reason === "clickaway") return;
    setSnackbar({ open: false, messageType: null, message: null });
  };

  const handleAddNewBPMRecord = () => {
    addNewBPMRecord({ id, element, setWkfModel, handleSnackbarClick });
  };

  const updateModel = React.useCallback(
    async (userInput: any) => {
      const wkfProcessRes = await getBPMNModels({
        data: {
          criteria: [
            { fieldName: "processId", operator: "=", value: userInput },
            { fieldName: "name", operator: "=", value: userInput },
          ],
          operator: "or",
        },
      });
      const wkfProcess = wkfProcessRes && wkfProcessRes[0];
      if (!wkfProcess) {
        const model = await Service.search<WkfModel>("com.axelor.studio.db.WkfModel", {
          data: {
            _domain: `self.code = '${userInput}' AND self.generatedFromCallActivity is true`,
          },
          limit: 1,
        });
        const data = model?.data?.[0];
        if (data) {
          setWkfModel(data);
          if (element) {
            getBusinessObject(element).calledElement = data.code;
            updateModelingProperty("calledElement", data.code);
          }
        }
      } else {
        setWkfModel({
          name: wkfProcess.name,
          id: wkfProcess.wkfModel && wkfProcess.wkfModel.id,
          processId: wkfProcess.name,
          wkfModel: wkfProcess?.wkfModel,
        });
        if (element && getBusinessObject(element)) {
          getBusinessObject(element).calledElement = wkfProcess.name;
          updateModelingProperty("calledElement", wkfProcess.name);
        }
      }
    },
    [element],
  );

  const updateValue = (name: any, value: any, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}Name`, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}Name`, value["fullName"] || value["name"]);
  };

  const updateSelectValue = (name: any, value: any, label: any, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const getProperty = React.useCallback(
    (name: string) => {
      const propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if (is(element, "bpmn:Participant")) {
        bo = getBusinessObject(element).get("processRef");
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element],
  );

  const setProperty = React.useCallback(
    (name: any, value: any) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      const propertyName = `camunda:${name}`;
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
    [element, bpmnModeler],
  );

  const getSelectValue = React.useCallback(
    (name: any) => {
      const label = getProperty(`${name}Label`);
      const newName = getProperty(name);
      const fullName = getProperty(`${name}Name`);
      if (newName) {
        const value = { name: newName, fullName };
        if (label) {
          // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
          value.title = label;
        }
        return value;
      } else {
        return null;
      }
    },
    [getProperty],
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
    return { condition };
  };

  useEffect(() => {
    if (!element) return;
    if (is(element, "camunda:CallActivity")) {
      const bo = getBusinessObject(element);
      const callActivityType = getCallableType(bo) || "bpmn";
      setVisible(true);
      setCallActivityType(callActivityType);
    } else {
      setVisible(false);
    }
  }, [element]);

  useEffect(() => {
    if (!element || !isVisible) return;
    const bo = getBusinessObject(element);
    updateModel(bo.calledElement);
  }, [element, updateModel, isVisible]);

  useEffect(() => {
    const conditionValue = getProperty("conditionValue");
    const custom = getBool(getProperty("custom"));
    const parentPath = getProperty("parentPath");
    const _model = getSelectValue("model");
    setParentPath(parentPath);
    setParentPathDummy(parentPath);
    setCustom(custom);
    if (conditionValue) {
      setReadOnly(true);
    } else {
      setReadOnly(false);
    }
  }, [getProperty, getSelectValue]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
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
            set: function (element: any, values: any) {
              setCallActivityType(values.callActivityType);
              getBusinessObject(element).calledElement = undefined;
              getBusinessObject(element).calledElementBinding = undefined;
              getBusinessObject(element).caseRef = undefined;
              setWkfModel(null);
            },
          }}
        />
        <CalledElementSection
          element={element}
          callActivityType={callActivityType}
          wkfModel={wkfModel}
          setWkfModel={setWkfModel}
          updateModel={updateModel}
          updateModelingProperty={updateModelingProperty}
          handleClickOpen={handleClickOpen}
          addNewBPMRecord={handleAddNewBPMRecord}
        />
        <Divider className={styles.divider} />
        <Checkbox
          element={element}
          entry={{
            id: "custom",
            label: translate("Custom"),
            modelProperty: "custom",
            get: function () {
              return { custom: custom };
            },
            set: function (e: any, value: any) {
              const customVal = !value.custom;
              setCustom(customVal);
              setProperty("custom", customVal);
            },
          }}
        />
        <CallLinkSection
          element={element}
          model={model}
          setModel={setModel}
          custom={custom}
          readOnly={readOnly}
          setReadOnly={setReadOnly}
          parentPath={parentPath}
          setParentPath={setParentPath}
          parentPathDummy={parentPathDummy}
          setParentPathDummy={setParentPathDummy}
          openParentPath={openParentPath}
          setOpenParentPath={setOpenParentPath}
          openCondition={openCondition}
          setOpenCondition={setOpenCondition}
          openScriptDialog={openScriptDialog}
          setOpenScriptDialog={setOpenScriptDialog}
          script={script}
          setScript={setScript}
          getProperty={getProperty}
          setProperty={setProperty}
          updateSelectValue={updateSelectValue}
          updateCallActivitiyFields={updateCallActivitiyFields}
          getCallLinkCondition={getCallLinkCondition}
          openDialog={openDialog}
        />

        <BpmnSelectorDialog
          element={element}
          open={open}
          handleClose={handleClose}
          wkfModel={wkfModel}
          setWkfModel={setWkfModel}
          updateModelingProperty={updateModelingProperty}
          openSnackbar={openSnackbar}
          handleSnackbarClose={handleSnackbarClose}
        />
      </CollapsePanel>
    )
  );
}
