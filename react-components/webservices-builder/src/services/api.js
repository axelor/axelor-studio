import Service from './Service';
import * as _ from 'lodash';
import { getFormName, getItemsByType } from '../utils';

export async function getMetaModal(data) {
  const res = await Service.search('com.axelor.meta.db.MetaModel', {data});
  return res && res.data && res.data[0];
}
export async function deleteRequest(id) {
  const res = await Service.delete('com.axelor.studio.db.WsRequest', id);
  return await res?.json();
}
export async function deleteConnector(id) {
  const res = await Service.delete('com.axelor.studio.db.WsConnector', id);
  return res?.json();
}
export async function deleteAuth(id) {
  const res = await Service.delete('com.axelor.studio.db.WsAuthenticator', id);
  return res?.json();
}
export async function addAuth(criteria = {}) {
  const res = await Service.add(
      'com.axelor.studio.db.WsAuthenticator',
      criteria,
  );
  return res;
}
export async function addConnector(criteria = {}) {
  const res = await Service.add('com.axelor.studio.db.WsConnector', criteria);
  return res;
}
export async function autheticate(criteria) {
  const res = await Service.action(criteria);
  return res;
}
export async function runTestConnector(criteria) {
  const res = await Service.action(criteria);
  return res;
}
export async function getAuthById(id) {
  const res = await Service.fetchRecord(
      'com.axelor.studio.db.WsAuthenticator',
      id,
  );
  return res && res.data &&  res.data[0];
}
export async function getRequestById(id, criteria) {
  const res = await Service.fetchRecord(
      'com.axelor.studio.db.WsRequest',
      id,
      criteria,
  );
  return res && res.data &&  res.data[0];
}
export async function getSubMetaField(
    model,
    relationJsonModel,
    isCollection = false,
    allowAllFields = false,
) {
  if (model === 'com.axelor.meta.db.MetaJsonRecord' && relationJsonModel) {
    const res = await Service.get(
        `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${relationJsonModel}`,
    );
    const result = getResultedFields(res) || [];
    return (
      result &&
      result.filter((r) =>
        isCollection ?
          ['many_to_one', 'one_to_many', 'many_to_many'].includes(
              r.type.toLowerCase(),
          ) :
          allowAllFields ?
          r :
          ['many_to_one', 'many-to-one'].includes(r.type.toLowerCase()),
      )
    );
  } else {
    const data = {
      criteria: [{fieldName: 'fullName', operator: '=', value: model}],
    };
    const metaModel = await getMetaModal(data);
    if (!metaModel) return [];
    const fields = metaModel && metaModel.metaFields.map((f) => f.name);
    const res = await Service.fields({
      fields,
      model: metaModel.fullName,
    });
    const resultFields = res && res.data && res.data.fields;
    return (
      resultFields &&
      resultFields.filter((r) =>
        isCollection ?
          ['many_to_one', 'one_to_many', 'many_to_many'].includes(
              r.type.toLowerCase(),
          ) :
          allowAllFields ?
          r :
          ['many_to_one', 'many-to-one'].includes(r.type.toLowerCase()),
      )
    );
  }
}

export async function getMetaFields(model) {
  if (!model) return [];
  if (model.type === 'metaModel') {
    if (!model.fullName) return [];
    const res = await Service.get(`ws/meta/fields/${model.fullName}`);
    const result = getResultedFields(res);
    return result;
  } else {
    if (!model.name) return [];
    const res = await Service.get(
        `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${model.name}`,
    );
    const result = getResultedFields(res);
    return result || [];
  }
}
export async function getRecords(metaModel) {
  let res = {} ;
  if(metaModel.type ===  "metaModel"){
    res = await Service.search(metaModel.fullName, {});
    return res ? res.data : [];
  }else if(metaModel.type === "metaJsonModel"){
    res = await Service.search("com.axelor.meta.db.MetaJsonRecord", {_domain : `self.jsonModel = ${metaModel.name}`});
    return res ? res.data : [];
  }else{return []
  }
}

export async function getSubFields(){

}

export async function getModels(data = {}, metaModalType, dmnModels) {
  const models =
    ((!metaModalType || metaModalType === 'metaModel') &&
      (await getMetaModels(data, true))) ||
    [];
  const metaJsonModels =
    ((!metaModalType || metaModalType === 'metaJsonModel') &&
      (await getCustomModels(data))) ||
    [];
  const allModels = [];

  for (let i = 0; i < models.length; i++) {
    allModels.push({
      ...models[i],
      type: 'metaModel',
    });
  }
  for (let i = 0; i < metaJsonModels.length; i++) {
    allModels.push({
      ...metaJsonModels[i],
      type: 'metaJsonModel',
    });
  }
  if (dmnModels) {
    for (let i = 0; i < dmnModels.length; i++) {
      allModels.push({
        ...dmnModels[i],
        type: 'dmnModel',
      });
    }
  }
  return allModels || [];
}

