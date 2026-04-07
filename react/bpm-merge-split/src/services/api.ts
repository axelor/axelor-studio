import { ServiceInstance as Service } from "@studio/shared/services";
import type { WkfModel, AxelorResponse, MetaTranslation } from "@studio/shared/types";
import { isAxelorError } from "@studio/shared/types";

export const removeWkf = async (
  id: number,
): Promise<Record<string, unknown> | string | undefined> => {
  const res = await Service.delete("com.axelor.studio.db.WkfModel", id) as AxelorResponse<WkfModel>;
  if (isAxelorError(res)) return (res as unknown as { data?: { message?: string } }).data?.message; // safety: Axelor error response shape is dynamic
  return (res?.data?.[0] as Record<string, unknown>) ?? {};
};

export async function getInfo(): Promise<unknown> {
  const url = `ws/public/app/info`;
  const res = await Service.get(url);
  return res;
}

export async function getTranslations(key: string): Promise<MetaTranslation[] | undefined> {
  if (!key) return;
  const res = await Service.search<MetaTranslation>("com.axelor.meta.db.MetaTranslation", {
    data: {
      _domain: "self.key = :key",
      _domainContext: {
        key: `value:${key}`,
      },
    },
    sortBy: ["id"],
  });
  return res?.data ?? [];
}

export async function getBPMModels(): Promise<WkfModel[]> {
  const entity = `com.axelor.studio.db.WkfModel`;
  const payload = {
    offset: 0,
    sortBy: ["code"],
    fields: ["code", "name", "diagramXml"],
    limit: 40,
    data: {
      _domain: "self.isActive is true",
      _domainContext: {
        _model: "com.axelor.studio.db.WkfModel",
        __check_version: true,
        _id: null,
      },
      _domains: [],
      operator: "and",
      criteria: [],
    },
  };
  const res = await Service.search<WkfModel>(entity, payload);
  return res?.data ?? [];
}

export async function mergeWkfModel(payload: unknown): Promise<Record<string, unknown>> {
  const actionRes = await Service.action(
    "com.axelor.studio.bpm.web.WkfModelController:mergeWkfModel",
    {
      data: { contributor: JSON.stringify(payload) },
    },
  );
  return (actionRes?.data?.[0] as Record<string, unknown>) ?? {};
}
export async function splitWkfModel(payload: unknown): Promise<Record<string, unknown>> {
  const actionRes = await Service.action(
    "com.axelor.studio.bpm.web.WkfModelController:splitWkfModel",
    {
      data: { contributor: JSON.stringify(payload) },
    },
  );
  return (actionRes?.data?.[0] as Record<string, unknown>) ?? {};
}
export async function save(
  ids: Record<string, unknown> = {},
  results: unknown = {},
): Promise<Record<string, unknown>> {
  return await saveAndDeploy(ids, results, false);
}

export async function saveAndDeploy(
  ids: Record<string, unknown> = {},
  results: unknown = {},
  deploy = true,
): Promise<Record<string, unknown>> {
  ids.diagramXml = null;
  const actionRes = await Service.action(
    "com.axelor.studio.bpm.web.WkfModelController:saveAndDeploy",
    {
      data: {
        contributor: JSON.stringify(ids),
        results: JSON.stringify(results),
        deploy: deploy,
      },
    },
  );
  return (actionRes?.data?.[0] as Record<string, unknown>) ?? {};
}
