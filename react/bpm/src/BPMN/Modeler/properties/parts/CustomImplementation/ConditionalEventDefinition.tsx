import React, { useState, useEffect } from "react";
import { isEventSubProcess } from "bpmn-js/lib/util/DiUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import type { ModdleElement } from "@studio/shared/types";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import { AlertDialog, Tooltip  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import {
  Dialog as _Dialog,
  DialogHeader as _DialogHeader,
  DialogContent as _DialogContent,
  DialogFooter as _DialogFooter,
  Button as _Button,
  InputLabel,
  Box,
  DialogTitle as _DialogTitle,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useDialog } from "@studio/shared/hooks";

import { TASK_LISTENER_EVENT_TYPE_OPTION } from "../../../constants";
import Select from "../../../../../components/Select";
import { getModels } from "../../../../../shared/services";
import { TextField, Textbox } from "../../../../../components/properties/components";
import { getBool } from "../../../../../utils";
import QueryBuilder from "../../../../../components/QueryBuilder";
import { createElement } from "../../../../../utils/ElementUtil";
import type { PropertiesPanelComponentProps } from "../../property-types";


interface conditionTypeProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditionalEventDefinition?: any;
}
import styles from "./conditional-event.module.css";

const conditionType = "script";

export default function ConditionalEventProps({
  element,
  conditionalEventDefinition,
  bpmnFactory,
  _bpmnModeler,
}: conditionTypeProps) {
  const [open, setOpen] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [variableEventValue, setVariableEventValue] = useState("");
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  const openDialog = useDialog();

  const getter = () => {
    const { scriptValue: value } = getValue("scriptValue")(element);
    const { combinator } = getValue("combinator")(element);
    const { checked } = getValue("checked")(element);
    let values: any;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
      } catch (_errror) {}
    }
    return { values: values, combinator, checked: getBool(checked) };
  };

  const setter = (val: any) => {
    const { expression: valExpression, value, combinator, checked } = val;
    setCondition(undefined, { script: valExpression }, value, combinator, checked);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const getValue = React.useCallback(
    (modelProperty: any) => {
      return function (_element: any) {
        const modelPropertyValue = conditionalEventDefinition.get("camunda:" + modelProperty);
        const value: Record<string, any> = {};
        value[modelProperty] = modelPropertyValue;
        return value;
      };
    },
    [conditionalEventDefinition],
  );

  const setValue = (modelProperty: any) => {
    return function (element: any, values: any) {
      const props: Record<string, any> = {};
      props["camunda:" + modelProperty] = values[modelProperty] || undefined;
      conditionalEventDefinition[modelProperty] = values[modelProperty];
    };
  };

  const getCondition = () => {
    if (conditionalEventDefinition && conditionalEventDefinition.condition) {
      return {
        script: conditionalEventDefinition.condition.body,
      };
    }
  };

  const setCondition = (
    e: any,
    values: any,
    scriptValue?: any,
    combinator?: any,
    checked?: any,
  ) => {
    const bo = getBusinessObject(element);
    if (conditionalEventDefinition) {
      conditionalEventDefinition.condition.body = values.script;
      conditionalEventDefinition.condition.resource = undefined;
      conditionalEventDefinition.condition.language = "axelor";
      setReadOnly(scriptValue ? true : false);
      setValue("scriptValue")(element, { scriptValue });
      setValue("combinator")(element, { combinator });
      setValue("checked")(element, { checked });
    } else {
      let conditionProps = {
        body: undefined,
        language: undefined,
      };
      if (conditionType === "script") {
        conditionProps = {
          // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
          body: "",
          // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
          language: "",
          "camunda:resource": undefined,
        };
      }
      // @ts-expect-error -- safety: bpmn-js condition type comparison
      if (conditionType === "expression") {
        // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
        conditionProps.body = "";
      }

      let conditionOrConditionExpression: any;
      if (conditionType) {
        if (!bpmnFactory) return;
        conditionOrConditionExpression = createElement(
          "bpmn:FormalExpression",
          conditionProps,
          conditionalEventDefinition || bo,
          bpmnFactory,
        );

        // safety: bpmn-js sequence flow elements have .source not in typed interface
        const source = (element as ModdleElement | undefined)?.source as ModdleElement | undefined;

        // if default-flow, remove default-property from source
        // @ts-expect-error -- safety: bpmn-js source.businessObject.default is a dynamic moddle property
        if (source && source.businessObject?.default === bo) {
          source.default = undefined;
        }
      }
      Object.entries(conditionProps).forEach(([key, value]) => {
        if (!conditionOrConditionExpression) return;
        conditionOrConditionExpression[key] = value;
      });
      if (conditionalEventDefinition) {
        conditionalEventDefinition.condition = conditionOrConditionExpression;
        if (conditionalEventDefinition.condition) {
          conditionalEventDefinition.condition.body = values.script;
          conditionalEventDefinition.condition.resource = undefined;
          conditionalEventDefinition.condition.language = "axelor";
          setReadOnly(scriptValue ? true : false);
          setValue("scriptValue")(element, { scriptValue });
          setValue("combinator")(element, { combinator });
          setValue("checked")(element, { checked });
        }
      } else {
        getBusinessObject(element).conditionExpression = conditionOrConditionExpression;
      }
    }
  };

  useEffect(() => {
    const { scriptValue } = getValue("scriptValue")(element);
    setReadOnly(scriptValue ? true : false);
  }, [getValue, element]);

  useEffect(() => {
    const { variableEvent } = getValue("variableEvent")(element);
    setVariableEventValue(variableEvent ?? "");
  }, [element, getValue]);

  return (
    <div>
      <TextField
        element={element}
        entry={{
          id: "variableName",
          label: translate("Variable name"),
          modelProperty: "variableName",
          widget: "textField",
          get: getValue("variableName"),
          set: setValue("variableName"),
          description: translate(
            "Variable name can be used to restrict that to changes of a specific variable",
          ),
        }}
      />
      {!(element && is(element, "bpmn:StartEvent") && !isEventSubProcess(element.parent)) && (
        <>
          <InputLabel color="body" className={styles.label}>
            {translate("Variable event")}
          </InputLabel>
          <Select
            multiple
            type="multiple"
            options={TASK_LISTENER_EVENT_TYPE_OPTION}
            update={(value = []) => {
              const optionString = value?.map((item: any) => item?.value)?.join(",");
              setVariableEventValue(optionString);
              setValue("variableEvent")(element, {
                variableEvent: optionString,
              });
            }}
            name="multiSelect"
            value={variableEventValue
              ?.split(",")
              ?.flatMap((v) =>
                TASK_LISTENER_EVENT_TYPE_OPTION?.filter((item) => item?.value?.toString() === v),
              )}
            optionLabel="name"
            optionLabelSecondary="title"
            isLabel={false}
            description={translate(
              "Variable events can be used to restrict the type of change. It is possible to specify more than one variable change event as a comma separated list",
            )}
            handleRemove={(option: any) => {
              const value = variableEventValue
                ?.split(",")
                ?.filter((i) => i !== option?.value)
                ?.join(",");
              setVariableEventValue(value);
              setValue("variableEvent")(element, {
                variableEvent: value,
              });
            }}
          />
        </>
      )}
      <div className={styles.expressionBuilder}>
        <Textbox
          element={element}
          rows={3}
          className={styles.textbox}
          readOnly={readOnly}
          minimap={false}
          entry={{
            id: "script",
            label: translate("Script"),
            modelProperty: "script",
            get: function () {
              return getCondition();
            },
            set: function (e: any, values: any) {
              !readOnly && setCondition(e, values);
            },
            validate: function (e: any, values: any) {
              if (!values.script && conditionType === "script") {
                return { script: translate("Must provide a value") };
              }
            },
          }}
        />
        {conditionalEventDefinition && (
          <Box color="body" className={styles.new}>
            <Tooltip title={translate("Enable")} aria-label="enable">
              <BootstrapIcon
                icon="code-slash"
                fontSize={18}
                onClick={() => {
                  if (readOnly) {
                    openDialog({
                      title: "Warning",
                      message: "Script can't be managed using builder once changed manually.",
                      onSave: () => {
                        setReadOnly(false);
                        setScript(getCondition()?.script);
                        setValue("scriptValue")(element, {
                          scriptValue: undefined,
                        });
                        setValue("combinator")(element, {
                          combinator: undefined,
                        });
                        setScript(getCondition()?.script);
                        setOpenScriptDialog(true);
                      },
                    });
                  } else {
                    setScript(getCondition()?.script);
                    setOpenScriptDialog(true);
                  }
                }}
              />
            </Tooltip>
            <MaterialIcon
              icon="edit"
              fontSize={18}
              className={styles.newIcon}
              onClick={handleClickOpen}
            />
            {open && (
              <QueryBuilder
                open={open}
                close={handleClose}
                title="Add expression"
                setProperty={setter}
                getExpression={getter}
                fetchModels={getModels}
              />
            )}
          </Box>
        )}
      </div>
      {openScriptDialog && (
        <AlertDialog
          className={styles.scriptDialog}
          openAlert={openScriptDialog}
          alertClose={() => {
            setScript(getCondition()?.script);
            setOpenScriptDialog(false);
          }}
          handleAlertOk={() => {
            setCondition(undefined, { script });
            setOpenScriptDialog(false);
          }}
          title={translate("Add expression")}
          children={
            <Textbox
              element={element}
              className={styles.textbox}
              showLabel={false}
              defaultHeight={window?.innerHeight - 205}
              entry={{
                id: "script",
                label: translate("Script"),
                modelProperty: "script",
                get: function () {
                  return { script };
                },
                set: function (e: any, values: any) {
                  !readOnly && setScript(values?.script);
                },
              }}
            />
          }
        />
      )}
    </div>
  );
}
