import { ServiceInstance as services } from "@studio/shared/services";

export async function getData(model: string) {
  const res = await services.search(model);
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function getCustomModelData(jsonModel: string) {
  const res = await services.search("com.axelor.meta.db.MetaJsonRecord", {
    data: {
      criteria: [{ fieldName: "jsonModel", operator: "=", value: jsonModel }],
      operator: "and",
    },
  });
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function getNameField(jsonModel: string) {
  const res = await services.search("com.axelor.meta.db.MetaJsonField", {
    data: {
      criteria: [
        { fieldName: "jsonModel", operator: "=", value: jsonModel },
        { fieldName: "nameField", operator: "=", value: true },
      ],
      operator: "and",
    },
    fields: ["name"],
  });
  if (res && res.status > -1) {
    return res.data && res.data[0];
  }
}

export async function getRecord(
  model: string,
  id: string | number,
  options?: Record<string, unknown>,
) {
  const res = await services.fetchRecord(model, id, options);
  if (res && res.status === -1) return [];
  return res && res.data && res.data[0];
}

export async function saveRecord(model: string, record: Record<string, unknown>) {
  const res = await services.add(model, record);
  if (res && res.status === -1) return [];
  return res && res.data && res.data[0];
}
