import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import React, { useEffect, useState } from "react";
import { Box, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog, Tooltip  } from "@studio/shared/components";
import { useDialog } from "@studio/shared/hooks";
import { translate } from "@studio/shared/i18n";

import QueryBuilder from "../../../../../../components/QueryBuilder";
import Select from "../../../../../../components/Select";
import TextField from "../../../../../../components/properties/components/TextField";
import Textbox from "../../../../../../components/properties/components/Textbox";
import { getButtons, getModels } from "../../../../../../shared/services";
import { getBool, getLowerCase } from "../../../../../../utils";
import CollapsePanel from "../../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import styles from "./user-task.module.css";

export default function UserTaskProps({
  element,
  _index,
  label,
  _bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [buttons, setButtons] = useState<any>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  const openDialog = useDialog();

  const getProperty = React.useCallback(
    (name: string) => {
      const bo = getBusinessObject(element);
      return (bo && bo.$attrs && bo.$attrs[name]) || "";
    },
    [element],
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addButtons = (values: any) => {
    const buttons: any[] = [];
    const buttonLabels: any[] = [];
    if (Array.isArray(values)) {
      if (values && values.length === 0) {
        setProperty("camunda:buttons", undefined);
        setProperty(`camunda:buttonLabels`, undefined);
        return;
      }
      values &&
        values.forEach((value: any) => {
          if (!value) {
            setProperty("camunda:buttons", undefined);
            setProperty(`camunda:buttonLabels`, undefined);
            return;
          }
          buttons.push(value.name);
          buttonLabels.push(value.title);
        });
    }
    if (buttons.length > 0) {
      setProperty(`camunda:buttonLabels`, buttonLabels.toString());
      setProperty("camunda:buttons", buttons.toString());
    }
  };

  function getBO(element: any) {
    if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
      return getBO(element.$parent);
    } else {
      return element.$parent;
    }
  }

  function getProcessConfig() {
    const model = getProperty("camunda:metaModel");
    const modelFullName = getProperty("camunda:metaModelModelName");
    const jsonModel = getProperty("camunda:metaJsonModel");
    const defaultForm = getProperty("camunda:defaultForm");
    if (model) {
      return [{ model, type: "metaModel", modelFullName, defaultForm }];
    } else if (jsonModel) {
      return [{ model: jsonModel, type: "metaJsonModel" }];
    } else {
      let bo = getBO(element && getBusinessObject(element));
      if (element?.type === "bpmn:Process") {
        bo = getBusinessObject(element);
      }
      if (
        (element && getBusinessObject(element) && getBusinessObject(element).$type) === "bpmn:Participant"
      ) {
        bo = element && getBusinessObject(element) && getBusinessObject(element).processRef;
      }
      const extensionElements = bo && bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return [];
      const processConfigurations = extensionElements.values.find(
        (e: any) => e.$type === "camunda:ProcessConfiguration",
      );
      const models: any[] = [];
      if (!processConfigurations && !processConfigurations.processConfigurationParameters)
        return [];
      processConfigurations.processConfigurationParameters.forEach((config: any) => {
        if (config.metaModel) {
          models.push({
            model: config.metaModel,
            type: "metaModel",
            modelFullName: config.model,
          });
        } else if (config.metaJsonModel) {
          models.push({ model: config.metaJsonModel, type: "metaJsonModel" });
        }
      });
      return models;
    }
  }

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

  const getter = () => {
    const value = getProperty("camunda:completedIfValue");
    const combinator = getProperty("camunda:completedIfCombinator");
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
    const { expression, value, combinator, checked } = val;
    setProperty("camunda:completedIf", expression);
    if (value === "" || value === null || value === undefined) {
      setProperty("camunda:completedIfValue", value);
    }
    if (value) {
      setProperty("camunda:completedIfValue", value);
      setReadOnly(true);
    }
    if (combinator) {
      setProperty("camunda:completedIfCombinator", combinator);
    }
    setProperty("camunda:checked", checked);
  };

  const getCompletedIf = () => {
    let completedIf = getProperty("camunda:completedIf");
    completedIf = (completedIf || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    return {
      completedIf,
    };
  };

  useEffect(() => {
    if (is(element, "bpmn:UserTask")) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  useEffect(() => {
    const buttonsProperty = getProperty("camunda:buttons");
    const buttonLabelsProperty = getProperty("camunda:buttonLabels");
    const completedIfValue = getProperty("camunda:completedIfValue");
    if (completedIfValue) {
      setReadOnly(true);
    } else {
      setReadOnly(false);
    }
    const buttons: any[] = [];
    if (buttonsProperty) {
      const names = buttonsProperty && buttonsProperty.split(",");
      const labels = buttonLabelsProperty && buttonLabelsProperty.split(",");
      names &&
        names.forEach((name: any, i: any) => {
          buttons.push({
            name: name,
            title: labels && labels[i],
          });
        });
      setButtons(buttons);
    } else {
      setButtons([]);
    }
  }, [getProperty]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
        <div className={styles.expressionBuilder}>
          <TextField
            element={element ? getBusinessObject(element) : undefined}
            readOnly={readOnly}
            entry={{
              id: "completedIf",
              label: translate("Completed if"),
              modelProperty: "completedIf",
              get: function () {
                return getCompletedIf();
              },
              set: function (e: any, values: any) {
                const oldVal = getProperty("camunda:completedIf");
                const currentVal = values["completedIf"];
                (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                setProperty("camunda:completedIf", currentVal);
                if (getLowerCase(oldVal) !== getLowerCase(currentVal)) {
                  setProperty("camunda:completedIfValue", undefined);
                  setProperty("camunda:completedIfCombinator", undefined);
                }
              },
            }}
            canRemove={true}
            endAdornment={
              <Box color="body" className={styles.new}>
                <Tooltip title={translate("Enable")} aria-label="enable">
                  <BootstrapIcon
                    icon="code-slash"
                    fontSize={18}
                    onClick={() => {
                      if (readOnly) {
                        openDialog({
                          title: "Warning",
                          message:
                            "Completed If can't be managed using builder once changed manually.",
                          onSave: () => {
                            setReadOnly(false);
                            setScript(getCompletedIf()?.completedIf);
                            setProperty("camunda:completedIfValue", undefined);
                            setProperty("camunda:completedIfCombinator", undefined);
                            setOpenScriptDialog(true);
                          },
                        });
                      } else {
                        setScript(getCompletedIf()?.completedIf);
                        setOpenScriptDialog(true);
                      }
                    }}
                  />
                </Tooltip>
                <MaterialIcon
                  icon="edit"
                  fontSize={16}
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
            }
          />
          <AlertDialog
            className={styles.scriptDialog}
            openAlert={openScriptDialog}
            alertClose={() => {
              setScript(getCompletedIf()?.completedIf);
              setOpenScriptDialog(false);
            }}
            handleAlertOk={() => {
              setProperty(
                "camunda:completedIf",
                (script || "").replace(/[\u200B-\u200D\uFEFF]/g, ""),
              );
              setOpenScriptDialog(false);
            }}
            title={translate("Completed if")}
            children={
              <Textbox
                element={element ? getBusinessObject(element) : undefined}
                className={styles.textbox}
                showLabel={false}
                defaultHeight={window?.innerHeight - 205}
                entry={{
                  id: "script",
                  label: translate("Completed if"),
                  modelProperty: "completedIf",
                  get: function () {
                    return { completedIf: script };
                  },
                  set: function (e: any, values: any) {
                    setScript(values?.completedIf);
                  },
                }}
              />
            }
          />
        </div>
        <div className={styles.allButtons}>
          <InputLabel color="body" className={styles.label}>
            {translate("Buttons")}
          </InputLabel>
          <Select
            className={styles.select}
            update={(value: any) => {
              setButtons(value);
              addButtons(value);
            }}
            fetchMethod={() => getButtons(getProcessConfig())}
            name="buttons"
            value={buttons || []}
            multiple={true}
            handleRemove={(option: any) => {
              const value = buttons?.filter((r: any) => r.name !== option.name);
              setButtons(value);
              addButtons(value);
            }}
            optionEqual={(a: any, b: any) => a.name === b.name}
            optionLabel={"title"}
            optionLabelSecondary={"name"}
          />
        </div>
      </CollapsePanel>
    )
  );
}
