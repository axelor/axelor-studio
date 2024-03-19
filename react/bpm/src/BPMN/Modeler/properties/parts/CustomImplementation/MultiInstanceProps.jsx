import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import { Selection } from "../../../../../components/expression-builder/components";
import { getModels, getMetaFields } from "../../../../../services/api";
import { translate } from "../../../../../utils";
import {
  TextField,
  FieldEditor,
} from "../../../../../components/properties/components";

import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
  Divider,
  InputLabel,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./MultiInstanceProps.module.css";

function getProperty(element, propertyName) {
  let loopCharacteristics = getLoopCharacteristics(element);
  return loopCharacteristics && loopCharacteristics.get(propertyName);
}

function getBody(expression) {
  return expression && expression.get("body");
}

function getLoopCharacteristics(element) {
  let bo = getBusinessObject(element);
  return bo && bo.loopCharacteristics;
}

function getLoopCardinality(element) {
  return getProperty(element, "loopCardinality");
}

function getLoopCardinalityValue(element) {
  let loopCardinality = getLoopCardinality(element);
  return getBody(loopCardinality);
}

function getCompletionCondition(element) {
  return getProperty(element, "completionCondition");
}

function getCompletionConditionValue(element) {
  let completionCondition = getCompletionCondition(element);
  return getBody(completionCondition);
}

function getCollection(element) {
  return getProperty(element, "camunda:collection");
}

function getElementVariable(element) {
  return getProperty(element, "camunda:elementVariable");
}

function createFormalExpression(parent, body, bpmnFactory) {
  return elementHelper.createElement(
    "bpmn:FormalExpression",
    { body: body },
    parent,
    bpmnFactory
  );
}

function updateFormalExpression(element, propertyName, newValue, bpmnFactory) {
  let loopCharacteristics = getLoopCharacteristics(element);
  if (!newValue) {
    loopCharacteristics[propertyName] = undefined;
    return;
  }
  let existingExpression = loopCharacteristics.get(propertyName);
  if (!existingExpression) {
    // add formal expression
    loopCharacteristics[propertyName] = createFormalExpression(
      loopCharacteristics,
      newValue,
      bpmnFactory
    );
    return;
  }
  // edit existing formal expression
  existingExpression.body = newValue;
  return;
}

function ensureMultiInstanceSupported(element) {
  let loopCharacteristics = getLoopCharacteristics(element);
  return (
    !!loopCharacteristics && is(loopCharacteristics, "camunda:Collectable")
  );
}

export function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function getBO(element) {
  if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
    return getBO(element.$parent);
  } else {
    return element.$parent;
  }
}

function getValue(element) {
  let bo = getBO(element && element.businessObject);
  const extensionElements = bo && bo.extensionElements;
  const noOptions = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: [""],
      },
    ],
  };
  if (!extensionElements || !extensionElements.values) return noOptions;
  const processConfigurations = extensionElements.values.find(
    (e) => e.$type === "camunda:ProcessConfiguration"
  );
  const metaModels = [],
    metaJsonModels = [],
    modelList = [];
  if (
    !processConfigurations &&
    !processConfigurations.processConfigurationParameters
  )
    return noOptions;
  processConfigurations.processConfigurationParameters.forEach((config) => {
    if (config.metaModel) {
      metaModels.push(config.metaModel);
      modelList.push({
        fullName: config.metaModelFullName,
        name: config.metaModel,
        type: "metaModel",
        title:
          config.metaModelLabel &&
          config.metaModelLabel.substring(
            config.metaModelLabel.lastIndexOf("(") + 1,
            config.metaModelLabel.lastIndexOf(")")
          ),
      });
    } else if (config.metaJsonModel) {
      metaJsonModels.push(config.metaJsonModel);
      modelList.push({
        name: config.metaJsonModel,
        type: "metaJsonModel",
        title:
          config.metaJsonModelLabel &&
          config.metaJsonModelLabel.substring(
            config.metaJsonModelLabel.lastIndexOf("(") + 1,
            config.metaJsonModelLabel.lastIndexOf(")")
          ),
      });
    }
  });
  let value = [...metaModels, ...metaJsonModels];
  return { value, modelList };
}

function getProcessConfig(element) {
  const { value } = getValue(element);
  const data = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: value && value.length > 0 ? value : [""],
      },
    ],
    operator: "or",
  };
  return data;
}

