import React from "react";

import { getModels } from "../services/model-service";

export function getModelFilter(
  _domain: unknown,
  { search }: { search?: string } = {},
): Record<string, unknown> | null {
  if (!_domain && !search) return null;
  return {
    ...(_domain ? { _domain } : {}),
    ...(search ? { criteria: [{ fieldName: "name", operator: "like", value: search }] } : {}),
  };
}

export function useMetaModelSearch(element: unknown, type: string | null) {
  return React.useCallback(
    (data: { search?: string }) => getModels(getModelFilter(element, data), type || undefined),
    [element, type],
  );
}
