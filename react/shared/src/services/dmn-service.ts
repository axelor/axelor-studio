/**
 * DMN model and field service.
 * Shared between bpm and future dmn-app.
 *
 * @module dmn-service
 */
import { ServiceInstance as Service } from "./Service";
import type { WkfDmnModel, DmnTable, DmnField } from "../types";
import { isAxelorError } from "../types";

export async function fetchDMNModel(
  id: number | string,
  options?: Record<string, unknown>,
): Promise<WkfDmnModel | Record<string, unknown>> {
  const res = await Service.fetchId<WkfDmnModel>("com.axelor.studio.db.WkfDmnModel", id, options);
  if (isAxelorError(res)) return {};
  const dmn = res?.data?.[0] ?? {};
  return dmn;
}

export async function getDMNModel(decisionId: string): Promise<WkfDmnModel | undefined> {
  if (!decisionId) return;
  const res = await Service.search<WkfDmnModel>("com.axelor.studio.db.WkfDmnModel", {
    data: {
      _domain: null,
      _domainContext: {
        _id: null,
        _model: "com.axelor.studio.db.WkfDmnModel",
      },
      operator: "and",
      criteria: [
        {
          fieldName: "dmnTableList.decisionId",
          operator: "=",
          value: decisionId,
        },
      ],
    },
  });
  const data = res?.data ?? [];
  const model = data[0];
  return model;
}

export async function getDMNModels(criteria: Record<string, unknown>[] = []): Promise<DmnTable[]> {
  const res = await Service.search<DmnTable>("com.axelor.studio.db.DmnTable", {
    data: {
      criteria,
      limit: 40,
    },
  });
  const data = res?.data ?? [];
  return data;
}

export async function getDMNFields(options?: Record<string, unknown>): Promise<DmnField[]> {
  const res = await Service.search<DmnField>("com.axelor.studio.db.DmnField", options);
  const data = res?.data ?? [];
  return data;
}
