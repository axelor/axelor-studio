import React from "react";
import { translate } from "@studio/shared/i18n";

import { TextField } from "../../../../../../components/properties/components";
import { Title } from "@studio/shared/components";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import { getBusinessObject } from "./constants";

interface DelegateFieldsProps extends PropertiesPanelComponentProps {
  implementationType?: string;
  setProperty?: (name: string, value: unknown) => void;
}

export default function DelegateFields({
  element,
  index,
  implementationType,
  setProperty,
}: DelegateFieldsProps) {
  if (implementationType === "class") {
    return (
      <TextField
        element={element}
        entry={{
          id: "class",
          label: translate("Java class"),
          modelProperty: "class",
          get: function () {
            const values: Record<string, unknown> = {};
            const bo = getBusinessObject(element);
            const boClass = bo && bo.get("class");
            values.class = boClass;
            return values;
          },

          set: function (element: any, values: any) {
            const className = values.class;
            const bo = getBusinessObject(element);
            if (bo) {
              bo.class = className;
              bo.expression = undefined;
              bo.resultVariable = undefined;
              bo.delegateExpression = undefined;
              bo.topic = undefined;
              bo.decisionRef = undefined;
              setProperty?.("decisionName", undefined);
            }
          },
          validate: function (e, values) {
            if (!values.class) {
              return { class: translate("Must provide a value") };
            }
          },
        }}
        canRemove={true}
      />
    );
  }

  if (implementationType === "expression") {
    return (
      <React.Fragment>
        <TextField
          element={element}
          entry={{
            id: "expression",
            label: translate("Expression"),
            modelProperty: "expression",
            get: function () {
              const values: Record<string, unknown> = {};
              const bo = getBusinessObject(element);
              const expression = bo && bo.get("expression");
              values.expression = expression;
              return values;
            },

            set: function (element: any, values: any) {
              const expression = values.expression;
              const bo = getBusinessObject(element);
              if (bo) {
                bo.expression = expression;
                bo.class = undefined;
                bo.delegateExpression = undefined;
                bo.topic = undefined;
                bo.decisionRef = undefined;
                setProperty?.("decisionName", undefined);
              }
            },
            validate: function (e, values) {
              if (!values.expression) {
                return {
                  expression: translate("Must provide a value"),
                };
              }
            },
          }}
          canRemove={true}
        />
        <TextField
          element={element}
          entry={{
            id: "resultVariable",
            label: translate("Result variable"),
            modelProperty: "resultVariable",
            get: function () {
              const bo = getBusinessObject(element);
              const boResultVariable = bo && bo.get("camunda:resultVariable");
              return { resultVariable: boResultVariable };
            },
            set: function (e: any, values: any) {
              const bo = getBusinessObject(element);
              if (bo) {
                bo.resultVariable = values.resultVariable || undefined;
              }
            },
          }}
          canRemove={true}
        />
      </React.Fragment>
    );
  }

  if (implementationType === "delegateExpression") {
    return (
      <TextField
        element={element}
        entry={{
          id: "delegateExpression",
          label: translate("Delegate expression"),
          modelProperty: "delegateExpression",
          get: function () {
            const values: Record<string, unknown> = {};
            const bo = getBusinessObject(element);
            const boDelegateExpression = bo && bo.get("delegateExpression");
            values.delegateExpression = boDelegateExpression;
            return values;
          },

          set: function (element: any, values: any) {
            const className = values.delegateExpression;
            const bo = getBusinessObject(element);
            if (bo) {
              bo.delegateExpression = className;
              bo.class = undefined;
              bo.expression = undefined;
              bo.resultVariable = undefined;
              bo.topic = undefined;
              bo.decisionRef = undefined;
              setProperty?.("decisionName", undefined);
            }
          },
          validate: function (e, values) {
            if (!values.delegateExpression) {
              return {
                delegateExpression: translate("Must provide a value"),
              };
            }
          },
        }}
        canRemove={true}
      />
    );
  }

  if (implementationType === "external") {
    return (
      <React.Fragment>
        <TextField
          element={element}
          entry={{
            id: "topic",
            label: translate("Topic"),
            modelProperty: "topic",
            get: function () {
              const values: Record<string, unknown> = {};
              const bo = getBusinessObject(element);
              const topic = bo && bo.get("topic");
              values.topic = topic;
              return values;
            },

            set: function (element: any, values: any) {
              const topic = values.topic;
              const bo = getBusinessObject(element);
              if (bo) {
                bo.topic = topic;
                bo.class = undefined;
                bo.expression = undefined;
                bo.resultVariable = undefined;
                bo.delegateExpression = undefined;
                bo.decisionRef = undefined;
                setProperty?.("decisionName", undefined);
              }
            },
            validate: function (e, values) {
              if (!values.topic) {
                return { topic: translate("Must provide a value") };
              }
            },
          }}
          canRemove={true}
        />
        {/* safety: React list iterator always provides index */}
        <Title divider={index! > 0} label="External task configuration" />
        <TextField
          element={element}
          entry={{
            id: "taskPriority",
            label: translate("Task priority"),
            modelProperty: "taskPriority",
            get: function () {
              const values: Record<string, unknown> = {};
              const bo = getBusinessObject(element);
              const boTaskPriority = bo && bo.get("taskPriority");
              values.taskPriority = boTaskPriority;
              return values;
            },

            set: function (element: any, values: any) {
              const taskPriority = values.taskPriority;
              const bo = getBusinessObject(element);
              if (bo) {
                bo.taskPriority = taskPriority;
              }
            },
          }}
          canRemove={true}
        />
      </React.Fragment>
    );
  }

  return null;
}
