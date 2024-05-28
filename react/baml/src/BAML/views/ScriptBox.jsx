import React, { useEffect, useState } from "react";
import Builder from "mapper/src/App";
import { translate } from "../../utils";
import { Textbox, TextField } from "../components";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@axelor/ui";
import Tooltip from "../components/tooltip/tooltip";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import AlertDialog from "../expression-builder/components/AlertDialog";
import { getBusinessObject } from "../ModelUtil";

const createElement = (elementType, properties, parent, factory) => {
  let element = factory.create(elementType, properties);
  element.$parent = parent;
  return element;
};

export default function ScriptProps({ element, bpmnFactory, bpmnModeler }) {
  const [isReadOnly, setReadOnly] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [openMapper, setMapper] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  

  const handleMapperOpen = () => {
    setMapper(true);
  };

  const handleCloseMapper = () => {
    setMapper(false);
  };

  const getPropertyValue = (name) => {
    if (!element) return;
    const bo = element.businessObject;
    return bo[name];
  };

  const setProperty = (name, value) => {
    if (!element) return;
    const bo = element.businessObject;
    if (!bo) return;
    bo[name] = value;
    if (!value) {
      delete bo[name];
    }
  };

  const onSave = (expr) => {
    const { resultField, resultMetaField, sourceField, targetField } =
      expr || {};
    updateScript(resultField, resultMetaField);
    setProperty("sourceField", sourceField);
    setProperty("targetField", targetField);
    handleCloseMapper();
  };

  const getExpression = () => {
    const bo = element && element.businessObject;
    if (!bo) return {};
    let script = bo.script && bo.script.value;
    let scriptMeta = bo.scriptMeta && bo.scriptMeta.value;

    return {
      resultField: script,
      resultMetaField: scriptMeta,
    };
  };

  const getProperty = React.useCallback(
    (name) => {
      let bo = element.businessObject;
      return (bo && bo[name] && bo[name].value) || "";
    },
    [element]
  );

  const updateScript = (scriptValue, scriptMetaValue) => {
    if (element.businessObject && element.businessObject.script) {
      element.businessObject.script.value = scriptValue;
    } else {
      const script = createElement(
        "bpmn:Script",
        { value: scriptValue },
        element.businessObject,
        bpmnFactory
      );
      element.businessObject.script = script;
    }
    if (element.businessObject && element.businessObject.scriptMeta) {
      element.businessObject.scriptMeta.value = scriptMetaValue;
    } else {
      const scriptMeta = createElement(
        "bpmn:ScriptMeta",
        { value: scriptMetaValue },
        element.businessObject,
        bpmnFactory
      );
      element.businessObject.scriptMeta = scriptMeta;
    }
    if (!scriptMetaValue) {
      delete element.businessObject["scriptMeta"];
    }
    if (!scriptValue) {
      delete element.businessObject["script"];
    }
  };

  useEffect(() => {
    const scriptMeta = getProperty("scriptMeta");
    setReadOnly(scriptMeta ? true : false);
  }, [getProperty]);


  const getScript = React.useCallback(() => {
    let bo = getBusinessObject(element);
    return {
      script: (bo?.get("script")?.value || "")?.replace(/[\u200B-\u200D\uFEFF]/g, ""),
    };
  }, [element]);
  return (
    <React.Fragment>
      <Box d="flex" justifyContent="space-between" alignItems="center">
        <Textbox
          element={element}
          rows={5}
          readOnly={isReadOnly}
          bpmnModeler={bpmnModeler}
          defaultHeight={120}
          entry={{
            id: "script",
            label: translate("Script"),
            modelProperty: "script",
            name: "script",
            get: function () {
              const bo = element && element.businessObject;
              let script = bo && bo.script && bo.script.value;
              return {
                script: (script || "").replace(/[\u200B-\u200D\uFEFF]/g, ""),
              };
            },
            set: function (e, values) {
              updateScript(values.script, undefined);
            },
          }}
        />
        <Box d="flex" alignItems="center" mt={4} pt={2}>
          <Tooltip
            title={isReadOnly && translate("Enable")}
            aria-label="enable"
          >
            <MaterialIcon
              icon="code"
              color={isReadOnly ? "primary" : "secondary"}
              fontSize={20}
              className="pointer"
              onClick={() => {
                if (isReadOnly) {
                  setAlertMessage(
                    "Script can't be managed using builder once changed manually."
                  );
                  setAlertTitle("Warning");
                  setAlert(true);
                }
                else {
                  setScript(getScript()?.script);
                  setOpenScriptDialog(true)
                }
              }}
            />
          </Tooltip>
          <MaterialIcon
            icon="edit"
            color="primary"
            className="pointer"
            fontSize={18}
            onClick={() => {
              handleMapperOpen();
            }}
          />
          {openMapper && (
            <Builder
              open={openMapper}
              handleClose={handleCloseMapper}
              bpmnModeler={bpmnModeler}
              onSave={(expr) => {
                onSave(expr);
                setReadOnly(true);
              }}
              param={() => getExpression()}
              isDialog={true}
              isBAML={true}
              isBPMN={false}
            />
          )}
          {openAlert && (
            <Dialog
              open={openAlert}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogHeader onCloseClick={() => setAlert(false)}>
                <DialogTitle id="alert-dialog-title">
                  {translate(alertTitle)}
                </DialogTitle>
              </DialogHeader>
              <DialogContent>{translate(alertMessage)}</DialogContent>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setAlert(false);
                    setAlertMessage(null);
                    setAlertTitle(null);
                    setReadOnly(false);
                    setOpenScriptDialog(true)
                    setScript(getScript()?.script)
                    if (element.businessObject) {
                      element.businessObject.scriptValue = undefined;
                    }
                  }}
                  size="sm"
                  variant="primary"
                  autoFocus
                >
                  {translate("OK")}
                </Button>
                <Button
                  onClick={() => {
                    setAlert(false);
                  }}
                  variant="secondary"
                  size="sm"
                  autoFocus
                >
                  {translate("Cancel")}
                </Button>
              </DialogFooter>
            </Dialog>
          )}

          {openScriptDialog && (
            <AlertDialog
              openAlert={openScriptDialog}
              alertClose={() => setOpenScriptDialog(false)}
              handleAlertOk={() => {
                updateScript(script);
                setOpenScriptDialog(false);
              }}
              title={translate("Add script")}
              children={
                <Textbox
                  element={element}
                  showLabel={false}
                  defaultHeight={window?.innerHeight - 205}
                  entry={{
                    id:'script',
                    name: "script",
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
        </Box>
      </Box>
      <TextField
        entry={{
          id: "sourceField",
          label: translate("Source field"),
          modelProperty: "sourceField",
          get: function () {
            return { sourceField: getPropertyValue("sourceField") };
          },
          set: function (e, values) {
            setProperty("sourceField", values.sourceField);
          },
        }}
        bpmnModeler={bpmnModeler}
        element={element}
        canRemove={true}
      />
      <TextField
        entry={{
          id: "targetField",
          label: translate("Target field"),
          modelProperty: "targetField",
          get: function () {
            return { targetField: getPropertyValue("targetField") };
          },
          set: function (e, values) {
            setProperty("targetField", values.targetField);
          },
        }}
        element={element}
        canRemove={true}
      />
    </React.Fragment>
  );
}