export default function MultiInstanceLoopCharacteristics({
  element,
  bpmnFactory,
  label,
  index,
}) {
  const [isVisible, setVisible] = useState(false);
  const [loopCardinality, setLoopCardinality] = useState(null);
  const [collection, setCollection] = useState(null);
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(null);
  const [collectionVal, setCollectionVal] = useState(null);
  const [field, setField] = useState(null);
  const [openExpressionAlert, setExpressionAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorTitle, setErrorTitle] = useState(null);

  const getData = () => {
    return model
      ? {
          fullName: model.fullName,
          name: model.name,
          type: model.type,
        }
      : undefined;
  };

  const setInitialValue = React.useCallback(() => {
    if (collection) {
      const collectionVal = collection.substring(
        collection.lastIndexOf("(") + 1,
        collection.lastIndexOf(")")
      );
      const values = collectionVal && collectionVal.split(".");
      setCollectionVal(
        [...(values || [])].splice(1, values && values.length - 1).join(".")
      );
      const { modelList } = getValue(element) || {};
      if (values && modelList) {
        const model = modelList.find(
          (m) => lowerCaseFirstLetter(m.name) === values[0]
        );
        setModel(model);
      }
    }
  }, [collection, element]);

  useEffect(() => {
    if (ensureMultiInstanceSupported(element)) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  useEffect(() => {
    setInitialValue();
  }, [setInitialValue]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <Divider className={styles.divider} />}
        </React.Fragment>
        <Box color="body" className={styles.groupLabel}>
          {translate(label)}
        </Box>
        {!collection && !loopCardinality && (
          <InputLabel color="body" className={styles.typography}>
            <MaterialIcon icon="report" fontSize={16} className={styles.icon} />
            {translate("Must provide either loop cardinality or collection")}
          </InputLabel>
        )}
        <TextField
          element={element}
          entry={{
            id: "multiInstance-loopCardinality",
            label: translate("Loop cardinality"),
            modelProperty: "loopCardinality",
            get: function () {
              const loopCardinality = getLoopCardinalityValue(element);
              setLoopCardinality(loopCardinality);
              return {
                loopCardinality: loopCardinality,
              };
            },
            set: function (e, values) {
              setLoopCardinality(values.loopCardinality);
              return updateFormalExpression(
                element,
                "loopCardinality",
                values.loopCardinality,
                bpmnFactory
              );
            },
          }}
          canRemove={true}
        />
        <TextField
          element={element}
          entry={{
            id: "multiInstance-collection",
            label: translate("Collection"),
            modelProperty: "collection",
            get: function () {
              const collection = getCollection(element);
              setCollection(collection);
              return {
                collection: collection,
              };
            },
            set: function (e, values) {
              let loopCharacteristics = getLoopCharacteristics(element);
              if (!loopCharacteristics) return;
              setCollection(values.collection);
              loopCharacteristics.collection = values.collection;
              loopCharacteristics["camunda:collection"] =
                values.collection || undefined;
              if (!values.collection || values.collection === "") {
                setModel(null);
                setCollectionVal(null);
              }
            },
            validate: function (element) {
              let collection = getCollection(element);
              let elementVariable = getElementVariable(element);
              if (!collection && elementVariable) {
                return { collection: translate("Must provide a value") };
              }
            },
          }}
          canRemove={true}
          endAdornment={
            <MaterialIcon
              icon="edit"
              fontSize={18}
              className={styles.newIcon}
              onClick={() => setOpen(true)}
            />
          }
        />
        <Dialog open={open} backdrop centered className={styles.dialog}>
          <DialogHeader onCloseClick={() => setOpen(false)}>
            <h3>{translate("Collection")}</h3>
          </DialogHeader>
          <DialogContent className={styles.dialogContent}>
            <Selection
              name="model"
              title="Model"
              placeholder="Model"
              fetchAPI={() => getModels(getProcessConfig(element))}
              onChange={(e) => {
                setModel(e);
              }}
              optionLabelKey="name"
              value={model}
              classes={{ root: styles.MuiAutocompleteRoot }}
            />
            {model && (
              <FieldEditor
                getMetaFields={() => getMetaFields(getData())}
                isCollection={true}
                onChange={(val, field) => {
                  setCollectionVal(val);
                  setField(field);
                }}
                value={{
                  fieldName: collectionVal,
                }}
                isParent={true}
              />
            )}
          </DialogContent>
          <DialogFooter>
            <Button
              onClick={() => {
                if (
                  field &&
                  !["ONE_TO_MANY", "MANY_TO_MANY"].includes(field.type)
                ) {
                  setExpressionAlert(true);
                  setErrorMessage(
                    "Last subfield should be many to many or one to many field"
                  );
                  return;
                }
                const prefix = "${getIdList(";
                const value = `${prefix}${lowerCaseFirstLetter(model.name)}${
                  collectionVal ? `.${collectionVal}` : ""
                })}`;
                setCollection(value);
                let loopCharacteristics = getLoopCharacteristics(element);
                if (!loopCharacteristics) return;
                loopCharacteristics.collection = value;
                loopCharacteristics["camunda:collection"] = value || undefined;
                setOpen(false);
              }}
              variant="primary"
              className={styles.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                setInitialValue();
              }}
              variant="secondary"
              className={styles.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </Dialog>
        <Dialog open={openExpressionAlert} backdrop className={styles.dialog}>
          <DialogHeader onCloseClick={() => setExpressionAlert(false)}>
            <h3>{translate(errorTitle || "Warning")}</h3>
          </DialogHeader>
          <DialogContent className={styles.content}>
            {translate(errorMessage)}
          </DialogContent>
          <DialogFooter>
            <Button
              className={styles.save}
              onClick={() => {
                setExpressionAlert(false);
                setErrorMessage(null);
                setErrorTitle(null);
              }}
              variant="primary"
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => setExpressionAlert(false)}
              variant="secondary"
              className={styles.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </Dialog>
        <TextField
          element={element}
          entry={{
            id: "multiInstance-elementVariable",
            label: translate("Element variable"),
            modelProperty: "elementVariable",
            get: function (element) {
              return {
                elementVariable: getElementVariable(element),
              };
            },

            set: function (e, values) {
              let loopCharacteristics = getLoopCharacteristics(element);
              if (!loopCharacteristics) return;
              loopCharacteristics.elementVariable =
                values.elementVariable || undefined;
            },
          }}
          canRemove={true}
        />
        <TextField
          element={element}
          entry={{
            id: "multiInstance-completionCondition",
            label: translate("Completion condition"),
            modelProperty: "completionCondition",
            get: function (element) {
              return {
                completionCondition: getCompletionConditionValue(element),
              };
            },

            set: function (element, values) {
              return updateFormalExpression(
                element,
                "completionCondition",
                values.completionCondition,
                bpmnFactory
              );
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
