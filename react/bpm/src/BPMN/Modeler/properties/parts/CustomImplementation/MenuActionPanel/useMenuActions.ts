import { useState, useEffect, useCallback } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { createElement as _createElement } from "../../../../../../utils/ElementUtil";
import { getMenu } from "../../../../../../shared/services";
import {
  createElement,
  createParameter,
  getExtensionElementProperties,
  nextId,
  openTabView,
} from "../utils";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface useMenuActionsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog?: any;
}
import {  menuObj, createMenus } from "./constants";

export default function useMenuActions({
  element,
  bpmnFactory,
  bpmnModeler,
  openDialog,
}: useMenuActionsProps) {
  const [menus, setMenus] = useState<any[]>([]);
  const [model, setModel] = useState<any>(null);
  const [metaModel, setMetaModel] = useState<any>(null);

  const setProperty = useCallback(
    (name: any, value: any) => {
      const bo = getBusinessObject(element);
      const propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (!value) {
        delete bo.$attrs[propertyName];
      }
    },
    [element, bpmnModeler],
  );

  const getProperty = useCallback(
    (name: any) => {
      const propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element],
  );

  const hasProperty = useCallback(
    (name: any) => {
      const propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return bo.$attrs && bo.$attrs.hasOwnProperty(propertyName);
    },
    [element],
  );

  const getScript = useCallback((name: any) => {
    return getProperty(name)?.replace(/[\u200B-\u200D\uFEFF]/g, "");
  }, []);

  const getSelectValue = useCallback(
    (name: any) => {
      const label = getProperty(`${name}Label`);
      const fullName = getProperty(`${name}ModelName`);
      const newName = getProperty(name);
      if (newName) {
        const value = { name: newName };
        // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
        if (label) value.title = label;
        // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
        if (fullName) value.fullName = fullName;
        return value;
      } else {
        return null;
      }
    },
    [getProperty],
  );

  const updatePropertyValue = (name: any, value: any, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
  };

  const updateMenuValue = (name: any, value: any, label?: any, optionLabel = "name") => {
    updatePropertyValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
      return;
    }
    setProperty(`${name}Label`, label);
  };

  const getMenuParameters = useCallback(
    (field = "menuParameters") => {
      const config = getExtensionElementProperties(element, "camunda:Menus");
      return (config && config[field]) || [];
    },
    [element],
  );

  const getElements = (key: any) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    return menus[key]?.contexts || [];
  };

  const updateContextElement = (value: any, label: any, optionIndex: any, key: any) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    const contexts = menus[key]?.contexts || [];
    const entry = contexts[optionIndex];
    entry[label] = value;
  };

  const addContextElement = (entryValue: any, key: any) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    const contexts = menus[key]?.contexts || [];
    const newEntry = createElement("camunda:Context", menus[key], bpmnFactory, entryValue);
    contexts.push(newEntry);
    menus[key].contexts = contexts;
  };

  const removeContextElement = (optionIndex: any, key: any) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    const contexts = menus[key]?.contexts || [];
    contexts.splice(optionIndex, 1);
  };

  function getBO(element: any) {
    if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
      return getBO(element.$parent);
    } else {
      return element.$parent;
    }
  }

  function getProcessConfig() {
    let bo = getBO(element && getBusinessObject(element));
    if (!element) return { criteria: [{ fieldName: "metaModel.name", operator: "IN", value: [""] }, { fieldName: "metaJsonModel.name", operator: "IN", value: [""] }] };
    if (element.type === "bpmn:Process") bo = getBusinessObject(element);
    if (
      (element && getBusinessObject(element) && getBusinessObject(element).$type) === "bpmn:Participant"
    ) {
      bo = element && getBusinessObject(element) && getBusinessObject(element).processRef;
    }
    const noOptions = {
      criteria: [
        { fieldName: "metaModel.name", operator: "IN", value: [""] },
        { fieldName: "metaJsonModel.name", operator: "IN", value: [""] },
      ],
    };
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements.values) return noOptions;
    const processConfigurations = extensionElements.values.find(
      (e: any) => e.$type === "camunda:ProcessConfiguration",
    );
    const metaModels: any[] = [],
      metaJsonModels: any[] = [];
    if (!processConfigurations && !processConfigurations.processConfigurationParameters)
      return noOptions;
    processConfigurations.processConfigurationParameters.forEach((config: any) => {
      if (config.metaModel) metaModels.push(config.metaModel);
      else if (config.metaJsonModel) metaJsonModels.push(config.metaJsonModel);
    });
    const criteria: any[] = [];
    if (metaModels.length > 0) {
      criteria.push({ fieldName: "metaModel.name", operator: "IN", value: metaModels });
    }
    if (metaJsonModels.length > 0) {
      criteria.push({ fieldName: "metaJsonModel.name", operator: "IN", value: metaJsonModels });
    }
    return { criteria, operator: "or" };
  }

  const updateElement = (value: any, label: any, optionIndex: any) => {
    const entries = getMenuParameters();
    if (!entries) return;
    const entry = entries[optionIndex];
    if (entry) {
      if (value || typeof value === "boolean") {
        entry[label] = value;
      } else {
        delete entry[label];
      }
    }
  };

  const newElement = function (
    type: any,
    prop: any,
    element: any,
    extensionElements: any,
    bpmnFactory: any,
  ) {
    const bo = getBusinessObject(element);
    if (!extensionElements) {
      extensionElements = _createElement("bpmn:ExtensionElements", { values: [] }, bo, bpmnFactory);
      bo.extensionElements = extensionElements;
    }
    let menus = getExtensionElementProperties(element, "camunda:Menus");
    if (!menus) {
      const parent = bo.extensionElements;
      menus = createMenus(parent, bpmnFactory, { menuParameters: [] });
      const newElem = createParameter(prop, menus, bpmnFactory, {});
      newElem.permanent = "false";
      newElem.tagCount = "false";
      newElem.isUserMenu = "false";
      newElem.menuId = nextId(`${element?.id?.toLowerCase()}-`);
      menus[type] = [newElem];
      bo.extensionElements.values.push(menus);
    }
  };

  const addElement = (parameterType: any, type: any) => {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo && bo.processRef);
    }
    if (bo?.extensionElements?.values) {
      const menus = getExtensionElementProperties(element, "camunda:Menus");
      if (!menus) {
        newElement(parameterType, type, element, bo.extensionElements, bpmnFactory);
      } else {
        const newElem = createParameter(type, menus, bpmnFactory, {});
        newElem.permanent = "false";
        newElem.tagCount = "false";
        newElem.isUserMenu = "false";
        newElem.menuId = nextId(`${element?.id?.toLowerCase()}-`);
        if (!menus[parameterType] || menus[parameterType]?.length === 0) {
          menus[parameterType] = [newElem];
        } else {
          menus[parameterType].push(newElem);
        }
      }
    } else {
      newElement(parameterType, type, element, bo.extensionElements, bpmnFactory);
    }
  };

  const removeElement = (optionIndex: any) => {
    const menus = getMenuParameters();
    if (optionIndex < 0) return;
    menus?.splice(optionIndex, 1);
    if (menus?.length === 0) {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      const extensionElements = bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return null;
      const menuIndex = extensionElements.values.findIndex((e: any) => e.$type === "camunda:Menus");
      if (menuIndex < 0) return;
      extensionElements?.values?.splice(menuIndex, 1);
      if (extensionElements?.values?.length === 0) {
        bo.extensionElements = undefined;
      }
    }
  };

  const addItems = () => {
    const cloneMenus = [...(menus || [])];
    cloneMenus.push({ ...menuObj });
    setMenus(cloneMenus);
    addElement("menuParameters", "camunda:Menu");
  };

  const removeItem = (index: any) => {
    const cloneMenus = [...(menus || [])];
    cloneMenus.splice(index, 1);
    setMenus(cloneMenus);
  };

  const updateValue = async (value: any, name: any, label: any, index: any) => {
    const cloneMenus = [...(menus || [])];
    cloneMenus[index] = { ...(cloneMenus[index] || {}), [name]: (value && value[label]) || value };
    if (Array.isArray(value)) {
      const values = value?.map((v) => v[label]).join(",");
      updateElement(values, name, index);
    } else {
      updateElement((value && value[label]) || value, name, index);
    }
    setMenus(cloneMenus);
  };

  const openMenuFn = async (menu: any) => {
    if (!menu?.menuId) {
      openDialog({ title: "Error", message: "Menu not found" });
      return;
    }
    const menuRes = await getMenu({
      data: {
        fields: ["name"],
        criteria: [
          {
            fieldName: "name",
            operator: "=",
            value: `wkf-${menu?.isUserMenu ? "node-user" : "node"}-menu-${menu?.menuId}`,
          },
        ],
      },
    });
    if (menuRes?.id) {
      openTabView({
        title: translate("Menu Item"),
        model: "com.axelor.meta.db.MetaMenu",
        viewType: "form",
        action: `action-wkf-view-open-editor-${menuRes?.id}`,
        views: [{ type: "form", name: "meta-menu-form" }],
        context: { _showRecord: menuRes?.id },
      });
    } else {
      openDialog({ title: "Error", message: "Menu not found" });
    }
  };

  useEffect(() => {
    setMenus(getMenuParameters());
  }, [getMenuParameters]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    setMetaModel(metaModel);
    if (metaModel) {
      setModel({ ...metaModel, type: "metaModel" });
    } else if (metaJsonModel) {
      setModel({ ...metaJsonModel, type: "metaJsonModel" });
    }
  }, [getSelectValue]);

  return {
    menus,
    model,
    metaModel,
    setProperty,
    getProperty,
    hasProperty,
    getScript,
    getSelectValue,
    updateMenuValue,
    getProcessConfig,
    getElements,
    updateContextElement,
    addContextElement,
    removeContextElement,
    addItems,
    removeItem,
    removeElement,
    updateValue,
    openMenu: openMenuFn,
  };
}
