import React, { useEffect, useState } from "react";
import { Selection } from "../expression-builder/components";
import { getModels, getMetaFields } from "../../services/api";
import { FieldEditor } from "../components";
import { translate, lowerCaseFirstLetter } from "../../utils";
import { Textbox } from "../components";
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

export default function FieldBuilder({ element, bpmnModeler }) {
  const [openAlert, setAlert] = useState(false);
  const [openExpressionBuilder, setExpressionBuilder] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [expression, setExpression] = useState(null);
  const [expressionPathDummy, setExpressionPathDummy] = useState(null);
  const [field, setField] = useState(null);
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

  const getData = () => {
    return model
      ? {
          fullName: model.fullName,
          name: model.name,
          type: model.type,
        }
      : undefined;
  };

  useEffect(() => {
    async function fetchModel() {
      const expression = getProperty("expression");
      setExpression(expression);
      setExpressionPathDummy(expression);
      if (expression) {
        setField({
          type: "MANY_TO_MANY",
        });
      }
      const modelName =
        expression && expression.split("?.") && expression.split("?.")[0];
      if (!modelName) {
        setModel(null);
        return;
      }
      const criteria = {
        criteria: [
          {
            fieldName: "name",
            operator: "like",
            value: modelName,
          },
        ],
        operator: "and",
      };
      const metaModels = await getModels(criteria);
      setModel(metaModels && metaModels[0]);
    }
    fetchModel();
  }, [getProperty]);

  return (
    <Box d="flex" alignItems="center" justifyContent="space-between">
      <Textbox
        element={element}
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
            if (!values.expression || values.expression === "") {
              setExpression(null);
              setModel(null);
              setExpressionPathDummy(null);
            }
            setProperty(
              "expression",
              values.expression === "" ? undefined : values.expression
            );
          },
        }}
      />
      <Box d="flex" ps={1} mt={4} pt={2}>
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
          <Dialog
            open={openExpressionBuilder}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            size="lg"
            backdrop
            centered
          >
            <DialogHeader onCloseClick={handleClose}>
              <DialogTitle id="alert-dialog-title">
                {translate("Expression")}
              </DialogTitle>
            </DialogHeader>
            <DialogContent d="flex" p={2}>
              <Box d="flex" p={2} overflow="auto">
                <Selection
                  name="model"
                  title="Model"
                  placeholder="Model"
                  fetchAPI={() => getModels()}
                  onChange={(e) => {
                    if (!e) {
                      setExpressionPathDummy(null);
                    }
                    setModel(e);
                  }}
                  optionLabelKey="name"
                  value={model}
                />
                {model && (
                  <FieldEditor
                    getMetaFields={() => getMetaFields(getData())}
                    isCollection={true}
                    onChange={(val, field) => {
                      if (val && val !== "") {
                        setExpressionPathDummy(
                          `${model && lowerCaseFirstLetter(model.name)}?.${val}`
                        );
                      } else {
                        setExpressionPathDummy(null);
                      }
                      setField(field);
                    }}
                    value={{
                      fieldName:
                        expressionPathDummy &&
                        expressionPathDummy.split("?.") &&
                        expressionPathDummy.split("?.")[1],
                    }}
                    isParent={true}
                  />
                )}
              </Box>
            </DialogContent>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (
                    !["MANY_TO_MANY", "ONE_TO_MANY"].includes(
                      field && field.type && field.type.toUpperCase()
                    ) &&
                    model
                  ) {
                    setAlertMessage(
                      "Last field selected  must be of O2M or M2M type"
                    );
                    setAlertTitle("Error");
                    setAlert(true);
                    return;
                  }
                  setExpression(expressionPathDummy);
                  setProperty("expression", expressionPathDummy);
                  handleClose();
                }}
                variant="primary"
                autoFocus
                size="sm"
              >
                {translate("OK")}
              </Button>
              <Button
                onClick={() => {
                  setExpressionPathDummy(expression);
                  handleClose();
                }}
                variant="secondary"
                autoFocus
                size="sm"
              >
                {translate("Cancel")}
              </Button>
            </DialogFooter>
          </Dialog>
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
              <Box color="body">{translate(alertMessage)}</Box>
            </DialogContent>
            <DialogFooter>
              <Button
                onClick={() => {
                  setAlert(false);
                  setAlertMessage(null);
                  setAlertTitle(null);
                }}
                variant="primary"
                size="sm"
              >
                {translate("OK")}
              </Button>
              <Button
                onClick={() => {
                  setAlert(false);
                }}
                variant="secondary"
                size="sm"
              >
                {translate("Cancel")}
              </Button>
            </DialogFooter>
          </Dialog>
        )}
      </Box>
    </Box>
  );
}
