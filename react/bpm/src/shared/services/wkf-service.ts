import Service from "@studio/shared/services/Service";
import type { WkfModel, WkfInstance } from "@studio/shared/types";

import { WKF_FIELDS, RELATED_FIELDS } from "../../BPMN/Modeler/constants";

export const getWkfModels = async (
  options: Record<string, unknown> = {},
  fields: string[] = [],
): Promise<WkfModel[]> => {
  const res = await Service.search<WkfModel>("com.axelor.studio.db.WkfModel", {
    fields: ["name", ...fields],
    related: {
      wkfProcessList: RELATED_FIELDS,
    },
    data: {
      _domain: `self.isActive is true`,
      ...options,
    },
  });
  return res?.data ?? [];
};

export const fetchWkf = async (id: number | string): Promise<WkfModel> => {
  const res = await Service.fetchId<WkfModel>("com.axelor.studio.db.WkfModel", id, {
    fields: WKF_FIELDS,
    related: {
      wkfProcessList: RELATED_FIELDS,
    },
  });
  return res?.data?.[0] ?? ({} as WkfModel);
};

export const removeWkf = async (id: number | string): Promise<unknown> => {
  const res = await Service.delete("com.axelor.studio.db.WkfModel", id);
  if (res.status === -1) return (res.data?.[0] as Record<string, string>)?.message;
  return res?.data?.[0] ?? {};
};

export async function getProcessConfigModel(
  data: Record<string, unknown> = {},
): Promise<string | undefined> {
  const res = await Service.action({
    action: "action-wkf-process-config-attrs-set-model",
    data: {
      context: { ...data },
    },
    model: "com.axelor.studio.db.WkfProcessConfig",
  });
  const attrs = res?.data?.[0]?.attrs as Record<string, { value?: string }> | undefined;
  if (attrs?.model) {
    return attrs.model.value;
  }
}

export async function getProcessInstance(instanceId: string): Promise<WkfInstance | undefined> {
  if (!instanceId) return;
  const entity = `com.axelor.studio.db.WkfInstance`;
  const payload = {
    offset: 0,
    fields: ["instanceId", "currentError", "wkfProcess.wkfModel"],
    limit: 40,
    data: {
      _domain: null,
      _domainContext: {
        _model: "com.axelor.studio.db.WkfInstance",
        _id: null,
      },
      criteria: [
        {
          operator: "and",
          criteria: [
            {
              fieldName: "instanceId",
              value: instanceId,
              operator: "=",
            },
          ],
        },
      ],
    },
  };
  const res = await Service.search<WkfInstance>(entity, payload);
  return res?.data?.[0];
}
