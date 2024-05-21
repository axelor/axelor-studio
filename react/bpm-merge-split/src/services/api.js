import Service from "./Service";

export const removeWkf = async (id) => {
  let res = await Service.delete("com.axelor.studio.db.WkfModel", id);
  if (res && res.status === -1) return res.data && res.data.message;
  const wkf = (res && res.data && res.data[0]) || {};
  return wkf;
};

export async function getInfo() {
  const url = `ws/public/app/info`;
  const res = await Service.get(url);
  return res;
}

export async function getBPMModels() {
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
  const res = await Service.search(entity, payload);
  const { data = [] } = res || {};
  return data;
}

export async function mergeWkfModel(payload) {
  let actionRes = await Service.action(
    "com.axelor.studio.bpm.web.WkfModelController:mergeWkfModel",
    {
      data: { contributor: JSON.stringify(payload) },
    }
  );
  return actionRes?.data?.[0] ?? {};
}
export async function splitWkfModel(payload) {
  let actionRes = await Service.action(
    "com.axelor.studio.bpm.web.WkfModelController:splitWkfModel",
    {
      data: { contributor: JSON.stringify(payload) },
    }
  );
  return actionRes?.data?.[0] ?? {};
}
export async function save(ids = {}, results = {}) {
  return await saveAndDeploy(ids, results, false);
}

export async function saveAndDeploy(ids = {}, results = {}, deploy = true) {
  ids.diagramXml = null;
  let actionRes = await Service.action(
    "com.axelor.studio.bpm.web.WkfModelController:saveAndDeploy",
    {
      data: {
        contributor: JSON.stringify(ids),
        results: JSON.stringify(results),
        deploy: deploy,
      },
    }
  );
  return actionRes?.data?.[0] ?? {};
}
