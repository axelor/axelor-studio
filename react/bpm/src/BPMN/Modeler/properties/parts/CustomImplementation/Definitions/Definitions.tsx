import React, { useEffect, useState } from "react";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";

import Select from "../../../../../../components/Select";
import StaticSelect from "../../../../../../components/StaticSelect";
import { Checkbox, TextField, Textbox } from "../../../../../../components/properties/components";
import { getBool } from "../../../../../../utils";
import { getStudioApp, fetchWkf } from "../../../../../../shared/services";
import Stepper from "../Stepper";
import { WKF_COLORS, STATUS } from "../../../../constants";
import type { ModdleElement } from "@studio/shared/types";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import styles from "./definition.module.css";
import PreviousVersionsSection from "./PreviousVersionsSection";
import DefinitionActionsSection from "./DefinitionActionsSection";

function getSteps() {
  return [STATUS[1], STATUS[2], STATUS[3]];
}

interface DefinitionsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wkf?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reloadView?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSnackbarClick?: any;
  enableStudioApp?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNewVersion?: any;
  showError?: boolean;
}

export default function Definition({
  element,
  wkf = {},
  reloadView,
  handleSnackbarClick,
  enableStudioApp = false,
  addNewVersion = () => {},
  showError,
  bpmnModeler,
}: DefinitionsProps) {
  const [studioApp, setStudioApp] = useState<any>(null);
  const [wkfStatusColor, setWkfStatusColor] = useState<any[]>([]);
  const [wkfModelList, setWkfModelList] = useState<any>(null);
  const [expanded, setExpanded] = useState(true);
  const { statusSelect = 1 } = wkf || {};
  const steps = getSteps();

  const getProperty = React.useCallback(
    (name: string) => {
      const propertyName = `camunda:${name}`;
      return (element && (element as ModdleElement)?.$attrs && (element as ModdleElement)?.$attrs[propertyName]) || "";
    },
    [element],
  );

  const setProperty = React.useCallback(
    (name: any, value: any) => {
      const propertyName = `camunda:${name}`;
      if (!element) return;
      const el = element as ModdleElement;
      if (el.$attrs) {
        el.$attrs[propertyName] = value;
      } else {
        el.$attrs = { [propertyName]: value };
      }
      if (value === undefined) {
        delete el.$attrs[propertyName];
      }
    },
    [element, bpmnModeler],
  );

  const getVersionList = React.useCallback(async () => {
    const wkfModelListData: any[] = [];
    const { previousVersion } = wkf || {};
    const getWkfModelListData = async (previousVersion: any) => {
      if (previousVersion) {
        const { id: previousVersionId } = previousVersion || {};
        const previousVersionWkf = (await fetchWkf(previousVersionId)) || {};
        const { previousVersion: newPreviousVersion } = previousVersionWkf || {};
        wkfModelListData.push(previousVersionWkf);
        if (previousVersionWkf && previousVersionWkf.previousVersion) {
          await getWkfModelListData(newPreviousVersion);
        }
      }
    };
    await getWkfModelListData(previousVersion);
    setWkfModelList(wkfModelListData);
  }, [wkf]);

  useEffect(() => {
    const color = element && (element as ModdleElement)?.$attrs && (element as ModdleElement)?.$attrs["camunda:wkfStatusColor"];
    const wkfStatusColor = WKF_COLORS.find((c: any) => c.name === color);
    setWkfStatusColor([wkfStatusColor || { name: "blue", title: "Blue", color: "#2196f3" }]);
  }, [element]);

  useEffect(() => {
    if (!enableStudioApp) return;
    const studioAppVal = getProperty("studioApp");
    async function getStudioAppValue() {
      const res = await getStudioApp({
        data: {
          criteria: [{ fieldName: "code", operator: "=", value: studioAppVal }],
          operator: "and",
        },
      });
      setStudioApp(Array.isArray(res) && res.length > 0 ? res[0] : undefined);
    }
    if (studioAppVal) {
      if (typeof studioAppVal === "object") {
        setStudioApp(studioAppVal);
      } else {
        getStudioAppValue();
      }
    }
  }, [getProperty, enableStudioApp]);

  useEffect(() => {
    getVersionList();
  }, [getVersionList]);

  return (
    <React.Fragment>
      <Stepper active={statusSelect - 1} items={steps} />
      <TextField
        element={element}
        canRemove={true}
        showError={showError}
        isDefinition={true}
        entry={{
          id: "code",
          label: translate("Code"),
          modelProperty: "code",
          shouldValidate: true,
          required: true,
          get: function () {
            return { code: getProperty("code") };
          },
          set: function (e: any, value: any) {
            setProperty("code", value?.code?.toUpperCase());
          },
          validate: function (e, values) {
            if (!values.code) {
              return { code: translate("Must provide a value") };
            }
          },
        }}
      />
      <TextField
        element={element}
        canRemove={true}
        showError={showError}
        isDefinition={true}
        entry={{
          id: "diagramName",
          label: translate("Name"),
          modelProperty: "diagramName",
          shouldValidate: true,
          required: true,
          get: function () {
            return { diagramName: getProperty("diagramName") };
          },
          set: function (e: any, value: any) {
            setProperty("diagramName", value?.diagramName);
          },
          validate: function (e, values) {
            if (!values.diagramName) {
              return { diagramName: translate("Must provide a value") };
            }
          },
        }}
      />
      {enableStudioApp && (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("App")}
          </InputLabel>
          <Select
            className={styles.select}
            update={(value: any, _label: any) => {
              setStudioApp(value);
              setProperty("studioApp", value?.code);
            }}
            name="studioApp"
            value={studioApp}
            isLabel={false}
            fetchMethod={() => getStudioApp()}
            optionLabel={"name"}
          />
        </React.Fragment>
      )}
      <TextField
        element={element}
        canRemove={true}
        readOnly={true}
        entry={{
          id: "versionTag",
          label: translate("Version tag"),
          modelProperty: "versionTag",
          get: function () {
            return { versionTag: getProperty("versionTag") };
          },
          set: function (e: any, value: any) {
            setProperty("versionTag", value?.versionTag);
          },
        }}
      />
      <Checkbox
        element={element}
        entry={{
          id: "newVersionOnDeploy",
          label: translate("New version on deploy"),
          modelProperty: "newVersionOnDeploy",
          widget: "checkbox",
          get: function () {
            return {
              newVersionOnDeploy: getBool(getProperty("newVersionOnDeploy")),
            };
          },
          set: function (e: any, value: any) {
            setProperty("newVersionOnDeploy", !value?.newVersionOnDeploy);
          },
        }}
      />
      <InputLabel color="body" className={styles.label}>
        {translate("Wkf status color")}
      </InputLabel>
      <br />
      <StaticSelect
        name="wkfStatusColor"
        onChange={(value) => {
          setWkfStatusColor(value ? [value] : []);
          setProperty("wkfStatusColor", value?.name);
        }}
        value={wkfStatusColor}
        options={WKF_COLORS}
      />
      <Textbox
        element={element}
        canRemove={true}
        rows={8}
        entry={{
          id: "description",
          label: translate("Description"),
          modelProperty: "description",
          get: function () {
            return { description: getProperty("description") };
          },
          set: function (e: any, value: any) {
            setProperty("description", value?.description);
          },
        }}
      />

      <PreviousVersionsSection
        wkfModelList={wkfModelList}
        getVersionList={getVersionList}
        expanded={expanded}
        setExpanded={setExpanded}
      />

      <DefinitionActionsSection
        wkf={wkf}
        reloadView={reloadView}
        handleSnackbarClick={handleSnackbarClick}
        addNewVersion={addNewVersion}
      />
    </React.Fragment>
  );
}
