import { translate } from "@studio/shared/i18n";

export const GATEWAY = [
  {
    label: translate("Exclusive gateway"),
    actionName: "replace-with-exclusive-gateway",
    className: "bpmn-icon-gateway-xor",
    target: {
      type: "bpmn:ExclusiveGateway",
    },
  },
  {
    label: translate("Parallel gateway"),
    actionName: "replace-with-parallel-gateway",
    className: "bpmn-icon-gateway-parallel",
    target: {
      type: "bpmn:ParallelGateway",
    },
  },
  {
    label: translate("Inclusive gateway"),
    actionName: "replace-with-inclusive-gateway",
    className: "bpmn-icon-gateway-or",
    target: {
      type: "bpmn:InclusiveGateway",
    },
  },
  {
    label: translate("Complex gateway"),
    actionName: "replace-with-complex-gateway",
    className: "bpmn-icon-gateway-complex",
    target: {
      type: "bpmn:ComplexGateway",
    },
  },
  {
    label: translate("Event-based gateway"),
    actionName: "replace-with-event-based-gateway",
    className: "bpmn-icon-gateway-eventbased",
    target: {
      type: "bpmn:EventBasedGateway",
      instantiate: false,
      eventGatewayType: "Exclusive",
    },
  },
];
