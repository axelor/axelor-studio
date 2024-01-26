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