export async function getDMNModels(criteria = []) {
  const res = await Service.search('com.axelor.apps.bpm.db.DmnTable', {
    data: {
      criteria,
    },
  });
  const {data = []} = res || {};
  return data;
}

export async function getDMNFields(options) {
  const res = await Service.search('com.axelor.apps.bpm.db.DmnField', options);
  const {data = []} = res || {};
  return data;
}

const getResultedFields = (res) => {
  const responseData = res && res.data;
  const allFields = responseData && responseData.fields;
  const jsonFields = Object.values(
      (responseData && responseData.jsonFields) || [{}],
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

export async function getViews(model, criteria = [], type = 'form') {
  if (!model || !model.name) return [];
  const options = [
    {
      fieldName: 'type',
      operator: '=',
      value: type,
    },
  ];

  if (model.type === 'metaJsonModel') {
    options.push({
      fieldName: 'name',
      operator: '=',
      value: `custom-model-${model.name}-${type}`,
    });
  } else {
    if (!model.fullName) return;
    options.push({
      fieldName: 'model',
      operator: '=',
      value: model.fullName,
    });
  }

  const res = await Service.search(`com.axelor.meta.db.MetaView`, {
    fields: ['name', 'title'],
    data: {
      criteria: [...options, ...criteria],
      operator: 'and',
    },
  });
  const {data = []} = res || {};
  let views = data.filter((val) => val.name !== null);
  views = _.uniqBy(views || [], 'name') || [];
  return views;
}

export async function getButtons(models = []) {
  let buttons = [];
  const metaModeNames = [];
  const modelNames = [];
  if (models.length > 0) {
    for (let i = 0; i < models.length; i++) {
      const {type, model, modelFullName} = models[i];
      let formName = getFormName(model);
      if (formName === 'fetchAPI') {
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
        if (type === 'metaModel') {
          metaModeNames.push(modelFullName);
        }
        const res = await Service.view({
          data: {
            name:
              type === 'metaModel' ? formName : `custom-model-${model}-form`,
            type: 'form',
          },
          model,
        });
        const formView = res && res.data && res.data.view;
        if (formView) {
          const btns = getItemsByType(formView, 'button');
          buttons = [...buttons, ...(btns || [])];
        }
      } else {
        if (type === 'metaJsonModel') {
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
                fieldName: 'model',
                operator: 'like',
                value: metaModeNames[i],
              },
              {
                fieldName: 'type',
                operator: '=',
                value: 'button',
              },
            ],
            operator: 'and',
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
            `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${modelNames[i]}`,
        );
        const fields = getResultedFields(res);
        const buttonFields = fields.filter((f) => f.type === 'button');
        buttons = [...buttons, ...(buttonFields || [])];
      }
    }
    return buttons;
  }
}

export async function getFormViews(formViewNames) {
  const res = await Service.search('com.axelor.meta.db.MetaView', {
    data: {
      _domain:
        'self.type = :type and self.extension IS NULL and self.name in :names',
      _domainContext: {
        type: 'form',
        names: formViewNames && formViewNames.length > 0 ? formViewNames : [''],
      },
    },
    fields: ['name', 'title', 'model'],
  });
  const {data = []} = res || {};
  return data;
}

