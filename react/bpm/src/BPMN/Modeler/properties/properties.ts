/**
 * Properties tab assembler -- composes tab groups from split modules.
 * Preserves the same default export signature: getTabs(element, canvas, bpmnFactory, elementRegistry, translate, bpmnModeler)
 */

import { createGeneralTabGroups } from "./general-tab-groups";
import {
  createConfigurationTabGroups,
  createVariablesTabGroups,
  createListenersTabGroups,
  createViewAttributsGroups,
  createMenuActionGroups,
  createConfigurationGroups,
  createDefinitionTabGroups,
} from "./configuration-tab-groups";

export default function getTabs(
  element: any,
  canvas: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
  bpmnModeler: any,
) {
  const definitionTab = {
    id: "definition",
    label: translate("General"),
    groups: createDefinitionTabGroups(element, bpmnFactory, elementRegistry, translate),
  };

  const generalTab = {
    id: "general",
    label: translate("General"),
    groups: createGeneralTabGroups(
      element,
      canvas,
      bpmnFactory,
      elementRegistry,
      translate,
      bpmnModeler,
    ),
  };

  const nodeConfigurationTab = {
    id: "node-configuration",
    label: translate("Configuration"),
    groups: createConfigurationTabGroups(
      element,
      canvas,
      bpmnFactory,
      elementRegistry,
      translate,
      bpmnModeler,
    ),
  };

  const variablesTab = {
    id: "variables",
    label: translate("Variables"),
    groups: createVariablesTabGroups(element, bpmnFactory, elementRegistry, translate),
  };

  const listenersTab = {
    id: "listeners",
    label: translate("Listeners"),
    groups: createListenersTabGroups(element, bpmnFactory, elementRegistry, translate),
  };

  const viewAttributesTab = {
    id: "view-attributes",
    label: translate("View attributes"),
    groups: createViewAttributsGroups(element, bpmnFactory, elementRegistry, translate),
  };

  const menuActionTab = {
    id: "menu-action-tab",
    label: translate("Menu/Action"),
    groups: createMenuActionGroups(element, bpmnFactory, elementRegistry, translate),
  };

  const configurationTab = {
    id: "configuration",
    label: translate("Configuration"),
    groups: createConfigurationGroups(element, bpmnFactory, elementRegistry, translate),
  };

  const tabs = [
    definitionTab,
    generalTab,
    nodeConfigurationTab,
    viewAttributesTab,
    variablesTab,
    menuActionTab,
    configurationTab,
    listenersTab,
  ];
  return tabs;
}
