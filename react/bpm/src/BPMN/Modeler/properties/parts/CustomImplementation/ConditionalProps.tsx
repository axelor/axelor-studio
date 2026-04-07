import type { ModdleElement } from "@studio/shared/types";
import React, { useEffect, useState } from "react";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import { AlertDialog, Tooltip  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useDialog } from "@studio/shared/hooks";

import { Textbox } from "../../../../../components/properties/components";
import { getBool } from "../../../../../utils";
import QueryBuilder from "../../../../../components/QueryBuilder";
import { getModels } from "../../../../../shared/services";
import { createElement } from "../../../../../utils/ElementUtil";
import CollapsePanel from "../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../property-types";

import styles from "./conditional-props.module.css";

const CONDITIONAL_SOURCES = [
  "bpmn:Activity",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
];

function isConditionalSource(element: any) {
  return isAny(element, CONDITIONAL_SOURCES);
}

const conditionType = "script";

export default function ConditionalProps({
  element,
  _index,
  label,
  bpmnFactory,
  bpmnModeler,
}: PropertiesPanelComponentProps) {
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

    let values: any;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
      } catch (_errror) {}
    }
    return { values: values, combinator, checked };
  };

  const setter = (val: any) => {
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
    (name: string) => {
      const bo = getBusinessObject(element);
      return (bo && bo.$attrs && bo.$attrs[name]) || "";
    },
    [element],
  );

  const setProperty = (name: string, value: any) => {
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
    const bo = getBusinessObject(element);
    if (bo && bo.conditionExpression && bo.conditionExpression.body) {
      return {
        script: bo.conditionExpression.body.replace(/[\u200B-\u200D\uFEFF]/g, ""),
      };
    }
  };

  const setValue = (valExpression: any) => {
    let expression = valExpression && valExpression.replace(/[\u200B-\u200D\uFEFF]/g, "");
    expression = !expression || /^\s*$/.test(expression) ? undefined : expression;
    if (getBusinessObject(element) && getBusinessObject(element).conditionExpression) {
      getBusinessObject(element).conditionExpression.body = expression ? expression : undefined;
      getBusinessObject(element).conditionExpression.resource = undefined;
      getBusinessObject(element).conditionExpression.language = "axelor";
      let conditionExpression: any;
      const bo = getBusinessObject(element);
      const conditionProps = {
        body: "",
        language: "",
        "camunda:resource": undefined,
      };
      if (!bpmnFactory) return;
      conditionExpression = createElement(
        "bpmn:FormalExpression",
        conditionProps,
        bo,
        bpmnFactory,
      );
      getBusinessObject(element).conditionExpression = conditionExpression;
      if (conditionExpression) {
        getBusinessObject(element).conditionExpression.body = expression;
        getBusinessObject(element).conditionExpression.resource = undefined;
        getBusinessObject(element).conditionExpression.language = "axelor";
      }
      if (!expression) {
        conditionExpression = undefined;
        setProperty("camunda:conditionValue", undefined);
        setProperty("camunda:conditionCombinator", undefined);
      }
      if (!bpmnModeler) return;
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const modeling = bpmnModeler.get("modeling");
      const shape = element?.id ? elementRegistry.get(element.id) : undefined;
      if (!shape) return;
      if (CONDITIONAL_SOURCES.includes(bo.sourceRef.$type)) return;
      modeling &&
        modeling.updateProperties(shape, {
          conditionExpression,
        });
    } else {
      let conditionExpression: any;
      const bo = getBusinessObject(element);
      if (expression && expression !== "" && conditionType) {
        if (!bpmnFactory) return;
        const conditionProps = {
          body: "",
          language: "",
          "camunda:resource": undefined,
        };
        conditionExpression = createElement(
          "bpmn:FormalExpression",
          conditionProps,
          bo,
          bpmnFactory,
        );

        const source = (element as ModdleElement)?.source;

        // @ts-expect-error -- safety: bpmn-js source.businessObject.default is a dynamic moddle property
        // if default-flow, remove default-property from source
        if (source && (source as ModdleElement)?.businessObject.default === bo) {
          // @ts-expect-error -- safety: bpmn-js source.businessObject.default is a dynamic moddle property
          source.default = undefined;
        }
      }

      getBusinessObject(element).conditionExpression = conditionExpression;
      if (conditionExpression) {
        getBusinessObject(element).conditionExpression.body = expression;
        getBusinessObject(element).conditionExpression.resource = undefined;
        getBusinessObject(element).conditionExpression.language = "axelor";
      }

      if (!expression) {
        conditionExpression = undefined;
        setProperty("camunda:conditionValue", undefined);
        setProperty("camunda:conditionCombinator", undefined);
      }
      if (!bpmnModeler) return;
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const modeling = bpmnModeler.get("modeling");
      const shape = element?.id ? elementRegistry.get(element.id) : undefined;
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
    if (is(element, "bpmn:SequenceFlow") && isConditionalSource((element as ModdleElement)?.source)) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
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
              set: function (e: any, values: any) {
                setValue(values?.script);
              },
            }}
          />
          <Box color="body" className={styles.new}>
            <Tooltip title={translate("Enable")} aria-label="enable">
              <BootstrapIcon
                icon="code-slash"
                fontSize={18}
                onClick={() => {
                  if (readOnly) {
                    openDialog({
                      title: "Warning",
                      message: "Expression can't be managed using builder once changed manually.",
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
                fetchModels={getModels}
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
                    set: function (e: any, values: any) {
                      setScript(values?.script);
                    },
                  }}
                />
              }
            />
          )}
        </div>
      </CollapsePanel>
    )
  );
}
