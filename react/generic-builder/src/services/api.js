import services from './Service';
import { uniqBy } from 'lodash';
import { getItemsByType, sortBy } from '../common/utils';
import { ALLOWED_TYPES, QUERY_CUSTOM_TYPES } from '../common/constants';

const getResultedFields = (
  res,
  isQuery,
  isAllowButtons = false,
  isContextValue = false
) => {
  const responseData = res && res.data;
  const allFields = responseData && responseData.fields;
  const jsonFields = Object.values(
    (responseData && responseData.jsonFields) || [{}]
  );
  let result = [];
  const CLONE_ALLOWED_TYPES = [...ALLOWED_TYPES];
  if (isAllowButtons) {
    CLONE_ALLOWED_TYPES.push('button');
  }
  result =
    (allFields &&
      allFields.filter(
        f =>
          !f.json && CLONE_ALLOWED_TYPES.includes((f.type || '').toLowerCase())
      )) ||
    [];

  jsonFields &&
    jsonFields.forEach(jsonField => {
      const nestedFields = Object.values(jsonField || {}) || [];
      let fields =
        nestedFields.filter(
          a =>
            CLONE_ALLOWED_TYPES.includes((a.type || '').toLowerCase()) &&
            (a.type === 'many-to-many' ? a.targetName : true)
        ) || [];
      if (isQuery && !isContextValue) {
        fields =
          fields.filter(
            f => !QUERY_CUSTOM_TYPES.includes((f.type || '').toLowerCase())
          ) || [];
      }
      result = [...result, ...fields];
    });
  return result;
};

