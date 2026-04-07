import { translate } from "@studio/shared/i18n";

export const SEQUENCE_FLOW = [
  {
    label: translate("Sequence flow"),
    actionName: "replace-with-sequence-flow",
    className: "bpmn-icon-connection",
  },
  {
    label: translate("Default flow"),
    actionName: "replace-with-default-flow",
    className: "bpmn-icon-default-flow",
  },
  {
    label: translate("Conditional flow"),
    actionName: "replace-with-conditional-flow",
    className: "bpmn-icon-conditional-flow",
  },
];

export const DATA_OBJECT_REFERENCE = [
  {
    label: translate("Data store reference"),
    actionName: "replace-with-data-store-reference",
    className: "bpmn-icon-data-store",
    target: {
      type: "bpmn:DataStoreReference",
    },
  },
];

export const DATA_STORE_REFERENCE = [
  {
    label: translate("Data object reference"),
    actionName: "replace-with-data-object-reference",
    className: "bpmn-icon-data-object",
    target: {
      type: "bpmn:DataObjectReference",
    },
  },
];

export const PARTICIPANT = [
  {
    label: translate("Expanded pool/participant"),
    actionName: "replace-with-expanded-pool",
    className: "bpmn-icon-participant",
    target: {
      type: "bpmn:Participant",
      isExpanded: true,
    },
  },
  {
    label: function (element: { children?: unknown[] }) {
      let label = translate("Empty pool/participant");

      if (element.children && element.children.length) {
        label += " (removes content)";
      }

      return label;
    },
    actionName: "replace-with-collapsed-pool",

    className: "bpmn-icon-lane",
    target: {
      type: "bpmn:Participant",
      isExpanded: false,
    },
  },
];
