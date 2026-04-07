import { ServiceInstance as services } from "@studio/shared/services";
import type { MetaJsonField, AxelorResponse } from "@studio/shared/types";
import { isAxelorError } from "@studio/shared/types";

import AxelorService from "./index";

export async function getData(model: string): Promise<Record<string, unknown>[] | undefined> {
  const modelService = new AxelorService({ model });
  const res = await modelService.search({}) as AxelorResponse;
  if (isAxelorError(res)) return [];
  return res?.data;
}

export async function getCustomModelData(
  jsonModel: string,
): Promise<Record<string, unknown>[] | undefined> {
  const res = await services.search("com.axelor.meta.db.MetaJsonRecord", {
    data: {
      criteria: [{ fieldName: "jsonModel", operator: "=", value: jsonModel }],
      operator: "and",
    },
  });
  if (isAxelorError(res)) return [];
  return res?.data;
}

export async function getNameField(
  jsonModel: string,
): Promise<MetaJsonField | undefined> {
  const res = await services.search<MetaJsonField>("com.axelor.meta.db.MetaJsonField", {
    data: {
      criteria: [
        { fieldName: "jsonModel", operator: "=", value: jsonModel },
        { fieldName: "nameField", operator: "=", value: true },
      ],
      operator: "and",
    },
    fields: ["name"],
  });
  if (!isAxelorError(res)) {
    return res?.data?.[0];
  }
}
