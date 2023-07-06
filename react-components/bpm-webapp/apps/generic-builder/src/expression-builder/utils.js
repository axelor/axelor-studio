import React from 'react';
import { getModels } from '../services/api';

function getModelFilter(_domain, { search } = {}) {
  if (!_domain && !search) return null;
  return {
    ...(_domain ? { _domain } : {}),
    ...(search
      ? { criteria: [{ fieldName: 'name', operator: 'like', value: search }] }
      : {}),
  };
}

export function useMetaModelSearch(element, type) {
  return React.useCallback(
    data => getModels(getModelFilter(element, data), type),
    [element, type]
  );
}

export function getFormName(str) {
  if (!str) return;
  const formString = str.match(/[A-Z][a-z]+/g);
  if (!formString) return;
  if (formString.join('').trim().length !== str.length) {
    return 'fetchAPI';
  }
  const form = formString && formString.join('-');
  return `${form.toLowerCase()}-form`;
}
