import React, { useEffect, useState } from "react";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";

import Textbox from "../../../../../components/properties/components/Textbox";
import TextField from "../../../../../components/properties/components/TextField";
import QueryBuilder from "../../../../../components/QueryBuilder";
import AlertDialog from "../../../../../components/AlertDialog";
import Select from "../../../../../components/Select";
import Tooltip from "../../../../../components/Tooltip";
import { fetchModels, getButtons } from "../../../../../services/api";
import { translate, getLowerCase, getBool } from "../../../../../utils";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  InputLabel,
  Box,
  DialogTitle,
} from "@axelor/ui";
import Title from "../../../Title";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./user-task.module.css";

export default function UserTaskProps({
  element,
  index,
  label,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [buttons, setButtons] = useState(null);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");

  const getProperty = React.useCallback(
    (name) => {
      const bo = getBusinessObject(element);
      return (bo && bo.$attrs && bo.$attrs[name]) || "";
    },
    [element]
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addButtons = (values) => {
    const buttons = [];
    const buttonLabels = [];
    if (Array.isArray(values)) {
      if (values && values.length === 0) {
        setProperty("camunda:buttons", undefined);
        setProperty(`camunda:buttonLabels`, undefined);
        return;
      }
      values &&
        values.forEach((value) => {
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

  function getBO(element) {
    if (
      element &&
      element.$parent &&
      element.$parent.$type !== "bpmn:Process"
    ) {
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
      let bo = getBO(element && element.businessObject);
      if (element.type === "bpmn:Process") {
        bo = element.businessObject;
      }
      if (
        (element && element.businessObject && element.businessObject.$type) ===
        "bpmn:Participant"
      ) {
        bo =
          element &&
          element.businessObject &&
          element.businessObject.processRef;
      }
      const extensionElements = bo && bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return [];
      const processConfigurations = extensionElements.values.find(
        (e) => e.$type === "camunda:ProcessConfiguration"
      );
      const models = [];
      if (
        !processConfigurations &&
        !processConfigurations.processConfigurationParameters
      )
        return [];
      processConfigurations.processConfigurationParameters.forEach((config) => {
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

  const setProperty = (name, value) => {
    setDummyProperty({
      bpmnModeler,
      element,
      value,
    });
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

    let values;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
      } catch (errror) {}
    }
    return { values: values, combinator, checked };
  };

  const setter = (val) => {
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
    const buttons = [];
    if (buttonsProperty) {
      const names = buttonsProperty && buttonsProperty.split(",");
      const labels = buttonLabelsProperty && buttonLabelsProperty.split(",");
      names &&
        names.forEach((name, i) => {
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
      <div>
        <Title divider={index > 0} label={label} />
        <div className={styles.expressionBuilder}>
          <TextField
            element={element}
            readOnly={readOnly}
            entry={{
              id: "completedIf",
              label: translate("Completed if"),
              modelProperty: "completedIf",
              get: function () {
                return getCompletedIf();
              },
              set: function (e, values) {
                let oldVal = getProperty("camunda:completedIf");
                let currentVal = values["completedIf"];
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
                <Tooltip title="Enable" aria-label="enable">
                  <BootstrapIcon
                    icon="code-slash"
                    fontSize={18}
                    onClick={() => {
                      if (readOnly) {
                        setAlertMessage(
                          "Completed If can't be managed using builder once changed manually."
                        );
                        setAlertTitle("Warning");
                        setAlert(true);
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
                    fetchModels={() => fetchModels(element)}
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
                (script || "").replace(/[\u200B-\u200D\uFEFF]/g, "")
              );
              setOpenScriptDialog(false);
            }}
            title={translate("Completed if")}
            children={
              <Textbox
                element={element}
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
                  set: function (e, values) {
                    setScript(values?.completedIf);
                  },
                }}
              />
            }
          />
          <Dialog open={openAlert} centered backdrop className={styles.dialog}>
            <DialogHeader onCloseClick={() => setAlert(false)}>
              <DialogTitle>{translate(alertTitle)}</DialogTitle>
            </DialogHeader>
            <DialogContent className={styles.content}>
              <Box as="p" color="body" fontSize={5}>
                {translate(alertMessage)}
              </Box>
            </DialogContent>
            <DialogFooter>
              <Button
                className={styles.save}
                onClick={() => {
                  setAlert(false);
                }}
                variant="secondary"
              >
                {translate("Cancel")}
              </Button>
              <Button
                onClick={() => {
                  setAlert(false);
                  setAlertMessage(null);
                  setAlertTitle(null);
                  setReadOnly(false);
                  setScript(getCompletedIf()?.completedIf);
                  setProperty("camunda:completedIfValue", undefined);
                  setProperty("camunda:completedIfCombinator", undefined);
                  setOpenScriptDialog(true);
                }}
                variant="primary"
                className={styles.save}
              >
                {translate("OK")}
              </Button>
            </DialogFooter>
          </Dialog>
        </div>
        <div className={styles.allButtons}>
          <InputLabel color="body" className={styles.label}>
            {translate("Buttons")}
          </InputLabel>
          <Select
            className={styles.select}
            update={(value) => {
              setButtons(value);
              addButtons(value);
            }}
            fetchMethod={() => getButtons(getProcessConfig())}
            name="buttons"
            value={buttons || []}
            multiple={true}
            handleRemove={(option) => {
              const value = buttons?.filter((r) => r.name !== option.name);
              setButtons(value);
              addButtons(value);
            }}
            optionEqual={(a, b) => a.name === b.name}
          />
        </div>
      </div>
    )
  );
}
