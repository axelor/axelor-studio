import * as _ from "lodash";

import Service from "./Service";
import { getItemsByType } from "../utils";
import { WKF_FIELDS, RELATED_FIELDS } from "../BPMN/Modeler/constants";
import { getProcessConfig } from "../components/expression-builder/extra/util";
import { UI_TYPES } from "../DMN/constants";

export async function getModels(data = {}, metaModalType, dmnModels) {
  const models =
    ((!metaModalType || metaModalType === "metaModel") &&
      (await getMetaModels(data))) ||
    [];
  const metaJsonModels =
    ((!metaModalType || metaModalType === "metaJsonModel") &&
      (await getCustomModels(data))) ||
    [];
  const allModels = [];

  for (let i = 0; i < models.length; i++) {
    allModels.push({
      ...models[i],
      type: "metaModel",
    });
  }
  for (let i = 0; i < metaJsonModels.length; i++) {
    allModels.push({
      ...metaJsonModels[i],
      type: "metaJsonModel",
    });
  }
  if (dmnModels) {
    for (let i = 0; i < dmnModels.length; i++) {
      allModels.push({
        ...dmnModels[i],
        type: "dmnModel",
      });
    }
  }
  return allModels || [];
}

export function fetchModels(element, processConfigs) {
  return getModels(getProcessConfig(element, processConfigs), undefined);
}

export async function getStudioApp(options) {
  const res = await Service.search("com.axelor.studio.db.StudioApp", options);
  const { data = [] } = res || {};
  return data;
}

export const getWkfDMNModels = async (options = {}) => {
  let res = await Service.search("com.axelor.studio.db.WkfDmnModel", {
    ...options,
    limit: 40,
  });
  const wkf = (res && res.data) || [];
  return wkf;
};

export const getWkfModels = async (options = {}, fields = []) => {
  let res = await Service.search("com.axelor.studio.db.WkfModel", {
    fields: ["name", ...fields],
    related: {
      wkfProcessList: RELATED_FIELDS,
    },
    data: {
      _domain: `self.isActive is true`,
      ...options,
    },
  });
  const wkf = (res && res.data) || [];
  return wkf;
};

export const removeWkf = async (id) => {
  let res = await Service.delete("com.axelor.studio.db.WkfModel", id);
  if (res && res.status === -1) return res.data && res.data.message;
  const wkf = (res && res.data && res.data[0]) || {};
  return wkf;
};

export const getAppStudioConfig = async (id) => {
  let res = await Service.fetchId("com.axelor.studio.db.AppStudio", id);
  const appConfig = (res && res.data && res.data[0]) || {};
  return appConfig;
};

export const getApp = async (options) => {
  let res = await Service.search("com.axelor.studio.db.App", options);
  const app = (res && res.data && res.data[0]) || {};
  return app;
};

export const fetchWkf = async (id) => {
  let res = await Service.fetchId("com.axelor.studio.db.WkfModel", id, {
    fields: WKF_FIELDS,
    related: {
      wkfProcessList: RELATED_FIELDS,
    },
  });
  const wkf = (res && res.data && res.data[0]) || {};
  return wkf;
};

