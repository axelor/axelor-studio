import { ModelType } from './services/api';
import { VALUE_FROM, lowerCaseFirstLetter } from './utils';
import get from 'lodash/get';

export const getDefaultFrom = (sourceModel) => {
  return sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE;
};

export const getSourceModelString = (list) => {
  let string = '';
  list.forEach((item) => {
    if (string === '') {
      string = item.name;
    } else {
      string = `${string}.${item.name}`;
    }
  });
  return string;
};

let fieldIndex = 0;

export function getBuilderField(field, sourceModel) {
  return {
    ...field,
    key: ++fieldIndex,
    condition: null,
    conditionMeta: null,
    searchField: null,
    dmn: null,
    value: {
      from: sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE,
      selected: null,
      query: null,
    },
  };
}

export function getJSON(object, key) {
  try {
    return JSON.parse(object[key] || '{}');
  } catch {}
  return {};
}

const getTarget = (element) => {
  if (element.target) {
    return element.target.split('.').pop();
  }
  if (element.targetModel) {
    return element.targetModel.split('.').pop();
  }
  return null;
};

const getModelFieldValue = (fields) => {
  let modelFieldText = '';
  if (fields) {
    fields.forEach((field) => {
      if (field.name) {
        const fieldName = lowerCaseFirstLetter(field.name);
        if (modelFieldText) {
          modelFieldText = `${modelFieldText}?.${fieldName}`;
        } else {
          modelFieldText = `${fieldName}`;
        }
      }
    });
  }
  return modelFieldText;
};

const subFieldList = [
  'id',
  'version',
  'title',
  'name',
  'type',
  'fullName',
  'modelType',
  'jsonModel',
  'target',
  'targetModel',
  'targetJsonModel',
  'targetJsonModel.name',
];

const getModelSubField = (subFields = []) => {
  return subFields.map((field) =>
    subFieldList.reduce(
      (obj, key) => ({
        ...obj,
        ...(field[key] !== undefined ? { [key]: field[key] } : {}),
      }),
      {}
    )
  );
};

export function generateJson(data, currentJson, defaultFrom, sourceModel) {
  const getValue = (element) => {
    const { value, dmn } = element;
    const { subFields = [] } = value || {};
    const from = value?.from || defaultFrom;
    let newValue = value?.selected;
    const modelFieldValue = getModelFieldValue(subFields);
    if (from === VALUE_FROM.CONTEXT) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.PROCESS) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SOURCE) {
      if (modelFieldValue) {
        const firstField = subFields[0];
        let sourceModelName = sourceModel?.fullName;
        let fieldName = firstField?.fullName;
        if (sourceModel.modelType === ModelType.CUSTOM) {
          sourceModelName = sourceModel?.name;
        }

        if (firstField.modelType === ModelType.CUSTOM) {
          fieldName = firstField?.name;
        }
        if (fieldName && sourceModelName && fieldName === sourceModelName) {
          newValue = { value: 'SOURCE' };
        } else {
          newValue = { value: modelFieldValue };
        }
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SELF) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (
      [VALUE_FROM.PARENT].includes(from) &&
      newValue?.value &&
      typeof newValue?.value === 'object'
    ) {
      const contextKey = lowerCaseFirstLetter(newValue.value.name);
      if (!modelFieldValue) {
        newValue = { value: contextKey };
      } else {
        newValue = { value: `${contextKey}?.${modelFieldValue}` };
      }
    }

    if ([VALUE_FROM.DMN].includes(from) && newValue?.value) {
      const contextKey = lowerCaseFirstLetter(
        newValue.value.name || newValue.value
      );
      const keys = contextKey && contextKey.split('?.');
      if (keys && keys[0] === dmn?.resultVariable) {
        return {
          value: `${contextKey}`,
        };
      }
      return {
        value: `${dmn?.resultVariable}?.${contextKey}`,
      };
    }

    return newValue || null;
  };

  return data.reduce((list, element) => {
    let { value, type } = element;
    const { fields } = value || {};

    const modelTarget = getTarget(element);
    const jsonTarget = element.jsonTarget;
    const jsonModel = element.jsonModel?.name;
    let newValue = { ...value };

    if (typeof fields === 'object' && fields) {
      newValue.fields = generateJson(value.fields, currentJson);
    }

    newValue.selected = getValue(element);

    if (newValue && !newValue.from) {
      newValue.from = defaultFrom;
    }

    if (
      newValue.selected &&
      ![undefined, null].includes(newValue.selected.value)
    ) {
      const record = {
        name: element.name,
        type,
        target: modelTarget || undefined,
        condition: element.condition,
        conditionMeta: element.conditionMeta,
        value: {
          ...newValue,
          subFields: getModelSubField(newValue.subFields) || undefined,
        },
      };
      if (element.dmn) {
        record.dmn = {
          dmnNodeId: element.dmn.dmnNodeId,
          dmnNodeNameId: element.dmn.dmnNodeNameId,
          name: element.dmn.name,
          resultVariable: element.dmn.resultVariable,
          outputDmnFieldList:
            element.dmn.outputDmnFieldList &&
            element.dmn.outputDmnFieldList.map((f) => {
              return { name: f.name };
            }, []),
        };
      } else {
        delete record.dmn;
      }

      if (element.searchField && element.searchField.name) {
        record.searchField = {
          name: element.searchField && element.searchField.name,
          title: element.searchField && element.searchField.title,
        };
      } else {
        delete record.searchField;
      }

      if (element?.processId?.name) {
        record.processId = element.processId && element.processId.name;
      } else {
        delete record.processId;
      }

      if (type.toLowerCase() === 'many-to-one') {
        record['jsonModel'] = jsonModel || undefined;
        if (!jsonModel && jsonTarget) {
          record['jsonModel'] = jsonTarget || undefined;
        }
      }
      if (type.toLowerCase() === 'json-many-to-one') {
        record['target'] = get(element, 'targetJsonModel.name');
      }

      return [...list, record];
    }
    return list;
  }, []);
}