export async function getPackageFields(model) {
  if (!model) return [];
  let actionRes = await services.action(
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

const _cache = {
  metaFields: {},
};

export async function getMetaFields(model, isQuery) {
  if (!model) return [];
  const key =
    model.type === 'metaModel'
      ? model.fullName
        ? model.fullName
        : `${model.packageName}.${model.name}`
      : model.name;

  async function fetch() {
    if (model.type === 'metaModel') {
      let res = await services.get(`ws/meta/fields/${key}`);
      let result = getResultedFields(res, isQuery);
      const zonedDateTimeFieldsRes = await services.search(
        'com.axelor.meta.db.MetaField',
        {
          data: {
            _domain: `self.metaModel.name = '${model.name}' AND self.typeName = 'ZonedDateTime'`,
            _domainContext: {
              _model: 'com.axelor.meta.db.MetaField',
            },
          },
          fields: ['name', 'typeName', 'metaModel'],
        }
      );
      const zonedDateTimeFields =
        zonedDateTimeFieldsRes &&
        zonedDateTimeFieldsRes.data &&
        zonedDateTimeFieldsRes.data.length > 0 &&
        zonedDateTimeFieldsRes.data.map(f => f.name);
      if (
        zonedDateTimeFields &&
        zonedDateTimeFields.length > 0 &&
        result &&
        result.length > 0
      ) {
        result = result.map(field => {
          if (zonedDateTimeFields.includes(field.name)) {
            return { ...field, typeName: 'ZonedDateTime' };
          }
          return field;
        });
        return result;
      }
      return sortBy(result, 'name');
    } else {
      const res = await services.get(
        `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${model.name}`
      );
      let result = getResultedFields(res, isQuery);
      return sortBy(result, 'sequence') || [];
    }
  }
  if (_cache.metaFields[key]) {
    return _cache.metaFields[key];
  }
  return (_cache.metaFields[key] = await fetch());
}

export async function getFields(model) {
  const res = await services.get(`ws/meta/fields/${model}`);
  return res || [];
}

export async function getButtons(models = []) {
  let buttons = [];
  let metaModeNames = [];
  let modelNames = [];
  if (models.length > 0) {
    for (let i = 0; i < models.length; i++) {
      const { type, model, modelFullName, defaultForm } = models[i];
      let formName = defaultForm;
      if (!formName) {
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
        const res = await services.view({
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
          const menuItems = getItemsByType(formView, 'menu-item');
          buttons = [...buttons, ...(btns || []), ...(menuItems || [])];
        }
      } else {
        if (type === 'metaJsonModel') {
          modelNames.push(model);
        }
      }
    }
    if (metaModeNames && metaModeNames.length > 0) {
      for (let i = 0; i < metaModeNames.length; i++) {
        const res = await services.search(`com.axelor.meta.db.MetaJsonField`, {
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
        const res = await services.get(
          `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${modelNames[i]}`
        );
        const fields = getResultedFields(res, null, true);
        const buttonFields = fields.filter(f => f.type === 'button');
        buttons = [...buttons, ...(buttonFields || [])];
      }
    }
    return buttons;
  }
}

export async function getSubMetaField(
  model,
  isM2MFields = true,
  isQuery = false,
  relationJsonModel,
  isM2OField = false,
  isContextValue,
  isAllowButtons = false,
  targetField = {}
) {
  const isJsonModel =
    model === 'com.axelor.meta.db.MetaJsonRecord' && relationJsonModel;
  let endpoint = isJsonModel
    ? `com.axelor.meta.db.MetaJsonRecord?jsonModel=${relationJsonModel}`
    : model;
  const res = await getFields(endpoint);
  let result = getResultedFields(res, isQuery, false, isContextValue) || [];
  if (!result) return [];
  if (isQuery && !isContextValue && ALLOWED_TYPES.includes(targetField?.type)) {
    return [
      ...(result.filter(
        val => val?.nameField || val?.name === targetField?.targetName
      ) || []),
      { name: 'id', title: 'Id', type: 'long' },
    ];
  }
  result = result.filter(
    a =>
      ALLOWED_TYPES.includes((a.type || '').toLowerCase()) &&
      (isQuery ? !a.json : true) &&
      ((a.type || '').toLowerCase() === 'many-to-many' ? a.targetName : true)
  );
  if (isAllowButtons) {
    const buttons = await getButtons([
      {
        model: isJsonModel ? relationJsonModel : model?.split('.')?.pop(),
        type: isJsonModel ? 'metaJsonModel' : 'metaModel',
        modelFullName: model,
      },
    ]);
    result = [...(result || []), ...(buttons || [])];
  }

  if (!isM2MFields && result && result.length > 0) {
    return result.filter(
      f =>
        !['many_to_many', 'json_many_to_many'].includes(
          (f && (f.type || '')).toLowerCase().replaceAll('-', '_')
        )
    );
  }
  return sortBy(result, 'sequence') || [];
}

export async function getData(model) {
  const res = await services.search(model);
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function getCustomModelData(jsonModel) {
  const res = await services.search('com.axelor.meta.db.MetaJsonRecord', {
    data: {
      criteria: [{ fieldName: 'jsonModel', operator: '=', value: jsonModel }],
      operator: 'and',
    },
  });
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function getNameField(jsonModel) {
  const res = await services.search('com.axelor.meta.db.MetaJsonField', {
    data: {
      criteria: [
        { fieldName: 'jsonModel', operator: '=', value: jsonModel },
        { fieldName: 'nameField', operator: '=', value: true },
      ],
      operator: 'and',
    },
    fields: ['name'],
  });
  if (res && res.status > -1) {
    return res.data && res.data[0];
  }
}

export async function getModels(data = {}, metaModalType) {
  const models =
    ((!metaModalType || metaModalType === 'metaModel') &&
      (await getMetaModels(data))) ||
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
  return allModels || [];
}

export async function getViews(
  model,
  criteria = [],
  type = 'form',
  isModelAllow = true
) {
  if ((!model || !model.name) && isModelAllow) return [];
  let options = [
    {
      fieldName: 'type',
      operator: '=',
      value: type,
    },
  ];

  if (model?.type === 'metaJsonModel') {
    options.push({
      fieldName: 'name',
      operator: '=',
      value: `custom-model-${model.name}-${type}`,
    });
  }

  if (model?.fullName) {
    options.push({
      fieldName: 'model',
      value: model.fullName,
      operator: '=',
    });
  }

  const res = await services.search(`com.axelor.meta.db.MetaView`, {
    fields: ['name', 'title', 'model'],
    data: {
      criteria: [...options, ...criteria],
      operator: 'and',
    },
  });
  const { data = [] } = res || {};
  let views = Array.isArray(data) && data.filter(val => val.name !== null);
  views = uniqBy(views || [], 'name') || [];
  return views;
}

export async function getFormViews(formViewNames) {
  const res = await services.search('com.axelor.meta.db.MetaView', {
    data: {
      _domain:
        'self.type = :type and (self.extension IS NULL or self.extension IS FALSE) and self.name in :names',
      _domainContext: {
        type: 'form',
        names: formViewNames && formViewNames.length > 0 ? formViewNames : [''],
      },
    },
    fields: ['name', 'title', 'model'],
  });
  const { data = [] } = res || {};
  return data;
}

export async function getMetaModels(_data = {}) {
  const res = await services.search('com.axelor.meta.db.MetaModel', {
    data: _data,
    limit: 20,
    fields: ['name', 'fullName', 'packageName'],
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};

  const models = data.map(m => {
    return m.fullName;
  });

  const views =
    models.length > 0 &&
    (await getViews(
      undefined,
      [
        {
          fieldName: 'model',
          value: models,
          operator: 'IN',
        },
        {
          operator: 'or',
          criteria: [
            {
              fieldName: 'extension',
              operator: 'IS NULL',
            },
            {
              fieldName: 'extension',
              operator: '=',
              value: false,
            },
          ],
        },
      ],
      undefined,
      false
    ));

  let result = [];
  data.forEach(d => {
    views.forEach(v => {
      if (v.model === d.fullName) {
        result.push({ ...d, title: v.title });
      }
    });
  });
  return uniqBy(result, 'id');
}

export async function getCustomModels(_data = {}) {
  const res = await services.search('com.axelor.meta.db.MetaJsonModel', {
    data: _data,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}

export async function getRecord(model, id, options) {
  const res = await services.fetchRecord(model, id, options);
  if (res && res.status === -1) return [];
  return res && res.data && res.data[0];
}

export async function saveRecord(model, record) {
  const res = await services.add(model, record);
  if (res && res.status === -1) return [];
  return res && res.data && res.data[0];
}

export async function fetchUserPreferences() {
  const userInfo = await services.info();
  return userInfo;
}

export async function getCustomVariables() {
  const res = await services.search('com.axelor.studio.db.CustomVariable', {
    data: {
      criteria: [{ fieldName: 'status', operator: '=', value: 1 }],
    },
  });
  if (res && res.status === -1) return [];
  return (res && res.data) || [];
}
