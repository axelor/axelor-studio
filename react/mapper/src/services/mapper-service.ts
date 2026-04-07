/**
 * Mapper-specific API functions.
 * These functions are used only by the mapper app and handle
 * record CRUD, script generation, and custom model operations.
 */
import { ServiceInstance as services } from "@studio/shared/services";

interface ServiceResponse {
  status?: number;
  data?: Record<string, unknown>[];
  [key: string]: unknown;
}

interface RecordParams {
  model: string;
  [key: string]: unknown;
}

export async function saveRecord(
  params: RecordParams,
  record: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const res: ServiceResponse | undefined = await services.add(params.model, record);
  if (res && res.status === -1) return null;
  const { data = [] } = res || {};
  return data[0] || null;
}

export async function fetchRecord(
  model: string,
  id: string | number,
): Promise<Record<string, unknown> | null> {
  const res: ServiceResponse | undefined = await services.fetchRecord(model, id);
  if (res && res.status === -1) return null;
  const { data = [] } = res || {};
  return data[0] || null;
}

export async function generateScriptString(
  jsonString: string,
  model: string,
): Promise<string | undefined> {
  const action = "action-mapper-method-create-script-from-json";
  const data = {
    data: {
      context: {
        _model: model,
        _jsonString: jsonString,
      },
    },
  };
  const { data: responseData = [] } = await services.action(action, data);
  if (
    Array.isArray(responseData) &&
    responseData[0] &&
    responseData[0].values &&
    responseData[0].values._scriptString
  ) {
    return responseData[0].values._scriptString as string;
  }
  return undefined;
}

export async function getData(model: string): Promise<Record<string, unknown>[]> {
  const res: ServiceResponse | undefined = await services.search(model);
  if (res && res.status === -1) return [];
  return (res && res.data) || [];
}

export async function getCustomModelData(jsonModel: string): Promise<Record<string, unknown>[]> {
  const res: ServiceResponse | undefined = await services.search(
    "com.axelor.meta.db.MetaJsonRecord",
    {
      data: {
        criteria: [{ fieldName: "jsonModel", operator: "=", value: jsonModel }],
        operator: "and",
      },
    },
  );
  if (res && res.status === -1) return [];
  return (res && res.data) || [];
}

export async function getCustomModelByDomain(
  jsonModelDomain: string,
): Promise<Record<string, unknown>[]> {
  const res: ServiceResponse | undefined = await services.search(
    "com.axelor.meta.db.MetaJsonRecord",
    {
      data: {
        _domain: jsonModelDomain,
      },
    },
  );
  if (res && res.status === -1) return [];
  return (res && res.data) || [];
}

export async function getNameFieldByDomain(
  jsonModelName: string,
): Promise<Record<string, unknown> | undefined> {
  const res: ServiceResponse | undefined = await services.search(
    "com.axelor.meta.db.MetaJsonField",
    {
      data: {
        _domain: `self.jsonModel.name = '${jsonModelName}' and self.nameField = true`,
      },
      fields: ["name"],
    },
  );
  if (res && (res.status ?? -1) > -1) {
    return res.data && res.data[0];
  }
}

export async function getCustomVariables(): Promise<Record<string, unknown>[]> {
  const res: ServiceResponse | undefined = await services.search(
    "com.axelor.studio.db.CustomVariable",
    {
      data: {
        criteria: [{ fieldName: "status", operator: "=", value: 1 }],
      },
    },
  );
  if (res && res.status === -1) return [];
  return (res && res.data) || [];
}
