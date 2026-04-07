import { ServiceInstance as services } from "@studio/shared/services";

export async function getLibraries(_params?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const res = await services.get("ws/rest/com.axelor.studio.db.Library") as Record<string, unknown>;
  return ((res && res.data) || []) as Record<string, unknown>[];
}

export async function getTransformations(libraryId: number | string | undefined) {
  const data = {
    data: {
      criteria: [
        {
          operator: "and",
          criteria: [
            {
              fieldName: "library.id",
              operator: "=",
              value: libraryId,
            },
          ],
        },
      ],
    },
    fields: ["name", "description", "multiArg", "multiArgType", "groovyTemplate", "parameters"],
  };
  const res = await services.search("com.axelor.studio.db.Transformation", data);
  return res && res.data && res.data;
}

export async function getParams(transformationId: number | string | undefined) {
  const data = {
    data: {
      criteria: [
        {
          operator: "and",
          criteria: [
            {
              fieldName: "transformation.id",
              operator: "=",
              value: transformationId,
            },
          ],
        },
      ],
    },
    fields: ["name", "type", "description", "isOptional"],
  };
  const res = await services.search("com.axelor.studio.db.Parameter", data);
  return res && res.data && res.data;
}
