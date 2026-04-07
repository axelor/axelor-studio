import { translate } from "@studio/shared/i18n";

import { createElement } from "../utils";

export const PRIORITIES = [
  { value: "low", id: "low", title: "Low" },
  { value: "normal", id: "normal", title: "Normal" },
  { value: "high", id: "high", title: "High" },
  { value: "urgent", id: "urgent", title: "Urgent" },
];

export const TYPES = [
  { value: "value", id: "value", title: translate("Value") },
  { value: "field", id: "field", title: translate("Field") },
  { value: "script", id: "script", title: translate("Script") },
];

export const menuObj = {
  menuName: null,
  menuParent: null,
  position: null,
  positionMenu: null,
  permanent: false,
  tagCount: false,
  isUserMenu: false,
  formView: null,
  gridView: null,
  domain: null,
  roles: [],
  menuContexts: [],
};

export function createMenus(parent: any, bpmnFactory: any, properties: any) {
  return createElement("camunda:Menus", parent, bpmnFactory, properties);
}
