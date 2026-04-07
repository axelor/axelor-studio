import { translate } from "@studio/shared/i18n";

import { getServiceTaskLikeBusinessObject } from "../../../../../../utils/ImplementationTypeUtils";

export const eventTypes = [
  "bpmn:StartEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:EndEvent",
  "bpmn:BoundaryEvent",
];

import type { ModdleElement } from "@studio/shared/types";

export function getBusinessObject(element: unknown): ModdleElement | undefined {
  // safety: getServiceTaskLikeBusinessObject returns false when element is not service-task-like
  return getServiceTaskLikeBusinessObject(element as Parameters<typeof getServiceTaskLikeBusinessObject>[0]) || undefined;
}

export const bindingOptions = [
  {
    name: translate("latest"),
    value: "latest",
  },
  {
    name: translate("deployment"),
    value: "deployment",
  },
  {
    name: translate("version"),
    value: "version",
  },
  {
    name: translate("versionTag"),
    value: "versionTag",
  },
];

export const implementationOptions = [
  { name: translate("Java class"), value: "class" },
  { name: translate("Expression"), value: "expression" },
  {
    name: translate("Delegate expression"),
    value: "delegateExpression",
  },
  { name: translate("External"), value: "external" },
];
