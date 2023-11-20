import Service from "./Service";
import { getItemsByType, getFormName } from "../utils";
import * as _ from "lodash";

export async function getMetaModal(data) {
  const res = await Service.search("com.axelor.meta.db.MetaModel", { data });
  return res && res.data && res.data[0];
}

export async function getSubMetaField(
  model,
  relationJsonModel,
  isCollection = false,
  allowAllFields = false
) {
  if (model === "com.axelor.meta.db.MetaJsonRecord" && relationJsonModel) {
    const res = await Service.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${relationJsonModel}`
    );
    let result = getResultedFields(res) || [];
    return (
      result &&
      result.filter((r) =>
        isCollection
          ? ["many_to_one", "one_to_many", "many_to_many"].includes(
              r.type.toLowerCase()
            )
          : allowAllFields
          ? r
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
        isCollection
          ? ["many_to_one", "one_to_many", "many_to_many"].includes(
              r.type.toLowerCase()
            )
          : allowAllFields
          ? r
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

export async function getModels(data = {}, metaModalType, dmnModels) {
  const models =
    ((!metaModalType || metaModalType === "metaModel") &&
      (await getMetaModels(data, true))) ||
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

export async function getDMNModels(criteria = []) {
  const res = await Service.search("com.axelor.studio.db.DmnTable", {
    data: {
      criteria,
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

export async function getViews(model, criteria = [], type = "form") {
  if (!model || !model.name) return [];
  let options = [
    {
      fieldName: "type",
      operator: "=",
      value: type,
    },
  ];

  if (model.type === "metaJsonModel") {
    options.push({
      fieldName: "name",
      operator: "=",
      value: `custom-model-${model.name}-${type}`,
    });
  } else {
    if (!model.fullName) return;
    options.push({
      fieldName: "model",
      operator: "=",
      value: model.fullName,
    });
  }

  const res = await Service.search(`com.axelor.meta.db.MetaView`, {
    fields: ["name", "title"],
    data: {
      criteria: [...options, ...criteria],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  let views = data.filter((val) => val.name !== null);
  views = _.uniqBy(views || [], "name") || [];
  return views;
}

export async function getButtons(models = []) {
  let buttons = [];
  let metaModeNames = [];
  let modelNames = [];
  if (models.length > 0) {
    for (let i = 0; i < models.length; i++) {
      const { type, model, modelFullName } = models[i];
      let formName = getFormName(model);
      if (formName === "fetchAPI") {
        const views = await getViews({
          name: model,
          type,
          fullName: modelFullName,
        });
        if (views && views[0]) {
          formName = views[0].name;
        }
      }
      if (formName) {
        if (type === "metaModel") {
          metaModeNames.push(modelFullName);
        }
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
          buttons = [...buttons, ...(btns || [])];
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

export async function getFormViews(formViewNames) {
  const res = await Service.search("com.axelor.meta.db.MetaView", {
    data: {
      _domain:
        "self.type = :type and self.extension IS NULL and self.name in :names",
      _domainContext: {
        type: "form",
        names: formViewNames && formViewNames.length > 0 ? formViewNames : [""],
      },
    },
    fields: ["name", "title", "model"],
  });
  const { data = [] } = res || {};
  return data;
}

export async function getMetaModels(criteria = {}, allowTitles = false) {
  const res = await Service.search("com.axelor.meta.db.MetaModel", {
    data: criteria,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  if (!allowTitles) {
    return data;
  }
  const defaultForms = data.reduce(async (arrs, item) => {
    const accumulator = await arrs.then();
    const formName = getFormName(item.name);
    if (formName === "fetchAPI") {
      const views = await getViews({
        ...item,
        type: "metaModel",
      });
      if (views && views[0]) {
        accumulator.push(views[0].name);
      }
    } else if (formName) {
      accumulator.push(formName);
    }
    return Promise.resolve(accumulator);
  }, Promise.resolve([]));
  const forms = await defaultForms;
  const formData = await getFormViews(forms);
  const result = data.reduce(async (arrs, item) => {
    const accumulator = await arrs.then();
    const formName = getFormName(item.name);
    if (formName === "fetchAPI") {
      const views = await getViews({
        ...item,
        type: "metaModel",
      });
      if (views && views[0]) {
        accumulator.push({ ...item, title: views[0].title });
      }
    } else if (formName) {
      const form = formData.find((f) => f.name === formName);
      accumulator.push({ ...item, title: form && form.title });
    }
    return Promise.resolve(accumulator);
  }, Promise.resolve([]));
  return result;
}

export async function getCustomModels(criteria = {}) {
  const res = await Service.search("com.axelor.meta.db.MetaJsonModel", {
    data: criteria,
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
