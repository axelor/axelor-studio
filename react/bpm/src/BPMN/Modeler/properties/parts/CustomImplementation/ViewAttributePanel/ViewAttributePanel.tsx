import React, { useState, useEffect, useCallback } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { IconButton } from "@studio/shared/components";
import { getItems, getMetaFields } from "../../../../../../shared/services";
import { BOOL_ATTRIBUTES, ALL_ATTRIBUTES } from "../constants";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ViewAttributePanelProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleAdd?: any;
}
import styles from "./view-attribute.module.css";
import { valueObj, itemsObj, createData, getKeyData } from "./utils";
import ValueCard from "./ValueCard";

export default function ViewAttributePanel({
  handleAdd,
  element,
  bpmnModeler,
}: ViewAttributePanelProps) {
  const [row, setRow] = useState<any>(null);
  const [processModels, setProcessModels] = useState<any[]>([]);

  const addModelView = () => {
    setRow({
      ...(row || {}),
      values: [...((row && (row.values || [])) || []), { ...valueObj }],
    });
  };

  const updateErrorValue = (index: any, name: any) => {
    const cloneRow = { ...row };
    const values = cloneRow.values;
    values[index] = { ...(values[index] || {}), [`${name}Error`]: true };
    setRow({ ...cloneRow });
  };

  const updateValue = (value: any, name: any, label: any, index: any, valueLabel: any) => {
    const cloneRow = { ...row };
    const values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      [name]: (value && value[label]) || value,
      [`${name}Error`]: false,
      [`${name}Label`]: valueLabel,
    };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const addItems = (index: any) => {
    const cloneRow = { ...row };
    const values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      items: [{ id: `item_${cloneRow.id}_${index}`, ...itemsObj }, ...(values[index].items || [])],
    };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const updateItemErrorValues = (index: any, itemIndex: any, name: any) => {
    const cloneRow = { ...row };
    const values = cloneRow.values;
    const items = cloneRow.values[index].items;
    items[itemIndex] = { ...(items[itemIndex] || []), [`${name}Error`]: true };
    values[index] = { ...(values[index] || {}), items };
    setRow({ ...cloneRow });
  };

  const handleItems = (
    value: any,
    name: any,
    label: any,
    index: any,
    itemIndex: any,
    valueLabel: any,
  ) => {
    const cloneRow = { ...row };
    const values = cloneRow.values;
    const items = cloneRow.values[index].items;
    items[itemIndex] = {
      ...(items[itemIndex] || []),
      [name]: value && (value[label] || value),
      [`${name}Error`]: false,
      [`${name}Label`]: valueLabel,
    };
    if (name === "attributeName") {
      if (BOOL_ATTRIBUTES.includes(value)) {
        if (!items[itemIndex].attributeValue) {
          items[itemIndex].attributeValue = "false";
        }
      } else {
        items[itemIndex].attributeValue = null;
      }
    }
    values[index] = { ...(values[index] || {}), items };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const removeItem = (valueIndex: any, itemIndex: any) => {
    const cloneRow = { ...row };
    const values = cloneRow.values;
    const items = cloneRow.values[valueIndex].items;
    items.splice(itemIndex, 1);
    values[valueIndex] = { ...(values[valueIndex] || {}), items };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const removeCard = (index: any) => {
    const cloneRow = { ...row };
    const values = cloneRow.values;
    values.splice(index, 1);
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const getBO = React.useCallback((element: any) => {
    if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
      return getBO(element.$parent);
    } else {
      return element.$parent;
    }
  }, []);

  function getProcessConfig() {
    const definitions = bpmnModeler?.getDefinitions?.();
    const rootElements = definitions && definitions.rootElements;
    const processes =
      rootElements && rootElements.filter((ele: any) => ele.$type === "bpmn:Process");
    const extensionElements = processes?.map((p: any) => p.extensionElements);
    const noOptions = { criteria: [{ fieldName: "name", operator: "IN", value: [""] }] };
    if (!extensionElements || extensionElements.length <= 0) return noOptions;
    const processConfigurations = extensionElements.map((e: any) =>
      e?.values.find((e: any) => e.$type === "camunda:ProcessConfiguration"),
    );
    const metaModels: any[] = [],
      metaJsonModels: any[] = [];
    if (!processConfigurations || !processConfigurations.length) return noOptions;
    processConfigurations.forEach((config: any) => {
      const { processConfigurationParameters } = config || {};
      processConfigurationParameters?.forEach((config: any) => {
        if (config.metaModel) metaModels.push(config.metaModel);
        else if (config.metaJsonModel) metaJsonModels.push(config.metaJsonModel);
      });
    });
    const value = [...metaModels, ...metaJsonModels];
    return {
      criteria: [
        { fieldName: "name", operator: "IN", value: value && value.length > 0 ? value : [""] },
      ],
      operator: "or",
    };
  }

  const handlePropertyAdd = () => {
    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject && businessObject.extensionElements;
    let values, camundaProperty;
    if (extensionElements && extensionElements.values) {
      camundaProperty = extensionElements.values.find((e: any) => e.$type === "camunda:Properties");
      values = camundaProperty && camundaProperty.values;
    }
    if (values) {
      const elements = values.filter(
        (val: any) =>
          ![
            "model",
            "modelName",
            "modelType",
            "modelLabel",
            "view",
            "viewLabel",
            "item",
            "roles",
            "itemLabel",
            "itemType",
            "permanent",
            "relatedField",
            "relatedFieldLabel",
            ...ALL_ATTRIBUTES,
          ].includes(val.name),
      );
      if (camundaProperty) camundaProperty.values = [...elements];
    }
    if (row.values && row.values.length > 0) {
      row.values &&
        row.values.forEach((value: any, index: any) => {
          const { model, items = [] } = value;
          if (!model) updateErrorValue(index, "model");
          if (items.length > 0) {
            items.forEach((item: any, itemIndex: any) => {
              const { itemName, attributeName, attributeValue } = item;
              if (!itemName) updateItemErrorValues(index, itemIndex, "itemName");
              if (!attributeName) updateItemErrorValues(index, itemIndex, "attributeName");
              if (!attributeValue) {
                if (!["readonly", "hidden", "required"].includes(attributeName)) {
                  updateItemErrorValues(index, itemIndex, "attributeValue");
                }
              }
            });
          }
        });
    }
    handleAdd(row);
  };

  const getRelatedField = React.useCallback(
    async (val: any) => {
      const fields = await getMetaFields(val.model);
      return fields?.filter((f: any) => {
        let modelName: any;
        if (f.target && !f.jsonTarget) modelName = f.target.split(".").pop();
        return (
          ["MANY_TO_ONE", "many-to-one"].includes(f.type) &&
          processModels.includes(modelName || f.jsonTarget || f.target)
        );
      });
    },
    [processModels],
  );

  useEffect(() => {
    const bo = getBO(element && getBusinessObject(element));
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements?.values) return;
    const processConfigurations = extensionElements.values.find(
      (e: any) => e.$type === "camunda:ProcessConfiguration",
    );
    const metaModels: any[] = [],
      metaJsonModels: any[] = [];
    if (!processConfigurations && !processConfigurations?.processConfigurationParameters) return;
    processConfigurations.processConfigurationParameters.forEach((config: any) => {
      if (config.metaModel) metaModels.push(config.metaModel);
      else if (config.metaJsonModel) metaJsonModels.push(config.metaJsonModel);
    });
    setProcessModels([...metaModels, ...metaJsonModels]);
  }, [element, getBO]);

  useEffect(() => {
    if (!element) return;
    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject && businessObject.extensionElements;
    if (!extensionElements) {
      setRow(createData([]));
      return;
    }
    let extensionElementValues, camundaProperty;
    if (extensionElements && extensionElements.values) {
      camundaProperty = extensionElements.values.find((e: any) => e.$type === "camunda:Properties");
      extensionElementValues = camundaProperty && camundaProperty.values;
    }
    if (extensionElementValues && extensionElementValues.length < 1) return;
    const models = getKeyData(extensionElementValues, "model");
    const values: any[] = [];
    models &&
      models.forEach((modelArr: any) => {
        const value: Record<string, any> = { items: [] };
        const items = getKeyData(modelArr, "itemType");
        modelArr.forEach((ele: any) => {
          if (ele.name === "model") value.model = { model: ele.value, fullName: ele.value };
          if (ele.name === "modelName") value.model = { ...value.model, name: ele.value };
          if (ele.name === "modelType") value.model = { ...value.model, type: ele.value };
          if (ele.name === "modelLabel") {
            value.modelLabel = ele.value;
            value.model = { ...value.model, title: ele.value };
          }
          if (ele.name === "view") value.view = { name: ele.value };
          if (ele.name === "viewLabel") {
            value.viewLabel = ele.value;
            value.view = { ...value.view, title: ele.value };
          }
          if (ele.name === "relatedField") value.relatedField = { name: ele.value };
          if (ele.name === "relatedFieldLabel") {
            value.relatedFieldLabel = ele.value;
            value.relatedField = { ...value.relatedField, title: ele.value };
          }
          if (ele.name === "roles") {
            if (!ele.value) return;
            const roles = ele.value.split(",");
            const valueRoles: any[] = [];
            roles.forEach((role: any) => {
              valueRoles.push({ name: role });
            });
            value.roles = valueRoles;
          }
        });
        items &&
          items.forEach((item: any) => {
            const name = item.find((f: any) => f.name === "item");
            const label = item.find((f: any) => f.name === "itemLabel");
            const type = item.find((f: any) => f.name === "itemType");
            const attribute = item.find((f: any) => ALL_ATTRIBUTES.includes(f.name));
            const permanent = item.find((f: any) => f.name === "permanent");
            value.items.push({
              itemName: {
                name: name && name.value,
                label: label && label.value,
                type: type && type.value,
              },
              itemNameLabel: label && label.value,
              attributeName: attribute && attribute.name,
              attributeValue: attribute && attribute.value,
              permanent: permanent && permanent.value,
            });
          });
        values.push(value);
      });
    // @ts-expect-error -- safety: bpmn-js element type mismatch with strict PropertiesPanelComponentProps
    setRow(createData(values));
  }, [element]);

  const fetchItems = useCallback(async (data: any, val: any) => {
    const options = await getItems(val.view && val.view.name, val.model, data?.criteria);
    return options.filter((r) => r["title"] !== null || (r.type === "panel" && r["name"] !== null));
  }, []);

  return (
    <div>
      {row && (
        <div>
          <div>
            {row.values &&
              row.values.map(
                (val: any, index: any) =>
                  val && (
                    <ValueCard
                      key={`card_${index}`}
                      element={element}
                      val={val}
                      index={index}
                      processModels={processModels}
                      getProcessConfig={getProcessConfig}
                      getRelatedField={getRelatedField}
                      updateValue={updateValue}
                      addItems={addItems}
                      removeCard={removeCard}
                      fetchItems={fetchItems}
                      handleItems={handleItems}
                      removeItem={removeItem}
                    />
                  ),
              )}
          </div>
        </div>
      )}
      <Box color="body" d="flex" alignItems="center">
        <IconButton className={styles.iconButton} onClick={addModelView}>
          <MaterialIcon icon="add" fontSize={16} />
        </IconButton>
      </Box>
    </div>
  );
}
