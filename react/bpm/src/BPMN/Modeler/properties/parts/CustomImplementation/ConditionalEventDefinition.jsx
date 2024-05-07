import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { isEventSubProcess } from "bpmn-js/lib/util/DiUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";

import QueryBuilder from "../../../../../components/QueryBuilder";
import AlertDialog from "../../../../../components/AlertDialog";
import {
  TextField,
  Textbox,
} from "../../../../../components/properties/components";
import Tooltip from "../../../../../components/Tooltip";
import { translate, getBool } from "../../../../../utils";
import { fetchModels } from "../../../../../services/api";
import Select from "../../../../../components/Select";
import { TASK_LISTENER_EVENT_TYPE_OPTION } from "../../../constants";

import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Button,
  InputLabel,
  Box,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./ConditionalEventDefinition.module.css";

const conditionType = "script";

export default function ConditionalEventProps({
  element,
  conditionalEventDefinition,
  bpmnFactory,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [variableEventValue, setVariableEventValue] = useState("");
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");

  const getter = () => {
    const { scriptValue: value } = getValue("scriptValue")(element);
    const { combinator } = getValue("combinator")(element);
    const { checked } = getValue("checked")(element);
    let values;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
      } catch (errror) {}
    }
    return { values: values, combinator, checked: getBool(checked) };
  };

  const setter = (val) => {
    const { expression: valExpression, value, combinator, checked } = val;
    setCondition(
      undefined,
      { script: valExpression },
      value,
      combinator,
      checked
    );
  };

  const handleClickOpen = () => {
    setAlertMessage("Add all values");
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const getValue = React.useCallback(
    (modelProperty) => {
      return function (element) {
        let modelPropertyValue = conditionalEventDefinition.get(
          "camunda:" + modelProperty
        );
        let value = {};
        value[modelProperty] = modelPropertyValue;
        return value;
      };
    },
    [conditionalEventDefinition]
  );

  const setValue = (modelProperty) => {
    return function (element, values) {
      setDummyProperty({
        bpmnModeler,
        element,
        value: values[modelProperty],
      });
      let props = {};
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

  const setCondition = (e, values, scriptValue, combinator, checked) => {
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
          body: "",
          language: "",
          "camunda:resource": undefined,
        };
      }
      if (conditionType === "expression") {
        conditionProps.body = "";
      }

      let conditionOrConditionExpression;
      if (conditionType) {
        conditionOrConditionExpression = elementHelper.createElement(
          "bpmn:FormalExpression",
          conditionProps,
          conditionalEventDefinition || bo,
          bpmnFactory
        );

        let source = element.source;

        // if default-flow, remove default-property from source
        if (source && source.businessObject.default === bo) {
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
        element.businessObject.conditionExpression =
          conditionOrConditionExpression;
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
            "Variable name can be used to restrict that to changes of a specific variable"
          ),
        }}
      />
      {!(
        is(element, "bpmn:StartEvent") && !isEventSubProcess(element.parent)
      ) && (
        <>
          <InputLabel color="body" className={styles.label}>
            {translate("Variable event")}
          </InputLabel>
          <Select
            multiple
            options={TASK_LISTENER_EVENT_TYPE_OPTION}
            update={(value) => {
              const optionString = value?.map((item) => item?.value)?.join(",");
              setVariableEventValue(optionString);
              setValue("variableEvent")(element, {
                variableEvent: optionString,
              });
            }}
            name="multiSelect"
            value={variableEventValue
              ?.split(",")
              ?.flatMap((v) =>
                TASK_LISTENER_EVENT_TYPE_OPTION?.filter(
                  (item) => item?.value?.toString() === v
                )
              )}
            optionLabel="name"
            optionLabelSecondary="title"
            isLabel={false}
            description={translate(
              "Variable events can be used to restrict the type of change. It is possible to specify more than one variable change event as a comma separated list"
            )}
            handleRemove={(option) => {
              let value = variableEventValue
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
            set: function (e, values) {
              setCondition(e, values);
            },
            validate: function (e, values) {
              if (!values.script && conditionType === "script") {
                return { script: translate("Must provide a value") };
              }
            },
          }}
        />
        {conditionalEventDefinition && (
          <Box color="body" className={styles.new}>
            <Tooltip title="Enable" aria-label="enable">
              <BootstrapIcon
                icon="code-slash"
                fontSize={18}
                onClick={() => {
                  if (readOnly) {
                    setAlertMessage(
                      "Script can't be managed using builder once changed manually."
                    );
                    setAlertTitle("Warning");
                    setAlert(true);
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
                fetchModels={() => fetchModels(element)}
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
                set: function (e, values) {
                  setScript(values?.script);
                },
              }}
            />
          }
        />
      )}
      {openAlert && (
        <Dialog open={openAlert} backdrop centered className={styles.dialog}>
          <DialogHeader onCloseClick={() => setAlert(false)}>
            <h3>{translate(alertTitle)}</h3>
          </DialogHeader>
          <DialogContent className={styles.content}>
            {translate(alertMessage)}
          </DialogContent>
          <DialogFooter>
            <Button
              onClick={() => {
                setAlert(false);
                setAlertMessage(null);
                setAlertTitle(null);
                setReadOnly(false);
                setScript(getCondition()?.script);
                setValue("scriptValue")(element, { scriptValue: undefined });
                setValue("combinator")(element, { combinator: undefined });
                setScript(getCondition()?.script);
                setOpenScriptDialog(true);
              }}
              variant="primary"
              className={styles.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setAlert(false);
              }}
              variant="secondary"
              className={styles.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
