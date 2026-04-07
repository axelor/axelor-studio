import React, { useState, useEffect } from "react";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog } from "@studio/shared/components";
import { useDialog } from "@studio/shared/hooks";

import { getMetaFields, getModels } from "../../../../../../shared/services";
import { TextField, FieldEditor } from "../../../../../../components/properties/components";
import { Selection } from "../../../../../../components/expression-builder/components";
import type { PropertiesPanelComponentProps } from "../../../property-types";
import CollapsePanel from "../../components/CollapsePanel";

import styles from "./multi-instance.module.css";
import {
  getLoopCharacteristics,
  getLoopCardinalityValue,
  getCollection,
  getElementVariable,
  getCompletionConditionValue,
  updateFormalExpression,
  ensureMultiInstanceSupported,
  lowerCaseFirstLetter,
  getValue,
  getProcessConfig,
} from "./utils";

export default function MultiInstanceLoopCharacteristics({
  element,
  bpmnFactory,
  label,
  _index,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [loopCardinality, setLoopCardinality] = useState<any>(null);
  const [collection, setCollection] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [collectionVal, setCollectionVal] = useState<any>(null);
  const [field, setField] = useState<any>(null);
  const openDialog = useDialog();

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
        collection.lastIndexOf(")"),
      );
      const values = collectionVal && collectionVal.split(".");
      setCollectionVal([...(values || [])].splice(1, values && values.length - 1).join("."));
      // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
      const { modelList } = getValue(element) || {};
      if (values && modelList) {
        const model = modelList.find((m: any) => lowerCaseFirstLetter(m.name) === values[0]);
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
      <CollapsePanel label={label}>
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
            set: function (e: any, values: any) {
              setLoopCardinality(values.loopCardinality);
              return updateFormalExpression(
                element,
                "loopCardinality",
                values.loopCardinality,
                bpmnFactory,
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
            set: function (e: any, values: any) {
              const loopCharacteristics = getLoopCharacteristics(element);
              if (!loopCharacteristics) return;
              setCollection(values.collection);
              loopCharacteristics.collection = values.collection;
              loopCharacteristics["camunda:collection"] = values.collection || undefined;
              if (!values.collection || values.collection === "") {
                setModel(null);
                setCollectionVal(null);
              }
            },
            validate: function (element) {
              const collection = getCollection(element);
              const elementVariable = getElementVariable(element);
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

        <AlertDialog
          openAlert={open}
          title="Collection"
          fullscreen={false}
          handleAlertOk={() => {
            if (field && !["ONE_TO_MANY", "MANY_TO_MANY"].includes(field.type)) {
              openDialog({
                title: "Warning",
                message: "Last subfield should be many to many or one to many field",
              });
              return;
            }
            const prefix = "${getIdList(";
            const value = `${prefix}${lowerCaseFirstLetter(model.name)}${
              collectionVal ? `.${collectionVal}` : ""
            })}`;
            setCollection(value);
            const loopCharacteristics = getLoopCharacteristics(element);
            if (!loopCharacteristics) return;
            loopCharacteristics.collection = value;
            loopCharacteristics["camunda:collection"] = value || undefined;
            setOpen(false);
          }}
          alertClose={() => {
            setOpen(false);
            setInitialValue();
          }}
          children={
            <div className={styles.dialogContent}>
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
                  // @ts-expect-error -- safety: bpmn-js element type mismatch with strict PropertiesPanelComponentProps
                  getMetaFields={() => getMetaFields(getData())}
                  isCollection={true}
                  onChange={(val: any, field: any) => {
                    setCollectionVal(val);
                    setField(field);
                  }}
                  value={{
                    fieldName: collectionVal,
                  }}
                  isParent={true}
                />
              )}
            </div>
          }
        />

        <TextField
          element={element}
          entry={{
            id: "multiInstance-elementVariable",
            label: translate("Element variable"),
            modelProperty: "elementVariable",
            get: function (element: any) {
              return {
                elementVariable: getElementVariable(element),
              };
            },

            set: function (e: any, values: any) {
              const loopCharacteristics = getLoopCharacteristics(element);
              if (!loopCharacteristics) return;
              loopCharacteristics.elementVariable = values.elementVariable || undefined;
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
            get: function (element: any) {
              return {
                completionCondition: getCompletionConditionValue(element),
              };
            },

            set: function (element: any, values: any) {
              return updateFormalExpression(
                element,
                "completionCondition",
                values.completionCondition,
                bpmnFactory,
              );
            },
          }}
          canRemove={true}
        />
      </CollapsePanel>
    )
  );
}
