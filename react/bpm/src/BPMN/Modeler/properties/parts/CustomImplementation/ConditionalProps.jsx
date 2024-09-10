import React, { useEffect, useState } from "react";
import { createElement } from "../../../../../utils/ElementUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";

import AlertDialog from "../../../../../components/AlertDialog";
import { Textbox } from "../../../../../components/properties/components";
import { translate, getBool } from "../../../../../utils";
import QueryBuilder from "../../../../../components/QueryBuilder";
import { fetchModels } from "../../../../../services/api";
import {
  Box,

} from "@axelor/ui";
import Tooltip from "../../../../../components/Tooltip";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./conditional-props.module.css";
import Title from "../../../Title";
import useDialog from "../../../../../hooks/useDialog";

let CONDITIONAL_SOURCES = [
  "bpmn:Activity",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

const conditionType = "script";

export default function ConditionalProps({
  element,
  index,
  label,
  bpmnFactory,
  bpmnModeler,
  setDummyProperty = () => { },
}) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
 const [readOnly, setReadOnly] = useState(false);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  const openDialog = useDialog();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const getter = () => {
    const value = getProperty("camunda:conditionValue");
    const combinator = getProperty("camunda:conditionCombinator");
    const checked = getBool(getProperty("camunda:checked"));

    let values;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
      } catch (errror) { }
    }
    return { values: values, combinator, checked };
  };

  const setter = (val) => {
    const { expression: valExpression, value, combinator, checked } = val;
    if (value) {
      setProperty("camunda:conditionValue", value);
      setReadOnly(true);
    }
    if (combinator) {
      setProperty("camunda:conditionCombinator", combinator);
    }
    setValue(valExpression);
    setProperty("camunda:checked", checked);
  };

  const getProperty = React.useCallback(
    (name) => {
      const bo = getBusinessObject(element);
      return (bo && bo.$attrs && bo.$attrs[name]) || "";
    },
    [element]
  );

  const setProperty = (name, value) => {
    const bo = getBusinessObject(element);
    if (!bo) return;
    if (bo.$attrs) {
      if (!value) {
        delete bo.$attrs[name];
        return;
      }
      bo.$attrs[name] = value;
    } else {
      if (!value) {
        return;
      }
      bo.$attrs = { [name]: value };
    }
  };

  const getScript = () => {
    let bo = getBusinessObject(element);
    if (bo && bo.conditionExpression && bo.conditionExpression.body) {
      return {
        script: bo.conditionExpression.body.replace(
          /[\u200B-\u200D\uFEFF]/g,
          ""
        ),
      };
    }
  };

  const setValue = (valExpression) => {
    setDummyProperty({ bpmnModeler, element, value: true });
    let expression =
      valExpression && valExpression.replace(/[\u200B-\u200D\uFEFF]/g, "");
    expression =
      !expression || /^\s*$/.test(expression) ? undefined : expression;
    if (element.businessObject && element.businessObject.conditionExpression) {
      element.businessObject.conditionExpression.body = expression
        ? expression
        : undefined;
      element.businessObject.conditionExpression.resource = undefined;
      element.businessObject.conditionExpression.language = "axelor";
      let conditionExpression;
      let bo = getBusinessObject(element);
      const conditionProps = {
        body: "",
        language: "",
        "camunda:resource": undefined,
      };
      conditionExpression = createElement(
        "bpmn:FormalExpression",
        conditionProps,
        bo,
        bpmnFactory
      );
      element.businessObject.conditionExpression = conditionExpression;
      if (conditionExpression) {
        element.businessObject.conditionExpression.body = expression;
        element.businessObject.conditionExpression.resource = undefined;
        element.businessObject.conditionExpression.language = "axelor";
      }
      if (!expression) {
        conditionExpression = undefined;
        setProperty("camunda:conditionValue", undefined);
        setProperty("camunda:conditionCombinator", undefined);
      }
      if (!bpmnModeler) return;
      let elementRegistry = bpmnModeler.get("elementRegistry");
      let modeling = bpmnModeler.get("modeling");
      let shape = elementRegistry.get(element.id);
      if (!shape) return;
      if (CONDITIONAL_SOURCES.includes(bo.sourceRef.$type)) return;
      modeling &&
        modeling.updateProperties(shape, {
          conditionExpression,
        });
    } else {
      let conditionExpression;
      let bo = getBusinessObject(element);
      if (expression && expression !== "" && conditionType) {
        const conditionProps = {
          body: "",
          language: "",
          "camunda:resource": undefined,
        };
        conditionExpression = createElement(
          "bpmn:FormalExpression",
          conditionProps,
          bo,
          bpmnFactory
        );

        let source = element.source;

        // if default-flow, remove default-property from source
        if (source && source.businessObject.default === bo) {
          source.default = undefined;
        }
      }

      element.businessObject.conditionExpression = conditionExpression;
      if (conditionExpression) {
        element.businessObject.conditionExpression.body = expression;
        element.businessObject.conditionExpression.resource = undefined;
        element.businessObject.conditionExpression.language = "axelor";
      }

      if (!expression) {
        conditionExpression = undefined;
        setProperty("camunda:conditionValue", undefined);
        setProperty("camunda:conditionCombinator", undefined);
      }
      if (!bpmnModeler) return;
      let elementRegistry = bpmnModeler.get("elementRegistry");
      let modeling = bpmnModeler.get("modeling");
      let shape = elementRegistry.get(element.id);
      if (!shape) return;
      if (CONDITIONAL_SOURCES.includes(bo.sourceRef.$type)) return;
      modeling &&
        modeling.updateProperties(shape, {
          conditionExpression,
        });
    }
  };

  useEffect(() => {
    const conditionValue = getProperty("camunda:conditionValue");
    setReadOnly(conditionValue ? true : false);
  }, [getProperty]);

  useEffect(() => {
    if (
      is(element, "bpmn:SequenceFlow") &&
      isConditionalSource(element.source)
    ) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <Title divider={index > 0} label={label} />
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
                return getScript();
              },
              set: function (e, values) {
                setValue(values?.script);
              },
            }}
          />
          <Box color="body" className={styles.new}>
            <Tooltip title="Enable" aria-label="enable">
              <BootstrapIcon
                icon="code-slash"
                fontSize={18}
                onClick={() => {
                  if (readOnly) {
                    openDialog({
                      title: "Warning",
                      message:"Expression can't be managed using builder once changed manually.",
                      onSave: () => {
                        setReadOnly(false);
                        setScript(getScript()?.script);
                        setProperty("camunda:conditionValue", undefined);
                        setProperty("camunda:conditionCombinator", undefined);
                        setOpenScriptDialog(true);
                      },
                    });
                  } else {
                    setScript(getScript()?.script);
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
          {openScriptDialog && (
            <AlertDialog
              className={styles.scriptDialog}
              openAlert={openScriptDialog}
              alertClose={() => {
                setScript(getScript()?.script);
                setOpenScriptDialog(false);
              }}
              handleAlertOk={() => {
                setValue(script);
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
        </div>
      </div>
    )
  );
}

