import React, { useEffect, useState } from "react";
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
import ExpressionBuilder from "../expression-builder/index";
import { translate } from "../../utils";
import { Textbox } from "../components";
import { getModels } from "../../services/api";
import Tooltip from "../components/tooltip/tooltip";

export default function ExtendedQueryProps({ element, bpmnModeler }) {
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
    setReadOnly(getProperty("expressionValue") ? true : false);
    fetchModel();
  }, [getProperty]);

  return (
    <Box d="flex" justifyContent="center" alignItems="center">
      <Textbox
        element={element}
        readOnly={isReadOnly}
        bpmnModeler={bpmnModeler}
        entry={{
          id: "expression",
          label: translate("Expression"),
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
          color="primary"
          fontSize={18}
          className="pointer"
          onClick={() => {
            handleOpen();
          }}
        />
        {openExpressionBuilder && (
          <ExpressionBuilder
            open={openExpressionBuilder}
            handleClose={() => handleClose()}
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
            title={translate("Add expression")}
          />
        )}
        {openAlert && (
          <Dialog
            open={openAlert}
            onClose={(e, reason) => {
              if (reason !== "backdropClick") {
                setAlert(false);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle id="alert-dialog-title">
                {translate(alertTitle)}
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <Box id="alert-dialog-description">{translate(alertMessage)}</Box>
            </DialogContent>
            <DialogFooter d="flex" justifyContent="end">
              <Button
                onClick={() => {
                  setAlert(false);
                }}
                size="sm"
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
                  setProperty("expressionValue", undefined);
                }}
                size="sm"
                variant="primary"
                autoFocus
              >
                {translate("OK")}
              </Button>
            </DialogFooter>
          </Dialog>
        )}
      </Box>
    </Box>
  );
}
