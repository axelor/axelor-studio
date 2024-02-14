import React, { useEffect, useState } from "react";
import ExpressionBuilder from "../expression-builder/index";
import { translate } from "../../utils";
import { Select, Checkbox, Textbox } from "../components";
import { getBool } from "../../utils";
import { getCustomModels, getMetaModels, getModels } from "../../services/api";
import Tooltip from "../components/tooltip/tooltip";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

export default function ExtendedQueryProps({ element, bpmnModeler }) {
  const [isJson, setIsJson] = useState(false);
  const [isReadOnly, setReadOnly] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [openExpressionBuilder, setExpressionBuilder] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [model, setModel] = useState(null);

  const setProperty = (name, value) => {
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get("modeling");
    modeling.updateProperties(element, {
      [name]: value,
    });
  };

  const getProperty = React.useCallback(
    (name) => {
      return element.businessObject[name];
    },
    [element]
  );

  const handleOpen = () => {
    setExpressionBuilder(true);
  };

  const handleClose = () => {
    setExpressionBuilder(false);
  };

  useEffect(() => {
    async function fetchModel() {
      const name = getProperty("model");
      const isJson = getProperty("isJson");
      if (!name) {
        setModel(null);
        return;
      }
      const criteria = {
        criteria: [
          {
            fieldName: "name",
            operator: "=",
            value: name,
          },
        ],
        operator: "and",
      };
      const metaModels = await getModels(
        criteria,
        isJson ? "metaJsonModel" : "metaModel"
      );
      setModel(metaModels && metaModels[0]);
    }
    const isJson = getProperty("isJson");
    setIsJson(isJson);
    setReadOnly(getProperty("expressionValue") ? true : false);
    fetchModel();
  }, [getProperty]);

  return (
    <div>
      <Checkbox
        entry={{
          id: "isJson",
          label: translate("Is json"),
          modelProperty: "isJson",
          widget: "checkbox",
          get: function () {
            return { isJson: getBool(isJson) };
          },
          set: function (e, value) {
            let isJson = value.isJson;
            setIsJson(isJson);
            setProperty("isJson", isJson);
          },
        }}
        element={element}
      />
      <Select
        element={element}
        bpmnModeler={bpmnModeler}
        entry={{
          fetchMethod: () => (isJson ? getCustomModels() : getMetaModels()),
          name: "model",
          label: translate("Model"),
        }}
        value={model}
        onChange={(value) => {
          setModel(
            value
              ? {
                  ...(value || {}),
                  type: isJson ? "metaJsonModel" : "metaModel",
                }
              : undefined
          );
        }}
      />
      <Box d="flex" justifyContent="center" alignItems="center">
        <Textbox
          element={element}
          readOnly={isReadOnly || !model || model === "" ? true : false}
          bpmnModeler={bpmnModeler}
          entry={{
            id: "expression",
            label: translate("Query"),
            modelProperty: "expression",
            name: "expression",
            get: function () {
              let expression = getProperty("expression");
              return {
                expression: (expression || "").replace(
                  /[\u200B-\u200D\uFEFF]/g,
                  ""
                ),
              };
            },
            set: function (e, values) {
              setProperty(
                "expression",
                values.expression === "" ? undefined : values.expression
              );
            },
          }}
        />
        {model && (
          <Box d="flex" mt={4} pt={2}>
            <Tooltip title={translate("Enable")} aria-label="enable">
              <MaterialIcon
                icon="code"
                color={isReadOnly ? "primary" : "secondary"}
                fontSize={20}
                className="pointer"
                onClick={() => {
                  if (isReadOnly) {
                    setAlertMessage(
                      "Query can't be managed using builder once changed manually."
                    );
                    setAlertTitle("Warning");
                    setAlert(true);
                  }
                }}
              />
            </Tooltip>
            <MaterialIcon
              icon="edit"
              fontSize={18}
              color="primary"
              className="pointer"
              onClick={() => {
                handleOpen();
              }}
            />
            {openExpressionBuilder && (
              <ExpressionBuilder
                open={openExpressionBuilder}
                handleClose={() => handleClose()}
                type="bpmQuery"
                defaultModel={model}
                getExpression={() => {
                  const value = getProperty("expressionValue");
                  let values;
                  if (value !== undefined) {
                    try {
                      values = JSON.parse(value);
                      if (!values.length) {
                        values = null;
                      }
                    } catch (errror) {}
                  }
                  return { values: values, combinator: undefined };
                }}
                setProperty={(val) => {
                  const { expression, value } = val;
                  setProperty("expression", expression);
                  if (
                    expression === "" ||
                    expression === null ||
                    expression === undefined
                  ) {
                    setProperty("expressionValue", undefined);
                    return;
                  }
                  if (value) {
                    (value || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                    setProperty("expressionValue", value);
                    setReadOnly(true);
                  }
                }}
                element={element}
                title={"Add query"}
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
                <DialogContent>
                  <Box id="alert-dialog-description">
                    {translate(alertMessage)}
                  </Box>
                </DialogContent>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setAlert(false);
                      setAlertMessage(null);
                      setAlertTitle(null);
                      setReadOnly(false);
                      setProperty("expressionValue", undefined);
                    }}
                    variant="primary"
                    size="sm"
                    autoFocus
                  >
                    {translate("OK")}
                  </Button>
                  <Button
                    onClick={() => {
                      setAlert(false);
                    }}
                    variant="secondary"
                  >
                    {translate("Cancel")}
                  </Button>
                </DialogFooter>
              </Dialog>
            )}
          </Box>
        )}
      </Box>
    </div>
  );
}
