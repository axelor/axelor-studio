import { is } from "bpmn-js/lib/util/ModelUtil";
import React, { useEffect, useState } from "react";
import { translate } from "@studio/shared/i18n";

import type { PropertiesPanelComponentProps } from "../../../property-types";
import { isServiceTaskLike } from "../../../../../../utils/ImplementationTypeUtils";
import { SelectBox } from "../../../../../../components/properties/components";
import {
  checkConnectAndStudioInstalled,
  getOrganization,
  getScenarios,
} from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import CollapsePanel from "../../components/CollapsePanel";

import DmnSection from "./DmnSection";
import ConnectSection from "./ConnectSection";
import DelegateFields from "./DelegateFields";
import ActionsSection from "./ActionsSection";
import { eventTypes, getBusinessObject, implementationOptions } from "./constants";
import {
  updateAction as updateActionUtil,
  updateScenariodata as updateScenariodataUtil,
  fetchDmnModel,
  clearImplementationType,
} from "./utils";
import { getCamundaAttr } from "../../../utils/camunda-utils";

export default function ServiceTaskDelegateProps({
  element,
  index,
  label,
  bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [implementationType, setImplementationType] = useState("");
  const [bindingType, setBindingType] = useState("latest");
  const [dmnModel, setDmnModel] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [compulsory, setCompulsory] = useState(true);
  const [actions, setActions] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [scenario, setScenario] = useState<any>(null);
  const [isInstall, setIsInstall] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const getPropertyValue = React.useCallback(
    (propertyName: any) => {
      const bo = getBusinessObject(element);
      return bo && bo[propertyName];
    },
    [element],
  );

  const setPropertyValue = (propertyName: any, value: any) => {
    const bo = getBusinessObject(element);
    if (bo) bo[propertyName] = value;
  };

  const setProperty = React.useCallback(
    (name: any, value: any) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant" && bo) {
        bo = getBusinessObject(bo.processRef);
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

  const getProperty = React.useCallback(
    (name: string) => {
      const propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant" && bo) {
        bo = getBusinessObject(bo.processRef);
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element],
  );

  const onConfirm = () => {
    if (dmnModel) {
      const bo = element ? getBusinessObject(element) : undefined;
      if (bo) {
        bo.decisionRef = dmnModel.decisionId;
        setProperty("decisionName", dmnModel.name);
      }
    }
    handleClose();
  };

  const updateModel = React.useCallback(
    (decisionRef: any) => {
      fetchDmnModel({ element, decisionRef, setProperty, setDmnModel });
    },
    [element, setProperty],
  );

  const getOrganizationScenarios = React.useCallback((id: any) => getScenarios(id), []);

  const updateAction = (value: any) => {
    updateActionUtil({ element, setProperty, value });
  };

  const updateScenariodata = (value: any, organization: any) => {
    updateScenariodataUtil({ element, setProperty, value, organization });
  };

  useEffect(() => {
    const bo = getBusinessObject(element);

    if (!bo) {
      setImplementationType("script");
      return;
    }

    const implementationType = getProperty("implementationType");
    setImplementationType(String(implementationType || ""));
  }, [element, getProperty]);

  useEffect(() => {
    if (implementationType === "actions") {
      const bo = getBusinessObject(element);
      const actions = getCamundaAttr(bo, "actions")?.split(",");
      const value =
        actions &&
        actions.map((action: any) => {
          return { name: action };
        });
      setActions(value || []);
    } else {
      setActions([]);
    }
  }, [implementationType, element]);

  useEffect(() => {
    if (implementationType === "connect") {
      const bo = getBusinessObject(element);
      const id = getCamundaAttr(bo, "scenario");
      const name = getCamundaAttr(bo, "scenarioLabel");
      const organizationId = getCamundaAttr(bo, "organizationId");
      const organizationLabel = getCamundaAttr(bo, "organizationLabel");
      if (organizations?.length === 1) {
        setOrganization({
          id: organizations[0].id,
          name: organizations[0].name,
        });
      } else {
        setOrganization({ id: organizationId, name: organizationLabel });
      }
      setScenario({ id, name });
    } else {
      setScenario(null);
      setOrganization(null);
    }
  }, [implementationType, element]);

  useEffect(() => {
    if (implementationType === "dmn") {
      const bo = getBusinessObject(element);
      if (bo && bo.decisionRef) {
        const decisionId = bo.decisionRef;
        updateModel(decisionId);
      }
      const compulsory = getProperty("compulsory");
      if (!compulsory && is(element, "bpmn:BusinessRuleTask")) {
        setProperty("compulsory", true);
      }
      setCompulsory(compulsory ? getBool(compulsory) : true);
    }
  }, [element, implementationType, updateModel, setProperty, getProperty]);

  useEffect(() => {
    const bo = getBusinessObject(element);
    // safety: isServiceTaskLike accepts ModdleElement from bpmn-js but TS types are imprecise
    if (bo && isServiceTaskLike(bo as Parameters<typeof isServiceTaskLike>[0])) {
      if (eventTypes.includes(element?.type as string)) {
        return;
      }
      if (is(element, "bpmn:SendTask") && bo) {
        bo.class = "com.axelor.studio.bpm.listener.SendTaskExecution";
      }
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  useEffect(() => {
    (async function () {
      const isConnectInstalled = await checkConnectAndStudioInstalled();
      if (isConnectInstalled) {
        setIsInstall(true);
        const data = await getOrganization();
        setOrganizations(data);
      } else {
        setIsInstall(false);
      }
    })();
  }, []);

  return (
    isVisible && (
      <CollapsePanel label={element && element.type !== "bpmn:SendTask" && label}>
        {(element?.type === "bpmn:ServiceTask" || element?.type !== "bpmn:SendTask") && (
          <React.Fragment>
            <SelectBox
              element={element}
              entry={{
                id: "implementationType",
                label: "Implementation",
                modelProperty: "implementationType",
                selectOptions: function () {
                  let options = implementationOptions;
                  if (isInstall) {
                    const connect = {
                      name: translate("Connect"),
                      value: "connect",
                    };
                    options = [...options, connect];
                  }
                  if (is(element, "bpmn:BusinessRuleTask")) {
                    const dmn = { name: translate("DMN"), value: "dmn" };
                    options = [...options, dmn];
                  } else if (is(element, "bpmn:ServiceTask")) {
                    const actionsOpt = {
                      name: translate("Actions"),
                      value: "actions",
                    };
                    options = [...options, actionsOpt];
                  }

                  return options;
                },
                get: function () {
                  return { implementationType };
                },
                set: function (e: any, values: any) {
                  if (!values) return;
                  const bo = getBusinessObject(element);
                  if (values.implementationType === "") {
                    clearImplementationType({ element, setProperty });
                  } else if (bo) {
                    values.implementationType !== "external"
                      ? (bo[values.implementationType as string] = "")
                      : (bo.topic = "");
                  }
                  if (values.implementationType === "dmn") {
                    setPropertyValue("mapDecisionResult", "singleResult");
                  }

                  if (values.implementationType !== "actions" && bo) {
                    bo.class = undefined;
                    setProperty("isAction", undefined);
                    setProperty("actions", undefined);
                  }
                  if (values.implementationType !== "connect" && bo) {
                    bo.class = undefined;
                    setProperty("organizationId", undefined);
                    setProperty("organizationLabel", undefined);
                    setProperty("scenario", undefined);
                    setProperty("scenarioLabel", undefined);
                  }
                  setImplementationType(values.implementationType);
                  setProperty("implementationType", values.implementationType);
                  setDmnModel(null);
                  if (bo) bo.decisionRef = undefined;
                },
              }}
            />
            {(implementationType === "class" ||
              implementationType === "expression" ||
              implementationType === "delegateExpression" ||
              implementationType === "external") && (
              <DelegateFields
                element={element}
                index={index}
                implementationType={implementationType}
                setProperty={setProperty}
              />
            )}
            {implementationType === "dmn" && (
              <DmnSection
                element={element}
                dmnModel={dmnModel}
                setDmnModel={setDmnModel}
                bindingType={bindingType}
                setBindingType={setBindingType}
                compulsory={compulsory}
                setCompulsory={setCompulsory}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                onConfirm={onConfirm}
                updateModel={updateModel}
                getPropertyValue={getPropertyValue}
                setPropertyValue={setPropertyValue}
                setProperty={setProperty}
              />
            )}
            {implementationType === "actions" && (
              <ActionsSection
                actions={actions}
                setActions={setActions}
                updateAction={updateAction}
              />
            )}
            {implementationType === "connect" && (
              <ConnectSection
                organizations={organizations}
                organization={organization}
                setOrganization={setOrganization}
                scenario={scenario}
                setScenario={setScenario}
                updateScenariodata={updateScenariodata}
                getOrganizationScenarios={getOrganizationScenarios}
              />
            )}
          </React.Fragment>
        )}
      </CollapsePanel>
    )
  );
}
