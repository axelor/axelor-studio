import { translate } from "@studio/shared/i18n";

export const SUBPROCESS_EXPANDED = [
  {
    label: translate("Transaction"),
    actionName: "replace-with-transaction",
    className: "bpmn-icon-transaction",
    target: {
      type: "bpmn:Transaction",
      isExpanded: true,
    },
  },
  {
    label: translate("Event sub-process"),
    actionName: "replace-with-event-subprocess",
    className: "bpmn-icon-event-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      triggeredByEvent: true,
      isExpanded: true,
    },
  },
  {
    label: `${translate("Sub-process")} (${translate("collapsed")}})`,
    actionName: "replace-with-collapsed-subprocess",
    className: "bpmn-icon-subprocess-collapsed",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: false,
    },
  },
];

export const TRANSACTION = [
  {
    label: translate("Transaction"),
    actionName: "replace-with-transaction",
    className: "bpmn-icon-transaction",
    target: {
      type: "bpmn:Transaction",
      isExpanded: true,
    },
  },
  {
    label: translate("Sub-process"),
    actionName: "replace-with-subprocess",
    className: "bpmn-icon-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: true,
    },
  },
  {
    label: translate("Event sub-process"),
    actionName: "replace-with-event-subprocess",
    className: "bpmn-icon-event-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      triggeredByEvent: true,
      isExpanded: true,
    },
  },
];

export const EVENT_SUB_PROCESS = TRANSACTION;

export const TASK = [
  {
    label: translate("Task"),
    actionName: "replace-with-task",
    className: "bpmn-icon-task",
    target: {
      type: "bpmn:Task",
    },
  },
  {
    label: translate("User task"),
    actionName: "replace-with-user-task",
    className: "bpmn-icon-user",
    target: {
      type: "bpmn:UserTask",
    },
  },
  {
    label: translate("Service task"),
    actionName: "replace-with-service-task",
    className: "bpmn-icon-service",
    target: {
      type: "bpmn:ServiceTask",
    },
  },
  {
    label: translate("Send task"),
    actionName: "replace-with-send-task",
    className: "bpmn-icon-send",
    target: {
      type: "bpmn:SendTask",
    },
  },
  {
    label: translate("Receive task"),
    actionName: "replace-with-receive-task",
    className: "bpmn-icon-receive",
    target: {
      type: "bpmn:ReceiveTask",
    },
  },
  {
    label: translate("Manual task"),
    actionName: "replace-with-manual-task",
    className: "bpmn-icon-manual",
    target: {
      type: "bpmn:ManualTask",
    },
  },
  {
    label: translate("Business rule task"),
    actionName: "replace-with-rule-task",
    className: "bpmn-icon-business-rule",
    target: {
      type: "bpmn:BusinessRuleTask",
    },
  },
  {
    label: translate("Script task"),
    actionName: "replace-with-script-task",
    className: "bpmn-icon-script",
    target: {
      type: "bpmn:ScriptTask",
    },
  },
  {
    label: translate("Call activity"),
    actionName: "replace-with-call-activity",
    className: "bpmn-icon-call-activity",
    target: {
      type: "bpmn:CallActivity",
    },
  },
  {
    label: `${translate("Sub-process")} (${translate("collapsed")})`,
    actionName: "replace-with-collapsed-subprocess",
    className: "bpmn-icon-subprocess-collapsed",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: false,
    },
  },
  {
    label: `${translate("Sub-process")} (${translate("expanded")})`,
    actionName: "replace-with-expanded-subprocess",
    className: "bpmn-icon-subprocess-expanded",
    target: {
      type: "bpmn:SubProcess",
      isExpanded: true,
    },
  },
];
