import React, { useEffect, useState } from "react";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";
import { useDialog } from "@studio/shared/hooks";

import { TextField, SelectBox  } from "../../../../../../components/properties/components";
import { getViews } from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import CollapsePanel from "../../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import ScriptEditorSection from "./ScriptEditorSection";
import ModelSection from "../components/ModelSection";
import { getProcessConfig, buildScriptGetter, addModels } from "./utils";

const implementationOptions = [
  { name: translate("Script"), value: "script" },
  { name: translate("Request"), value: "request" },
  {
    name: translate("Connector"),
    value: "connector",
  },
];

export default function ScriptProps({
  element,
  _index,
  label,
  bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [metaModel, setMetaModel] = useState<any>(null);
  const [metaJsonModel, setMetaJsonModel] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [displayStatus, setDisplayStatus] = useState(true);
  const [defaultForm, setDefaultForm] = useState<any>(null);
  const [formViews, setFormViews] = useState<any>(null);
  const [isDefaultFormVisible, setDefaultFormVisible] = useState(false);
  const [isReadOnly, setReadOnly] = useState(false);
  const [openMapper, setMapper] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [openConnector, setOpenConnector] = useState(false);
  const [type, setType] = useState("script");
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  const openDialog = useDialog();

  // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
  const updateScript = ({ expr, exprMeta } = {}) => {
    getBusinessObject(element).script = expr;
    getBusinessObject(element).scriptFormat = "axelor";
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get("modeling");
    // @ts-expect-error -- safety: bpmn-js is() accepts any element-like shape at runtime
    modeling.updateProperties(element, {
      ["script"]: expr,
    });
    setScript(expr);
    setProperty("scriptValue", exprMeta ? exprMeta : undefined);
  };

  const setProperty = React.useCallback(
    (name: any, value: any) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      const propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (value === undefined || value === "") {
        delete bo.$attrs[propertyName];
      }
    },
    [element, bpmnModeler],
  );

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

  const getFormViews = React.useCallback(
    async (value: any, name: any) => {
      if (!value) return;
      const views = await getViews(
        name === "metaModel"
          ? { ...(value || {}), type: "metaModel" }
          : { ...(value || {}), type: "metaJsonModel" },
        [],
      );
      setFormViews(views);
      if (views && (views.length === 1 || views.length === 0)) {
        setDefaultFormVisible(false);
        setProperty("defaultForm", views[0] && views[0]["name"]);
        return;
      }
      setDefaultFormVisible(true);
    },
    [setProperty],
  );

  const updateValue = (name: any, value: any, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}ModelName`, undefined);
      setProperty(`${name}ModelLabel`, undefined);
      setProperty("defaultForm", undefined);
      setDefaultForm(null);
      setDefaultFormVisible(false);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}ModelName`, value["fullName"] || value["name"]);
    getFormViews(value, name);
  };

  const updateSelectValue = (name: any, value: any, label: any, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const getScript = React.useCallback(() => {
    const bo = getBusinessObject(element);
    return {
      script: (bo?.get("script") || "")?.replace(/[\u200B-\u200D\uFEFF]/g, ""),
    };
  }, [element]);

  const getSelectValue = React.useCallback(
    (name: any) => {
      const label = getProperty(`${name}Label`);
      const newName = getProperty(name);
      if (newName) {
        const value = { name: newName };
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

  const getter = buildScriptGetter(getProperty);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaModelName = getSelectValue("metaModelModelName");
    const metaJsonModel = getSelectValue("metaJsonModel");
    const displayOnModels = getProperty("displayOnModels");
    const displayOnModelLabels = getProperty("displayOnModelLabels");
    const displayStatusVal = getProperty("displayStatus");
    const isCustomVal = getProperty("isCustom");
    const defaultFormVal = getSelectValue("defaultForm");
    const typeVal = getProperty("type");
    setDisplayStatus(getBool(displayStatusVal));
    setType(typeVal || "script");
    setIsCustom(
      isCustomVal === undefined || isCustomVal === ""
        ? metaJsonModel
          ? true
          : false
        : getBool(isCustomVal),
    );
    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
    setDefaultForm(defaultFormVal);
    const model = metaModel ? "metaModel" : "metaJsonModel";
    const value = metaModel
      ? { ...(metaModel || {}), fullName: metaModelName && metaModelName.name }
      : { ...(metaJsonModel || {}) };
    getFormViews(value, model);
    const modelsList: any[] = [];
    if (displayOnModels) {
      const names = displayOnModels.split(",");
      const labels = displayOnModelLabels && displayOnModelLabels.split(",");
      names &&
        names.forEach((name: any, i: any) => {
          modelsList.push({
            name: name,
            title: labels && labels[i],
          });
        });
      setModels(modelsList);
    } else {
      setModels([]);
    }
  }, [getProperty, getSelectValue, getFormViews]);

  useEffect(() => {
    const scriptValue = getProperty("scriptValue");
    setReadOnly(!!scriptValue);
  }, [getProperty]);

  useEffect(() => {
    if (is(element, "bpmn:ScriptTask")) {
      const bo = getBusinessObject(element);
      if (bo) {
        setVisible(true);
        getBusinessObject(element).scriptFormat = "axelor";
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel open={true} label={label}>
        <SelectBox
          element={element}
          entry={{
            id: "type",
            label: "Type",
            modelProperty: "type",
            selectOptions: function () {
              return implementationOptions;
            },
            emptyParameter: false,
            get: function () {
              return { type };
            },
            set: function (e: any, values: any) {
              const typeVal = values?.type;
              setProperty("type", typeVal);
              setType(typeVal);
              if (typeVal === "request") {
                updateValue("metaModel", undefined);
                updateValue("metaJsonModel", undefined);
                setProperty("defaultForm", undefined);
                setProperty("displayStatus", undefined);
                setProperty("displayOnModels", undefined);
                setProperty("isCustom", undefined);
              } else if (typeVal === "connector") {
                setProperty("resultVariable", undefined);
              }
              updateScript({ expr: undefined, exprMeta: undefined });
              setReadOnly(false);
            },
          }}
        />
        <ScriptEditorSection
          element={element}
          type={type}
          isReadOnly={isReadOnly}
          setReadOnly={setReadOnly}
          open={open}
          setOpen={setOpen}
          openMapper={openMapper}
          setMapper={setMapper}
          openConnector={openConnector}
          setOpenConnector={setOpenConnector}
          openScriptDialog={openScriptDialog}
          setOpenScriptDialog={setOpenScriptDialog}
          script={script}
          setScript={setScript}
          bpmnModeler={bpmnModeler}
          getScript={getScript}
          updateScript={updateScript}
          setProperty={setProperty}
          getProperty={getProperty}
          getter={getter}
          openDialog={openDialog}
        />
        {type !== "connector" && (
          <TextField
            element={element}
            entry={{
              id: "scriptResultVariable",
              label: translate("Result variable"),
              modelProperty: "scriptResultVariable",
              get: function () {
                const bo = getBusinessObject(element);
                const boResultVariable = bo && bo.get("camunda:resultVariable");
                return { scriptResultVariable: boResultVariable };
              },
              set: function (e: any, values: any) {
                if (getBusinessObject(element)) {
                  getBusinessObject(element).resultVariable = values?.scriptResultVariable || undefined;
                }
              },
              validate: function (e, values) {
                if (!values?.scriptResultVariable && type === "request") {
                  return {
                    scriptResultVariable: translate("Must provide a value"),
                  };
                }
              },
            }}
            canRemove={true}
          />
        )}
        {type !== "request" && (
          <ModelSection
            element={element}
            layout="flat"
            isCustom={isCustom}
            setIsCustom={setIsCustom}
            metaModel={metaModel}
            setMetaModel={setMetaModel}
            metaJsonModel={metaJsonModel}
            setMetaJsonModel={setMetaJsonModel}
            defaultForm={defaultForm}
            setDefaultForm={setDefaultForm}
            isDefaultFormVisible={isDefaultFormVisible}
            formViews={formViews}
            displayStatus={displayStatus}
            setDisplayStatus={setDisplayStatus}
            models={models}
            setModels={setModels}
            getProcessConfig={(configType: any) => getProcessConfig(element, configType)}
            setProperty={setProperty}
            updateSelectValue={updateSelectValue}
            addModels={(values: any) => addModels(values, setProperty)}
          />
        )}
      </CollapsePanel>
    )
  );
}
