import Service from "@studio/shared/services/Service";

interface Criteria {
  fieldName?: string;
  operator?: string;
  value?: unknown;
}

export async function getActions(criteria: Criteria[] = []): Promise<Record<string, unknown>[]> {
  const entity = `com.axelor.meta.db.MetaAction`;
  const payload = {
    data: {
      _domainContext: { _id: null, _model: entity },
      criteria: [
        ...criteria,
        // these actions are not supported by backend
        {
          fieldName: "type",
          operator: "NOT IN",
          value: ["action-validate", "action-conditions", "action-export", "action-view"],
        },
      ],
      operator: "and",
    },
    fields: ["module", "name", "type", "priority"],
    limit: 40,
  };
  const res = await Service.search(entity, payload);
  return res?.data ?? [];
}