export async function getViews(
  model,
  criteria = [],
  type = "form",
  isModelAllow = true
) {
  if ((!model || !model.name) && isModelAllow) return [];
  let options = [
    {
      fieldName: "type",
      operator: "=",
      value: type,
    },
  ];

  if (model?.type === "metaJsonModel") {
    options.push({
      fieldName: "name",
      operator: "=",
      value: `custom-model-${model.name}-${type}`,
    });
  }

  if (model?.fullName) {
    options.push({
      fieldName: "model",
      value: model.fullName,
      operator: "=",
    });
  }

  const res = await Service.search(`com.axelor.meta.db.MetaView`, {
    fields: ["name", "title", "model"],
    data: {
      criteria: [...options, ...criteria],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  let views = Array.isArray(data) && data.filter((val) => val.name !== null);
  views = _.uniqBy(views || [], "name") || [];
  return views;
}

/**
 *
 * @param {String} formName
 * @param {Object} model
 * @param {Array} criteria
 *
 * If formName fetch form view
 * else only model is selected
 *  if model is metaModel
 *    fetch both real and custom fields
 * else
 *    fetch only custom fields
 */
export async function getItems(formName, model, criteria) {
  if (!model) return [];
  let res;
  if (formName && model.fullName) {
    res = await Service.post(`/ws/meta/view`, {
      data: {
        context: {
          "json-enhance": "true",
          _id: null,
        },
        name: formName,
        type: "form",
        criteria,
      },
      model: model.fullName,
    });
    const { data = [] } = res || {};
    const { fields = [], jsonAttrs = [], view } = data;
    const { menubar = [], toolbar = [] } = view || {};
    const items = [...fields, ...jsonAttrs];
    const panels = [];

    const isMenu = (element) => {
      return element.type === "menu";
    };

    [...(view?.items || []), ...menubar, ...toolbar].forEach((item) => {
      if (!isMenu(item)) {
        panels.push(item);
      }
      if (item) {
        const panelItems = item.items || [];
        panelItems &&
          panelItems.forEach((element) => {
            if (!isMenu(element)) {
              panels.push(element);
            }
            const { jsonFields = [] } = element || {};
            if (jsonFields.length > 0) {
              jsonFields.forEach((field) => {
                if (!isMenu(field)) {
                  panels.push(field);
                }
              });
            }
          });
      }
    });
    let allItems = [...items, ...panels];
    let uniqueItems = _.uniqBy(allItems, "name") || [];
    return [...uniqueItems, { name: "self", label: "Self" }];
  } else {
    let metaFields = [],
      metaRealModelJsonFields = [];
    if (model.type === "metaModel") {
      let metaFieldsRes =
        (await Service.search("com.axelor.meta.db.MetaField", {
          data: {
            _domain: `self.metaModel.fullName = '${model.fullName}'`,
            _domainContext: {
              _model: "com.axelor.meta.db.MetaModel",
            },
          },
        })) || {};
      metaFields = _.uniqBy(metaFieldsRes.data || [], "label") || [];

      let metaJsonFieldsRes =
        (await Service.search("com.axelor.meta.db.MetaJsonField", {
          data: {
            _domain: `self.model = '${model.fullName}' AND self.jsonModel is null`,
            _domainContext: {
              _model: "com.axelor.meta.db.MetaJsonField",
            },
          },
        })) || {};
      metaRealModelJsonFields = metaJsonFieldsRes.data || [];
    }
    let metaJsonFields =
      (await Service.search("com.axelor.meta.db.MetaJsonField", {
        data: {
          _domain: `self.jsonModel.name = '${model.name}'`,
          _domainContext: {
            _model: "com.axelor.meta.db.MetaJsonField",
          },
        },
        fields: ["name", "model", "type", "title"],
      })) || {};
    let response = [
      ...(metaFields || []),
      ...(metaRealModelJsonFields || []),
      ...(metaJsonFields.data || []),
    ];
    return response;
  }
}

const getResultedFields = (res) => {
  const responseData = res && res.data;
  const allFields = responseData && responseData.fields;
  const jsonFields = Object.values(
    (responseData && responseData.jsonFields) || [{}]
  );
  let result = [];
  result = allFields || [];

  jsonFields &&
    jsonFields.forEach((jsonField) => {
      const nestedFields = Object.values(jsonField || {}) || [];
      result = [...result, ...nestedFields];
    });
  return result;
};

export async function getMetaModal(data) {
  const res = await Service.search("com.axelor.meta.db.MetaModel", { data });
  return res && res.data && res.data[0];
}

export async function getSubMetaField(
  model,
  relationJsonModel,
  isCollection = false,
  allowAllFields = false,
  excludeUITypes = false,
  isDatePath
) {
  if (model === "com.axelor.meta.db.MetaJsonRecord" && relationJsonModel) {
    const res = await Service.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${relationJsonModel}`
    );
    let result = getResultedFields(res) || [];
    return (
      result &&
      result.filter((r) =>
        excludeUITypes
          ? !UI_TYPES.includes(r.type && r.type.toLowerCase())
          : isCollection
          ? ["many_to_one", "one_to_many", "many_to_many"].includes(
              r.type.toLowerCase()
            )
          : allowAllFields
          ? r
          : isDatePath
          ? ["date", "datetime", "many_to_one", "many-to-one"].includes(
              r.type.toLowerCase()
            )
          : ["many_to_one", "many-to-one"].includes(r.type.toLowerCase())
      )
    );
  } else {
    const data = {
      criteria: [{ fieldName: "fullName", operator: "=", value: model }],
    };
    const metaModel = await getMetaModal(data);
    if (!metaModel) return [];
    const fields = metaModel && metaModel.metaFields.map((f) => f.name);
    const res = await Service.fields({
      fields,
      model: metaModel.fullName,
    });
    let resultFields = res && res.data && res.data.fields;
    return (
      resultFields &&
      resultFields.filter((r) =>
        excludeUITypes
          ? !UI_TYPES.includes(r.type && r.type.toLowerCase())
          : isCollection
          ? ["many_to_one", "one_to_many", "many_to_many"].includes(
              r.type.toLowerCase()
            )
          : allowAllFields
          ? r
          : isDatePath
          ? ["date", "datetime", "many_to_one", "many-to-one"].includes(
              r.type.toLowerCase()
            )
          : ["many_to_one", "many-to-one"].includes(r.type.toLowerCase())
      )
    );
  }
}

export async function getMetaFields(model) {
  if (!model) return [];
  if (model.type === "metaModel") {
    if (!model.fullName) return [];
    let res = await Service.get(`ws/meta/fields/${model.fullName}`);
    let result = getResultedFields(res);
    return result;
  } else {
    if (!model.name) return [];
    const res = await Service.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${model.name}`
    );
    let result = getResultedFields(res);
    return result || [];
  }
}

export async function getRoles(criteria) {
  const res = await Service.search(`com.axelor.auth.db.Role`, {
    fields: ["name"],
    data: {
      criteria: [...criteria],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  return data;
}

export async function getTemplates(criteria) {
  const res = await Service.search("com.axelor.message.db.Template", {
    data: criteria,
  });
  if (res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}

export async function getProcessConfigModel(data = {}) {
  const res = await Service.action({
    action: "action-wkf-process-config-attrs-set-model",
    data: {
      context: { ...data },
    },
    model: "com.axelor.studio.db.WkfProcessConfig",
  });
  if (
    res &&
    res.data &&
    res.data[0] &&
    res.data[0].attrs &&
    res.data[0].attrs.model
  ) {
    const model = res.data[0].attrs.model.value;
    return model;
  }
}

export async function getMetaModels(_data = {}) {
  const res = await Service.search("com.axelor.meta.db.MetaModel", {
    data: _data,
    limit: 40,
    fields: ["name", "fullName", "packageName"],
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};

  const models = data.map((m) => {
    return m.fullName;
  });

  const views =
    models.length > 0 &&
    (await getViews(
      undefined,
      [
        {
          fieldName: "model",
          value: models,
          operator: "IN",
        },
        {
          operator: "or",
          criteria: [
            {
              fieldName: "extension",
              operator: "IS NULL",
            },
            {
              fieldName: "extension",
              operator: "=",
              value: false,
            },
          ],
        },
      ],
      undefined,
      false
    ));

  let result = [];
  data.forEach((d) => {
    views.forEach((v) => {
      if (v.model === d.fullName) {
        result.push({ ...d, title: v.title });
      }
    });
  });
  return _.uniqBy(result, "id");
}

export async function getCustomModels(criteria = {}) {
  const res = await Service.search("com.axelor.meta.db.MetaJsonModel", {
    data: criteria,
    limit: 40,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}

export async function getAllModels(criteria = {}) {
  const models = (await getMetaModels(criteria)) || [];
  const metaJsonModels = (await getCustomModels(criteria)) || [];
  const data = [...models, ...metaJsonModels];
  return data;
}

export async function getParentMenus(options) {
  const res = await Service.search("com.axelor.meta.db.MetaMenu", {
    data: {
      _domain: `self.action is null`,
      ...options,
    },
    limit: 40,
  });
  const { data = [] } = res || {};
  if (data.status === -1) {
    return [];
  }
  const output =
    data &&
    Object.values(
      data.reduce((a, item) => {
        a[item.name] = item;
        return a;
      }, {})
    );
  return output;
}

export async function getSubMenus(parentMenu) {
  if (!parentMenu) return;
  const res = await Service.search("com.axelor.meta.db.MetaMenu", {
    data: {
      criteria: [
        { fieldName: "parent.name", operator: "=", value: parentMenu },
      ],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  if (data.status === -1) {
    return [];
  }
  return _.uniqBy(data || [], "name") || [];
}

export async function getTranslations(key) {
  if (!key) return;
  const res = await Service.search("com.axelor.meta.db.MetaTranslation", {
    data: {
      _domain: "self.key = :key",
      _domainContext: {
        key: `value:${key}`,
      },
    },
    sortBy: ["id"],
  });
  const { data = [] } = res || {};
  return data;
}

export async function removeAllTranslations(records) {
  const url = `ws/rest/com.axelor.meta.db.MetaTranslation/removeAll`;
  const res = await Service.post(url, {
    records,
  });
  const { status } = res || {};
  if (status === 0) return true;
  return false;
}

export async function addTranslations(records) {
  const url = `ws/rest/com.axelor.meta.db.MetaTranslation`;
  const res = await Service.post(url, {
    records,
  });
  const { data = [] } = res || {};
  return data;
}

export async function fetchDMNModel(id, options) {
  const res = await Service.fetchId(
    "com.axelor.studio.db.WkfDmnModel",
    id,
    options
  );
  const dmn = (res && res.data && res.data[0]) || {};
  return dmn;
}

export async function getDMNModel(decisionId) {
  if (!decisionId) return;
  const res = await Service.search("com.axelor.studio.db.WkfDmnModel", {
    data: {
      _domain: null,
      _domainContext: {
        _id: null,
        _model: "com.axelor.studio.db.WkfDmnModel",
      },
      operator: "and",
      criteria: [
        {
          fieldName: "dmnTableList.decisionId",
          operator: "=",
          value: decisionId,
        },
      ],
    },
  });
  const { data = [] } = res || {};
  const model = data[0];
  return model;
}

export async function getInfo() {
  const url = `ws/public/app/info`;
  const res = await Service.get(url);
  return res;
}

export async function loadTheme(theme) {
  if (!theme) return;
  const url = `js/theme/${theme}.json`;
  const options = await Service.get(url);
  return { options, theme };
}

export async function getBamlModels(criteria = []) {
  const res = await Service.search("com.axelor.studio.db.BamlModel", {
    data: {
      criteria,
      limit: 40,
    },
  });
  const { data = [] } = res || {};
  return data;
}

export async function getDMNModels(criteria = []) {
  const res = await Service.search("com.axelor.studio.db.DmnTable", {
    data: {
      criteria,
      limit: 40,
    },
  });
  const { data = [] } = res || {};
  return data;
}

export async function getDMNFields(options) {
  const res = await Service.search("com.axelor.studio.db.DmnField", options);
  const { data = [] } = res || {};
  return data;
}

export async function getBPMNModels(options = {}) {
  const res = await Service.search("com.axelor.studio.db.WkfProcess", {
    ...options,
    limit: 40,
    fields: ["name", "wkfModel"],
  });
  const { data = [] } = res || {};
  return data;
}

export async function getMenu(options) {
  const res = await Service.search("com.axelor.meta.db.MetaMenu", {
    ...options,
    limit: 1,
  });
  return (res && res?.data && res?.data[0]) || {};
}

export async function getButtons(models = [], includeAllForms = false) {
  let buttons = [];
  let metaModeNames = [];
  let modelNames = [];
  if (models.length > 0) {
    for (let i = 0; i < models.length; i++) {
      const { type, model, modelFullName, defaultForm } = models[i];
      let formName = defaultForm;
      let allFormViews;
      if (includeAllForms || !formName) {
        const views = await getViews({
          name: model,
          type,
          fullName: modelFullName,
        });
        if (views && views[0]) {
          allFormViews = views.map((v) => v.name);
          formName = views[0].name;
        }
      }
      if (formName) {
        if (type === "metaModel") {
          metaModeNames.push(modelFullName);
        }
        const apis = [];
        if (includeAllForms && allFormViews) {
          for (let i = 0; i < allFormViews.length; i++) {
            apis.push(
              await Service.view({
                data: {
                  name:
                    type === "metaModel"
                      ? allFormViews[i]
                      : `custom-model-${model}-form`,
                  type: "form",
                },
                model,
              })
            );
          }
          const res = await Promise.all(apis);
          let allFormButtons = [];
          res &&
            res.forEach((element) => {
              const formView = element && element.data && element.data.view;
              if (formView) {
                const btns = getItemsByType(formView, "button");
                const menuItems = getItemsByType(formView, "menu-item");
                allFormButtons = [
                  ...allFormButtons,
                  ...(btns || []),
                  ...(menuItems || []),
                ];
              }
            });
          buttons = [...(buttons || []), ...(allFormButtons || [])];
        } else {
          const res = await Service.view({
            data: {
              name:
                type === "metaModel" ? formName : `custom-model-${model}-form`,
              type: "form",
            },
            model,
          });
          const formView = res && res.data && res.data.view;
          if (formView) {
            const btns = getItemsByType(formView, "button");
            const menuItems = getItemsByType(formView, "menu-item");
            buttons = [...buttons, ...(btns || []), ...(menuItems || [])];
          }
        }
      } else {
        if (type === "metaJsonModel") {
          modelNames.push(model);
        }
      }
    }
    if (metaModeNames && metaModeNames.length > 0) {
      for (let i = 0; i < metaModeNames.length; i++) {
        const res = await Service.search(`com.axelor.meta.db.MetaJsonField`, {
          data: {
            criteria: [
              {
                fieldName: "model",
                operator: "like",
                value: metaModeNames[i],
              },
              {
                fieldName: "type",
                operator: "=",
                value: "button",
              },
            ],
            operator: "and",
          },
        });
        const buttonFields = res && res.data;
        if (buttonFields && buttonFields.length > 0) {
          buttons = [...buttons, ...(buttonFields || [])];
        }
      }
    }
    if (modelNames && modelNames.length > 0) {
      for (let i = 0; i < modelNames.length; i++) {
        const res = await Service.get(
          `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${modelNames[i]}`
        );
        const fields = getResultedFields(res);
        const buttonFields = fields.filter((f) => f.type === "button");
        buttons = [...buttons, ...(buttonFields || [])];
      }
    }
    return buttons;
  }
}

export async function uploadFileAPI(blob, headers) {
  let res = await Service.upload(blob, headers);
  if (res && res.result) {
    return res.result;
  }
}

export async function getNameColumn(model) {
  if (!model) return;
  const res = await Service.fetchFields(model);
  if (res.status === 0) {
    const {
      data: { fields },
    } = res || {};
    const nameColumnField = fields?.find((f) => f.nameColumn);
    return nameColumnField?.name || "name";
  }
}

export async function getExpressionValues(model, options) {
  if (!model) return;
  if (model.includes(".")) {
    const res = await Service.search(model, options);
    const { data = [] } = res || {};
    return data;
  } else {
    const res = await Service.search("com.axelor.meta.db.MetaJsonRecord", {
      data: {
        _domain: `self.jsonModel = '${model}'`,
      },
    });
    const { data = [] } = res || {};
    return data;
  }
}

export async function getActions(criteria = []) {
  const entity = `com.axelor.meta.db.MetaAction`;
  const payload = {
    data: {
      _domainContext: { _id: null, _model: entity },
      criteria: [
        ...criteria,
        // these actions are not supported by backend
        {
          fieldName: "type",
          operator: "NOT IN",
          value: [
            "action-validate",
            "action-conditions",
            "action-export",
            "action-view",
          ],
        },
      ],
      operator: "and",
    },
    fields: ["module", "name", "type", "priority"],
    limit: 40,
  };
  const res = await Service.search(entity, payload);
  const { data = [] } = res || {};
  return data;
}

export const getLanguages = async () => {
  const defaultLanguages = [
    {
      value: "en",
      title: "English",
      id: "en",
    },
    {
      value: "fr",
      title: "French",
      id: "fr",
    },
  ];
  const res = await Service.search("com.axelor.meta.db.MetaSelect", {
    fields: ["items"],
    limit: 1,
    sortBy: ["-priority"],
    data: {
      criteria: [
        {
          fieldName: "name",
          operator: "=",
          value: "select.language",
        },
      ],
    },
  });
  const items = res?.data?.[0]?.items?.map((i) => i?.id);
  if (!items?.length) return defaultLanguages;
  const languagesRes = await Service.search(
    "com.axelor.meta.db.MetaSelectItem",
    {
      fields: ["title", "value"],
      data: {
        criteria: [
          {
            fieldName: "id",
            operator: "IN",
            value: items,
          },
        ],
      },
    }
  );
  return languagesRes?.status > -1 ? languagesRes?.data : defaultLanguages;
};

export async function getProcessInstance(instanceId) {
  if (!instanceId) return;
  const entity = `com.axelor.studio.db.WkfInstance`;
  const payload = {
    offset: 0,
    fields: ["instanceId", "currentError", "wkfProcess.wkfModel"],
    limit: 40,
    data: {
      _domain: null,
      _domainContext: {
        _model: "com.axelor.studio.db.WkfInstance",
        _id: null,
      },
      criteria: [
        {
          operator: "and",
          criteria: [
            {
              fieldName: "instanceId",
              value: instanceId,
              operator: "=",
            },
          ],
        },
      ],
    },
  };
  const res = await Service.search(entity, payload);
  const { data = [] } = res || {};
  return data[0];
}

export async function checkConnectAndStudioInstalled() {
  const res = await Service.action({
    action:
      "com.axelor.studio.web.ConnectController:isConnectAndStudioInstalled",
  });
  if (res?.data[0]?.values)
    return res?.data[0]?.values?.isConnectAndStudioInstalled;
}

export async function getOrganization() {
  const res = await Service.action({
    action:
      "com.axelor.studio.pro.web.StudioAppConnectController:getOrganizations",
  });
  const { organizations } = res?.data?.[0]?.values || {};
  return organizations || [];
}

export async function getScenarios(organizationId) {
  if (!organizationId) return [];
  const res = await Service.action({
    action: "com.axelor.studio.pro.web.StudioAppConnectController:getScenarios",
    data: {
      organizationId: Number(organizationId),
    },
  });
  return res?.data[0]?.values?.scenarios || [];
}
