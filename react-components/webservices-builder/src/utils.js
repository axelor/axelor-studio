import React from 'react';
import { getkeys } from './services/api';

const download = (entity, name) => {
  const encodedData = encodeURIComponent(entity);
  const dl = document.createElement('a');
  document.body.appendChild(dl);
  dl.setAttribute('href', 'data:image/svg+xml;utf-8,' + encodedData);
  dl.setAttribute('download', name);
  dl.click();
};
function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}
function sortBy(array = [], key) {
  return array.sort(function (a, b) {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

const getSubFieldName = (field) => {
  if(field?.subField){
    let fullName = field.name;
   return  `${fullName}.${getSubFieldName(field.subField)}`
  }
  else{
    return field.name;
  }
} 

function getGroovyBasicPayload(transformations, model, wsValue) {
  const params = transformations && transformations[0]?.operation?.parameters;
  const groovy =
    transformations && transformations[0]?.operation?.groovyTemplate;
  if (groovy) {
    let newGroovy = groovy;
    if(wsValue?.subField){
      newGroovy = newGroovy?.replace(
        '#{target}',
        (model?.name && wsValue.name) ? `${model?.name.toLowerCase()}.${`${wsValue.name}.${getSubFieldName(wsValue.subField)}`}` : `"${wsValue}"`,
      );
    }
    else{
    newGroovy = newGroovy?.replace(
      '#{target}',
      (model?.name && wsValue.name) ? `${model?.name.toLowerCase()}.${wsValue.name}` : `"${wsValue}"`,
    );
    }
    params?.forEach((param) => {
      if (transformations[0]?.operation?.multiArg && !param.name) {
        if (param.type === 'String') {
          newGroovy = newGroovy?.replace(
            `#{_multiArg_}`,
            `"${param?.value}"`,
          );
        } else newGroovy = newGroovy?.replace(`#{_multiArg_`, param?.value);
      }
      else {
        if (param.type === 'String') {
          newGroovy = newGroovy?.replaceAll(
            `#{${param?.name}}`,
            `"${param?.value}"`,
          );
        } else newGroovy = newGroovy?.replaceAll(`#{${param?.name}}`, param?.value);
      }
    });
    transformations?.forEach((trans, id) => {
      if(id !== 0){
        let gr = trans.operation.groovyTemplate;
        trans?.operation?.parameters?.forEach((param) => {
          if (param.type === 'String') {
            gr = gr?.replaceAll(`#{${param?.name}}`, `"${param?.value}"`);
          } else gr = gr?.replaceAll(`#{${param?.name}}`, param?.value);
        });
        newGroovy = gr.replace('#{target}', newGroovy);
      }
    });
    return `\${${newGroovy}}`;
  } else if (model?.name && wsValue.name) {
    if(wsValue?.subField){
      return `\${${model?.name.toLowerCase()}.${`${wsValue.name}.${getSubFieldName(wsValue.subField)}`}}`  
    }
    return `\${${model?.name.toLowerCase()}.${wsValue.name}}`;
  }
  else return wsValue;
}

export const getApiResponseData = (response, { isArrayResponse = true }) => {
  if (response.data && response.data.object != null) {
    return response.data.object;
  }
  return isArrayResponse
    ? response?.data?.data
    : getFirstData(response?.data?.data);
};

export const getFirstData = data => {
  if (data instanceof Array) {
    return data[0];
  }
  return null;
};

function getGroovyListPayload(subKeyValues) {
  let list = [];
  subKeyValues.forEach((payModel) => {
    payModel.payloads.forEach((pay) => {
      if (!pay?.wsKey && !pay?.payloads) {
        list = [...list, pay.wsValue];
      }
      else if (!pay?.wsKey) {
        list.push(groovy(pay, payModel));
      }
      else list.push({ [pay.wsKey]: groovy(pay, payModel) })
    });
  });
  return list;
}

async function fromPayloadsToPayloads(listPayloads) {
  let list = [];
  for (const payload of listPayloads) {
    if (payload?.isList === true) {
      const wsKey = await getkeys(payload.subWsKeyValueList);
      const pays = wsKey ?  await fromPayloadsToPayloads(wsKey) :  []
      list.push({
        ...payload,
        wsValue: [{ id: 1, model: '', payloads: pays }],
      });
    } else if (!payload.isList && payload.subWsKeyValueList.length !== 0) {
      const wsKey = await getkeys(payload.subWsKeyValueList);
      const pays = await fromPayloadsToPayloads(wsKey);
      payload.payloads = pays;
      list = [...list, payload];
    } else {
      list.push(payload);
    }
  }
  return list;
}

function isBPMQuery(type) {
  return type === 'bpmQuery' ? true : false;
}

function groovy(element, model) {
  if (element?.wsValue?.name) {
    return getGroovyBasicPayload(
      element.transformations,
      model,
      element?.wsValue,
    );
  } else if (element.wsValue && !element.isList) {
    return getGroovyBasicPayload(
      element.transformations,
      model,
      element?.wsValue,
    );
  } else if (element.isList) {
    return getGroovyListPayload(element.wsValue);
  } else {
    let object = {};
    element.payloads?.forEach((pay) => {
      object[pay.wsKey] = groovy(pay, element.model);
    });
    return object;
  }
}

export function useDebounce(cb, duration) {
  const timer = React.useRef(null);

  const clearTimer = () => timer.current && clearTimeout(timer.current);
  const setTimer = (cb) => (timer.current = setTimeout(cb, duration));

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  return (...args) => {
    clearTimer();
    setTimer(() => cb(...args));
  };
}

function getItemsByType(view, type) {
  function collectItems(item) {
    const { items = [], jsonFields = [] } = item;
    const allItems = [...items, ...jsonFields];
    return allItems.reduce(
      (all, item) => [...all, ...collectItems(item)],
      item.type === type ? [item] : [],
    );
  }
  return collectItems(view);
}

function getFormName(str) {
  if (!str) return;
  const formString = str.match(/[A-Z][a-z]+/g);
  if (!formString) return;
  if (formString.join('').trim().length !== str.length) {
    return 'fetchAPI';
  }
  const form = formString && formString.join('-');
  return `${form.toLowerCase()}-form`;
}

function translate(str) {
  if (window._t && typeof str === 'string') {
    return window._t(str);
  }
  return str;
}

function pascalToKebabCase(string) {
  return (
    string &&
    string
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
      )
      .map((x) => x.toLowerCase())
      .join('-')
  );
}

function getBool(val) {
  if (!val) return false;
  return !!JSON.parse(String(val).toLowerCase());
}

export {
  download,
  translate,
  pascalToKebabCase,
  getBool,
  getFormName,
  getItemsByType,
  sortBy,
  lowerCaseFirstLetter,
  groovy,
  getGroovyBasicPayload,
  fromPayloadsToPayloads,
  isBPMQuery
};