export async function getMetaModels(criteria = {}) {
  const res = await Service.search("com.axelor.meta.db.MetaModel", {
    data: criteria,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
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
    data: criteria
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data
}

export async function getAllModels(criteria = {}) {
  const models = (await getMetaModels(criteria)) || [];
  const metaJsonModels = (await getCustomModels(criteria)) || [];
  const data = [...models, ...metaJsonModels];
  return data;
}
export async function getAllRequest() {
  const options = {
    fields: ['name', 'id'],
  };
  const res = await Service.search('com.axelor.studio.db.WsRequest', options);
  return res.data;
}
export async function getApps() {
  const options = {
    fields: ['name', 'id'],
  };
  const res = await Service.search('com.axelor.studio.db.StudioApp', options);
  return res.data;
}
export async function getAllConnector() {
  const options = {
    fields: ['name', 'id'],
  };
  const res = await Service.search('com.axelor.studio.db.WsConnector', options);
  return res.data;
}
export async function getConnectorById(id, criteria) {
  const res = await Service.fetchRecord(
      'com.axelor.studio.db.WsConnector',
      id,
      criteria,
  );
  return res && res.data && res.data[0] ;
}

export async function getRequests(criteria = {}) {
  const options = {
    fields: ['name', 'description', 'groovyTemplate', 'parameters'],
  };
  const res = await Service.search('com.axelor.studio.db.WsRequest', options);
  return res.data;
}
export async function getAllAuthentication(criteria = {}) {
  const options = {
    fields: ['name', 'id'],
  };
  const res = await Service.search(
      'com.axelor.studio.db.WsAuthenticator',
      options,
  );
  return res.data;
}

export async function getAuthenticationById() {
  const options = {
    fields: [
      'name',
      'id',
      'studioApp',
      'isAuthenticated',
      'version',
      'refreshTokenResponse',
      'tokenWsRequest',
      'authWsRequest',
      'refreshTokenWsRequest',
      'tokenResponse',
      'authTypeSelect',
      'username',
      'password',
      'responseType',
      'tokenName'
    ],
  };
  const res = await Service.search(
      'com.axelor.studio.db.WsAuthenticator',
      options,
  );
  return res.data;
}
export async function getRequestsById(connectorId) {
  const data = {
    data: {
      criteria: [
        {
          operator: 'and',
          criteria: [
            {
              fieldName: 'wsConnector.id',
              operator: '=',
              value: connectorId,
            },
          ],
        },
      ],
    },
    fields: ['name', 'requestTypeSelect', 'id'],
  };
  const res = await Service.search('com.axelor.studio.db.WsRequest', data);
  return res && res.data && res.data;
}

export async function getkeys(elements) {
  const idFields = [];
  elements?.forEach((element) => {
    idFields.push(element.id);
  });
  const options = {
    fields: [
      'wsKey',
      'wsValue',
      'isList',
      'version',
      'id',
      'subWsKeyValueList',
    ],
    sortBy: ["sequence"],
    data: {
      _domain: 'self.id in (:_field_ids)',
      _domainContext: {
        _field_ids: idFields,
      },
      _archived: true,
    },
    limit: -1,
    translate: true,
  };
  const res = await Service.search('com.axelor.studio.db.WsKeyValue', options);
  return res.data;
}
export async function getHeaderskeys(elements) {
  const idFields = [];
  elements?.forEach((element) => {
    idFields.push(element.id);
  });
  const options = {
    fields: [
      'wsKey',
      'wsValue',
      'isList',
      'version',
      'id',
      'subWsKeyValueList',
    ],
    data: {
      _domain: 'self.id in (:_field_ids)',
      _domainContext: {
        _field_ids: idFields,
      },
      _archived: true,
    },
    limit: -1,
    translate: true,
  };
  const res = await Service.search('com.axelor.studio.db.WsKeyValueSelectionHeader', options);
  return res.data;
}
export async function getLabraries(data) {
  const res = await Service.get('ws/rest/com.axelor.studio.db.Library');
  return res && res.data;
}
export async function getTransformations(libraryId) {
  const data = {
    data: {
      criteria: [
        {
          operator: 'and',
          criteria: [
            {
              fieldName: 'library.id',
              operator: '=',
              value: libraryId,
            },
          ],
        },
      ],
    },
    fields: ['name', 'description','multiArg','multiArgType','groovyTemplate', 'parameters'],
  };
  const res = await Service.search(
      'com.axelor.studio.db.Transformation',
      data,
  );
  return res && res.data && res.data;
}
export async function getParams(transformationId) {
  const data = {
    data: {
      criteria: [
        {
          operator: 'and',
          criteria: [
            {
              fieldName: 'transformation.id',
              operator: '=',
              value: transformationId,
            },
          ],
        },
      ],
    },
    fields: ['name', 'type', 'description',"isOptional"],
  };
  const res = await Service.search('com.axelor.studio.db.Parameter', data);
  return res && res.data && res.data;
}
export async function getPackageFields(model) {
  if (!model) return [];
  let actionRes = await Service.action(
    'com.axelor.apps.tool.web.QueryBuilderController:getCommonFields',
    {
      model: 'com.axelor.meta.db.MetaModel',
      data: {
        context: {
          package: model,
        },
        model: 'com.axelor.meta.db.MetaModel',
      },
    }
  );
  return actionRes && actionRes.data;
}
